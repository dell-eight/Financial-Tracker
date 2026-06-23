"""
Generates all Expo icon assets from assets/Logo_without_bg.webp.
Usage: python scripts/generate-icons.py
"""

import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Missing dependency. Run: pip install pillow")
    sys.exit(1)

ROOT = Path(__file__).parent.parent
SRC  = ROOT / "assets" / "Logo_without_bg.webp"
OUT  = ROOT / "assets"

# Light mode background — matches lightColors.bg.base (#FBFBFF)
LIGHT_BG = (251, 251, 255, 255)

# Dark mode background — matches the dark hero card navy
DARK_BG  = (13, 17, 35, 255)


def fit_on_canvas(
    subject: Image.Image,
    canvas_size: int,
    padding_fraction: float = 0.15,
    bg_color: tuple | None = None,
) -> Image.Image:
    """Centers subject on a square canvas with padding. bg_color=None → transparent."""
    pad   = int(canvas_size * padding_fraction)
    inner = canvas_size - 2 * pad
    img   = subject.copy().convert("RGBA")
    img.thumbnail((inner, inner), Image.LANCZOS)
    sw, sh = img.size
    canvas = Image.new("RGBA", (canvas_size, canvas_size), bg_color or (0, 0, 0, 0))
    canvas.paste(img, ((canvas_size - sw) // 2, (canvas_size - sh) // 2), img)
    return canvas


def to_monochrome(subject: Image.Image) -> Image.Image:
    """Replaces all visible pixels with white, keeping alpha intact."""
    r, g, b, a = subject.convert("RGBA").split()
    white = Image.new("L", subject.size, 255)
    return Image.merge("RGBA", (white, white, white, a))


def save(img: Image.Image, path: Path, mode: str = "RGBA") -> None:
    img.convert(mode).save(path, format="PNG", optimize=True)
    print(f"  wrote {path.relative_to(ROOT)}")


def main() -> None:
    print(f"Loading {SRC.relative_to(ROOT)} …")
    logo = Image.open(SRC).convert("RGBA")

    print("Generating assets …")

    # icon.png — 1024×1024 on light-mode white (#FBFBFF), 15% padding
    save(fit_on_canvas(logo, 1024, padding_fraction=0.15, bg_color=LIGHT_BG),
         OUT / "icon.png", mode="RGB")

    # icon-dark.png — 1024×1024 on dark navy, 15% padding (iOS dark mode, iOS 18+)
    save(fit_on_canvas(logo, 1024, padding_fraction=0.15, bg_color=DARK_BG),
         OUT / "icon-dark.png", mode="RGB")

    # adaptive-icon.png — 1024×1024 transparent, logo in safe zone (17% = inner 66%)
    save(fit_on_canvas(logo, 1024, padding_fraction=0.17),
         OUT / "adaptive-icon.png")

    # adaptive-icon-monochrome.png — white silhouette, transparent (Android 13+ themed)
    save(fit_on_canvas(to_monochrome(logo), 1024, padding_fraction=0.17),
         OUT / "adaptive-icon-monochrome.png")

    # splash-icon.png — 512×512 transparent (app.json backgroundColor fills the rest)
    save(fit_on_canvas(logo, 512, padding_fraction=0.10),
         OUT / "splash-icon.png")

    # favicon.png — 48×48 on light-mode white
    save(fit_on_canvas(logo, 48, padding_fraction=0.08, bg_color=LIGHT_BG),
         OUT / "favicon.png", mode="RGB")

    print("\nDone. Icons written to assets/")


if __name__ == "__main__":
    main()
