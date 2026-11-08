"""Mechanically pack the supplied jump APNGs, retaining their original timing.

Usage: python3 scripts/pack-jumps.py /path/to/一段跳.png.zip /path/to/二段跳.png.zip
Requires Pillow. Uploads are read only. No repainting or AI-generated art is used.

The APNGs animate their position inside differently sized canvases. The game
already supplies that trajectory through physics, so each complete alpha pose
is registered at its bottom and the original shared horizontal canvas center.
Every pose uses the same 1/3 raster scale and 1137px source reference height;
there is no individual pose stretching or normalization.
"""
from argparse import ArgumentParser
from io import BytesIO
from pathlib import Path
import hashlib
import json
import math
import zipfile

from PIL import Image


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def read_source(path):
    with zipfile.ZipFile(path) as archive:
        names = [name for name in archive.namelist()
                 if name.lower().endswith('.png') and not name.startswith('__MACOSX/')]
        if len(names) != 1:
            raise ValueError(f'{path}: expected one APNG in the supplied ZIP')
        raw = archive.read(names[0])
    source = Image.open(BytesIO(raw))
    if not source.is_animated or source.info.get('default_image', False):
        raise ValueError(f'{path}: expected APNG animation with no separate default image')
    frames, durations, bounds = [], [], []
    for index in range(source.n_frames):
        source.seek(index)
        frame = source.convert('RGBA')
        alpha_bounds = frame.getchannel('A').getbbox()
        if alpha_bounds is None:
            raise ValueError(f'{path}: frame {index} has no visible alpha')
        duration = source.info.get('duration')
        if duration is None or duration <= 0:
            raise ValueError(f'{path}: frame {index} has no positive source duration')
        frames.append(frame.copy())
        durations.append(duration)
        bounds.append(list(alpha_bounds))
    return {
        'path': path, 'raw': raw, 'size': source.size,
        'frames': frames, 'durations': durations, 'bounds': bounds,
    }


def pack(source, key, reference_height, output):
    source_width = source['size'][0]
    # Both supplied canvases share a width divisible by 3. Padding prevents
    # neighboring frames from bleeding when WebGL samples the atlas.
    if source_width % 3 or reference_height % 3:
        raise ValueError('Expected dimensions divisible by the exact shared 1/3 scale')
    padding = 2
    raster_width, raster_height = source_width // 3, reference_height // 3
    frame_width, frame_height = raster_width + padding * 2, raster_height + padding * 2
    unique, sequence, prior_pixels = [], [], None
    for index, frame in enumerate(source['frames']):
        pixels = frame.tobytes()
        if pixels == prior_pixels:
            sequence[-1]['duration'] += source['durations'][index]
            sequence[-1]['sourceFrameIndices'].append(index)
            continue
        # Retain all source X coordinates. Only baked vertical canvas movement
        # is removed: full-alpha bottom is the physical feet/board baseline.
        left, top, right, bottom = source['bounds'][index]
        registered = Image.new('RGBA', (source_width, reference_height))
        registered.paste(frame.crop((0, top, source_width, bottom)),
                         (0, reference_height - (bottom - top)))
        raster = registered.resize((raster_width, raster_height), Image.Resampling.LANCZOS)
        unique.append(raster)
        sequence.append({'key': key, 'frame': len(unique) - 1,
                         'duration': source['durations'][index],
                         'sourceFrameIndices': [index]})
        prior_pixels = pixels
    atlas = Image.new('RGBA', (frame_width * len(unique), frame_height))
    for index, frame in enumerate(unique):
        atlas.paste(frame, (index * frame_width + padding, padding))
    output.mkdir(parents=True, exist_ok=True)
    image_path = output / f'{key}.png'
    atlas.save(image_path, optimize=True)
    metadata = {
        'sourceUpload': source['path'].name,
        'sourceZipSha256': sha256(source['path'].read_bytes()),
        'sourceSha256': sha256(source['raw']),
        'sourceSize': list(source['size']),
        'sourceFrameCount': len(source['frames']),
        'sourceFrameDurationsMs': source['durations'],
        'sourceFrameAlphaBounds': source['bounds'],
        'sourceDefaultImage': False,
        'sourceLoopCount': 0,
        'durationMs': sum(source['durations']),
        'frameWidth': frame_width, 'frameHeight': frame_height,
        'uniquePoseCount': len(unique),
        'referenceHeight': raster_height,
        'originX': (padding + source_width / 6) / frame_width,
        'originY': (padding + raster_height) / frame_height,
        'registration': {
            'sourceAnchorX': source_width / 2,
            'sourceReferenceHeight': reference_height,
            'rasterScale': 1 / 3,
            'padding': padding,
            'verticalAnchor': 'per-frame full-alpha bottom',
            'bakedCanvasTranslationRemoved': True,
        },
        'atlasSha256': sha256(image_path.read_bytes()),
        'frames': sequence,
    }
    (output / f'{key}.json').write_text(json.dumps(metadata, indent=2) + '\n')
    print(f'{key}: {len(source["frames"])} frames, {len(unique)} poses, '
          f'{metadata["durationMs"]}ms, {atlas.width}×{atlas.height}, '
          f'{image_path.stat().st_size} bytes')


def main():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument('first', type=Path)
    parser.add_argument('double', type=Path)
    parser.add_argument('--out', type=Path, default=Path('public/assets'))
    args = parser.parse_args()
    sources = [read_source(args.first), read_source(args.double)]
    # A single scale keeps matching poses identical in size between animations.
    reference_height = math.ceil(max(bounds[3] - bounds[1]
                                    for source in sources for bounds in source['bounds']) / 3) * 3
    for source, key in zip(sources, ['jump-first', 'jump-double']):
        pack(source, key, reference_height, args.out)


if __name__ == '__main__':
    main()
