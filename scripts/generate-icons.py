"""
Genera los iconos PWA de choponet (192x192 y 512x512).

Diseño: cuadrado redondeado oscuro (#0f0f14) con "C." centrado en accent (#ff3366).
Compatible con masking adaptativo (icon importante dentro del 80% safe zone).

Uso:
    python scripts/generate-icons.py

Salida:
    icons/icon-192.png
    icons/icon-512.png
    icons/favicon.png (32x32)
"""

from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ICONS_DIR = ROOT / "icons"

BG_COLOR = (15, 15, 20)         # var(--color-bg)
ACCENT = (255, 51, 102)         # var(--color-accent)
TEXT_COLOR = (240, 240, 245)    # var(--color-text)


def load_bold_font(size: int):
    candidates = [
        "C:/Windows/Fonts/segoeuib.ttf",
        "C:/Windows/Fonts/arialbd.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def draw_icon(size: int) -> Image.Image:
    img = Image.new("RGB", (size, size), BG_COLOR)
    draw = ImageDraw.Draw(img)

    radius = int(size * 0.22)
    draw.rounded_rectangle(
        [(0, 0), (size, size)],
        radius=radius,
        fill=BG_COLOR,
    )

    accent_band_height = int(size * 0.06)
    draw.rectangle(
        [(0, size - accent_band_height), (size, size)],
        fill=ACCENT,
    )

    font_size = int(size * 0.62)
    font = load_bold_font(font_size)

    text = "C"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    text_x = (size - text_w) // 2 - bbox[0]
    text_y = (size - text_h) // 2 - bbox[1] - int(size * 0.05)
    draw.text((text_x, text_y), text, fill=TEXT_COLOR, font=font)

    dot_radius = int(size * 0.06)
    dot_cx = text_x + text_w + int(size * 0.04)
    dot_cy = text_y + text_h - int(size * 0.02)
    draw.ellipse(
        [
            (dot_cx - dot_radius, dot_cy - dot_radius),
            (dot_cx + dot_radius, dot_cy + dot_radius),
        ],
        fill=ACCENT,
    )

    return img


def main() -> None:
    ICONS_DIR.mkdir(parents=True, exist_ok=True)

    sizes = {
        "icon-192.png": 192,
        "icon-512.png": 512,
        "favicon.png": 32,
    }

    for name, size in sizes.items():
        out_path = ICONS_DIR / name
        icon = draw_icon(size)
        icon.save(out_path, "PNG", optimize=True)
        print(f"  [OK] {out_path.relative_to(ROOT)} ({size}x{size})")

    print("\nDone.")


if __name__ == "__main__":
    main()
