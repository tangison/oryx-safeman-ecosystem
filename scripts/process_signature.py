#!/usr/bin/env python3
"""Principal signature pipeline - Oryx Institute.

Contract (MASTER UPGRADE BRIEF part 2):
  Input  : assets/raw_signature.jpg  (photo/scan of the Principal's signature on
           ruled paper; jpg, png or tif accepted)
  Process: grayscale -> flat-field background removal (adaptive threshold that
           kills the ruled lines and uneven lighting) -> ink mask -> RGBA ink
           tinted #181514 -> getbbox() crop -> normalise to 240 px height
  Output : public/assets/signatures/principal_signature.png (+ .webp)
  Fallback: if no raw file exists, generate a deterministic high-resolution
           vector-ink signature plate ("T. Iigonda" cursive masthead) through the
           same normalisation + export path.

Both consumers (client PDF certificate engine, Word doc builders) embed
public/assets/signatures/principal_signature.png in place of any unsigned
placeholder. Re-run after dropping a better raw scan.
"""
from __future__ import annotations

import math
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
RAW_CANDIDATES = ["assets/raw_signature.jpg", "assets/raw_signature.jpeg",
                  "assets/raw_signature.png", "assets/raw_signature.tif",
                  "assets/raw_signature.tiff"]
OUT_DIR = ROOT / "public" / "assets" / "signatures"
INK = (24, 21, 20)  # #181514
TARGET_H = 240      # normalised signature height (brief spec)
SUPER = 4           # supersampling for the vector fallback


# ---------------------------------------------------------------- pipeline --
def extract_ink_rgba(src: Path) -> Image.Image:
    """Flat-field + threshold extraction of ink strokes from a photographed page."""
    gray = Image.open(src).convert("L")

    # Background estimate: max-filter (erodes dark strokes) + blur = paper + lines
    scale = 8
    small = gray.resize((gray.width // scale, gray.height // scale), Image.BILINEAR)
    bg_small = small.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(4))
    background = bg_small.resize(gray.size, Image.BILINEAR)

    # Flat-field division: result ~1.0 on paper (even over ruled lines), << 1 on ink
    g_px, b_px = gray.load(), background.load()
    w, h = gray.size
    ratio = Image.new("L", (w, h), 255)
    r_px = ratio.load()
    for y in range(h):
        for x in range(w):
            b = max(1, b_px[x, y])
            v = int(min(255, max(0, (g_px[x, y] / b) * 255)))
            r_px[x, y] = v

    # Adaptive threshold: ink is where the corrected ratio dips below ~88%
    # alpha ramp keeps anti-aliased stroke edges smooth
    ink = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    i_px = ink.load()
    thr_lo, thr_hi = 216, 240  # ratio 0.85..0.94
    for y in range(h):
        for x in range(w):
            v = r_px[x, y]
            if v >= thr_hi:
                continue
            if v <= thr_lo:
                a = 255
            else:
                a = int(255 * (thr_hi - v) / (thr_hi - thr_lo))
            i_px[x, y] = (INK[0], INK[1], INK[2], a)

    # Slight closing to solidify strokes broken by scan noise
    alpha = ink.split()[3].filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))
    ink.putalpha(alpha)
    return ink


def normalise(sig: Image.Image, target_h: int = TARGET_H) -> Image.Image:
    bbox = sig.getbbox()
    if not bbox:
        raise SystemExit("ERROR: signature extraction produced an empty image")
    sig = sig.crop(bbox)
    ratio = target_h / sig.height
    sig = sig.resize((max(1, round(sig.width * ratio)), target_h), Image.LANCZOS)
    return sig


def export(sig: Image.Image, stem: str = "principal_signature") -> tuple[Path, Path]:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    png_path = OUT_DIR / f"{stem}.png"
    webp_path = OUT_DIR / f"{stem}.webp"
    sig.save(png_path, "PNG", optimize=True)
    sig.save(webp_path, "WEBP", quality=92, method=6)
    return png_path, webp_path


# ------------------------------------------------------ vector fallback ----
def _bez(p0, p1, p2, p3, t: float):
    mt = 1 - t
    x = mt**3 * p0[0] + 3 * mt**2 * t * p1[0] + 3 * mt * t**2 * p2[0] + t**3 * p3[0]
    y = mt**3 * p0[1] + 3 * mt**2 * t * p1[1] + 3 * mt * t**2 * p2[1] + t**3 * p3[1]
    return x, y


def _stroke(draw: ImageDraw.ImageDraw, pts, width_fn):
    """Draw a smooth polyline with modulating pen width (pressure simulation)."""
    n = len(pts)
    for i in range(n - 1):
        (x0, y0), (x1, y1) = pts[i], pts[i + 1]
        w = width_fn(i / max(1, n - 1))
        steps = max(1, int(math.hypot(x1 - x0, y1 - y0)))
        for s in range(steps):
            t = s / steps
            x, y = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
            draw.ellipse([x - w / 2, y - w / 2, x + w / 2, y + w / 2], fill=INK)


def _curve(p0, p1, p2, p3, samples=64):
    return [_bez(p0, p1, p2, p3, i / samples) for i in range(samples + 1)]


def generate_vector_signature() -> Image.Image:
    """Deterministic cursive 'T. Iigonda' masthead plate - high-res vector ink."""
    W, H = 1280 * SUPER // 4, 520 * SUPER // 4  # 320 x 130 logical * SUPER
    W, H = 1280, 520
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    def wobble(i):
        # pen pressure: heavier at stroke starts, lighter through connectors
        return (11 - 4.5 * math.sin(i * math.pi)) * (W / 1280)

    # --- Capital T with swept serif base ---
    t_bar = _curve((150, 150), (260, 120), (420, 118), (560, 132))
    _stroke(d, t_bar, lambda i: (10.5 - 2.2 * math.sin(i * math.pi)) * (W / 1280))
    t_stem = _curve((370, 128), (352, 200), (330, 300), (300, 392))
    _stroke(d, t_stem, wobble)
    # tail sweep of the T
    _stroke(d, _curve((300, 392), (285, 430), (330, 438), (390, 420)), lambda i: (7.5 - 2 * i) * (W / 1280))

    # --- Period ---
    d.ellipse([432, 402, 452, 422], fill=INK)

    # --- lowercase I (with dot) ---
    _stroke(d, _curve((492, 244), (484, 300), (478, 352), (468, 398)), wobble)
    d.ellipse([474, 176, 496, 198], fill=INK)

    # --- i-g-o-n-d-a cursive body ---
    _stroke(d, _curve((540, 240), (560, 300), (548, 360), (516, 402)), wobble)          # i
    d.ellipse([528, 172, 550, 194], fill=INK)
    _stroke(d, _curve((556, 300), (610, 246), (688, 262), (678, 330)), wobble)          # g bowl
    _stroke(d, _curve((678, 330), (672, 392), (640, 438), (600, 428)), wobble)          # g descender
    _stroke(d, _curve((600, 428), (560, 416), (566, 380), (596, 356)), lambda i: (6.5 - 1.8 * i) * (W / 1280))
    _stroke(d, _curve((700, 318), (690, 380), (716, 412), (760, 392)), wobble)          # o
    _stroke(d, _curve((704, 322), (744, 250), (798, 240), (826, 282)), wobble)
    _stroke(d, _curve((760, 392), (800, 372), (818, 330), (826, 282)), wobble)
    _stroke(d, _curve((826, 282), (836, 330), (836, 372), (856, 398)), wobble)          # n
    _stroke(d, _curve((856, 398), (872, 418), (902, 402), (912, 368)), wobble)
    _stroke(d, _curve((912, 300), (920, 340), (912, 372), (918, 396)), wobble)
    _stroke(d, _curve((918, 396), (938, 380), (972, 322), (1004, 282)), wobble)         # d ascender
    _stroke(d, _curve((968, 260), (972, 320), (962, 380), (948, 420)), wobble)
    _stroke(d, _curve((1004, 282), (1010, 340), (1000, 396), (962, 428)), wobble)       # a
    _stroke(d, _curve((962, 428), (930, 448), (908, 420), (926, 390)), wobble)
    # signature finish flourish
    _stroke(d, _curve((1030, 330), (1100, 300), (1170, 296), (1226, 316)),
            lambda i: (7.0 - 3.2 * i) * (W / 1280))

    # downsample for crispness
    img = img.resize((W // SUPER, H // SUPER), Image.LANCZOS)
    return normalise(img, TARGET_H)


def main() -> int:
    raw = next((ROOT / c for c in RAW_CANDIDATES if (ROOT / c).exists()), None)
    if raw:
        print(f"[signature] source found: {raw.name} - running extraction pipeline")
        sig = normalise(extract_ink_rgba(raw))
        mode = "extracted"
    else:
        print("[signature] no assets/raw_signature.* found - generating vector-ink fallback plate")
        print("            (drop a scan at assets/raw_signature.jpg and re-run to swap it)")
        sig = generate_vector_signature()
        mode = "vector-fallback"
    png, webp = export(sig)
    kb = png.stat().st_size / 1024
    print(f"[signature] {mode}: {sig.width}x{sig.height}px -> {png.relative_to(ROOT)} ({kb:.0f} KB)")
    print(f"[signature] webp -> {webp.relative_to(ROOT)} ({webp.stat().st_size / 1024:.0f} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
