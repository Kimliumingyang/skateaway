"""Build compact runtime strips from the supplied v2.1 animation archives."""
from io import BytesIO
from pathlib import Path
from zipfile import ZipFile
from argparse import ArgumentParser
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "public/assets"
parser = ArgumentParser(description=__doc__)
parser.add_argument("--seagull", required=True, type=Path)
parser.add_argument("--balloon", required=True, type=Path)
parser.add_argument("--double-jump", required=True, type=Path)
args = parser.parse_args()
SOURCES = {
    "seagull": (args.seagull, {
        "fly": 8, "idle": 4, "squawk": 4, "hit": 4, "fall": 4, "disappear": 3,
    }),
    "balloon": (args.balloon, {
        "idle": 5, "bob": 5, "shake": 5, "pop": 5,
    }),
}
for kind, (path, animations) in SOURCES.items():
    with ZipFile(path) as archive:
        for name, count in animations.items():
            source = f"strips/{name}_strip.png" if kind == "balloon" else f"{name}_strip.png"
            image = Image.open(BytesIO(archive.read(source))).convert("RGBA")
            assert image.size == (512 * count, 512), (source, image.size)
            strip = Image.new("RGBA", (192 * count, 192))
            for index in range(count):
                frame = image.crop((index * 512, 0, (index + 1) * 512, 512))
                strip.paste(frame.resize((192, 192), Image.Resampling.LANCZOS), (index * 192, 0))
            strip.save(DEST / f"{kind}-{name}.png", optimize=True)

with ZipFile(args.double_jump) as archive:
    source = "SkateAway_DoubleJump_Codex_Ready/double_jump_sheet_4x2.png"
    sheet = Image.open(BytesIO(archive.read(source))).convert("RGBA")
    assert sheet.size == (362 * 4, 543 * 2)
    sheet.save(DEST / "jump-double-v21.png", optimize=True)
