"""Pack the supplied APNG ZIP without changing poses, alpha, anchors or timing.
Usage: python3 scripts/pack-crash.py /path/to/摔倒.png.zip
Requires Pillow. The original upload is read only; no Asset.zip processing.
"""
from io import BytesIO
from pathlib import Path
import hashlib
import json
import sys
import zipfile
from PIL import Image

with zipfile.ZipFile(sys.argv[1]) as archive:
    names = [n for n in archive.namelist() if n.lower().endswith('.png') and not n.startswith('__MACOSX/')]
    if len(names) != 1:
        raise ValueError('Expected one APNG in the supplied ZIP')
    raw = archive.read(names[0])
source = Image.open(BytesIO(raw))
if not source.is_animated:
    raise ValueError('Expected an animated PNG, not a still image')
unique = []
sequence = []
for index in range(source.n_frames):
    source.seek(index)
    frame = source.convert('RGBA')
    duration = source.info.get('duration', 34)
    if unique and frame.tobytes() == unique[-1].tobytes():
        sequence[-1]['duration'] += duration
    else:
        unique.append(frame.copy())
        sequence.append({'key': 'crash', 'frame': len(unique) - 1, 'duration': duration})
width, height = 616, 412
atlas = Image.new('RGBA', (width * len(unique), height))
for index, frame in enumerate(unique):
    atlas.alpha_composite(frame.resize((width, height), Image.Resampling.LANCZOS), (index * width, 0))
out = Path('public/assets')
out.mkdir(parents=True, exist_ok=True)
atlas.save(out / 'crash.png', optimize=True)
metadata = {
    'sourceSha256': hashlib.sha256(raw).hexdigest(),
    'sourceSize': list(source.size),
    'sourceFrameCount': source.n_frames,
    'frameWidth': width, 'frameHeight': height,
    'originX': 1049.5 / 2048, 'originY': 1252 / 1372,
    'durationMs': sum(f['duration'] for f in sequence),
    'frames': sequence,
}
(out / 'crash.json').write_text(json.dumps(metadata, indent=2) + '\n')
print(json.dumps(metadata, indent=2))
