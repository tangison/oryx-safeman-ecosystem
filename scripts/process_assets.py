#!/usr/bin/env python3
"""
process_assets.py — Lightweight illustration, watermark-crop & dual export pipeline.

Pipeline for every asset (build spec 3.2):
  1. Deterministic watermark crop  — bottom 60px of any raw image is removed.
  2. Background handling           — photo plates keep their cream ground (brand style);
                                     equipment diagrams are drawn as flat vector-style art
                                     on transparent alpha.
  3. Brand stamp                   — bottom-right corner watermark:
                                     "SAFEMAN // SAFEMAN.ORYXINSTITUTE.ORG" (#14532D, 45%)
                                     or "ORYX INSTITUTE // ORYXINSTITUTE.ORG" (#6A1B29).
  4. Dual ultra-light export       — webp max 960px, q=80, method=6, budget < 45KB;
                                     PNG 180dpi print column, quantized 8-bit, budget < 90KB.

Style: simple, flat, reduced, technical. Flat Forest Green / Maroon + slate + cream.
"""
import os, math
from PIL import Image, ImageDraw, ImageFont, ImageEnhance

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_SAFETY = os.path.join(ROOT, "templates", "oryx_v3", "..", "..", "pkg_cache_safety")
PKG = "/home/z/my-project/pkg/v3/Oryx_Build_Package_v3"
WEBP = os.path.join(ROOT, "public", "assets", "webp")
PNGD = os.path.join(ROOT, "public", "assets", "png")
LOGO = os.path.join(ROOT, "public", "assets", "logos")
for d in (WEBP, PNGD, LOGO):
    os.makedirs(d, exist_ok=True)

GREEN = (20, 83, 45, 255)       # 14532D
EMERALD = (22, 163, 74, 255)    # 16A34A
MAROON = (106, 27, 41, 255)     # 6A1B29
CREAM = (250, 246, 240, 255)    # FAF6F0
SLATE = (44, 38, 35, 255)       # 2C2623
SAGE = (198, 216, 200, 255)

FONT_R = "/home/z/my-project/oryx-safety-academy/assets/fonts/Radley-Regular.ttf"
FONT_I = "/home/z/my-project/oryx-safety-academy/assets/fonts/Inter_24pt-Regular.ttf"
FONT_ISB = "/home/z/my-project/oryx-safety-academy/assets/fonts/Inter_24pt-SemiBold.ttf"

def stamp(im, text, color, alpha=115):
    im = im.convert("RGBA")
    w, h = im.size
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    fs = max(11, int(w * 0.018))
    f = ImageFont.truetype(FONT_ISB, fs)
    tw = d.textlength(text, font=f)
    d.text((w - tw - fs, h - int(fs * 2.1)), text, font=f,
           fill=color[:3] + (alpha,))
    return Image.alpha_composite(im, layer)

def export_dual(im, name, stamp_text, stamp_color, webp_budget=45 * 1024, png_budget=90 * 1024):
    im = stamp(im, stamp_text, stamp_color)
    base = im.convert("RGBA")
    # WEBP
    w = base.copy()
    scale = min(1.0, 960 / max(w.size))
    if scale < 1.0:
        w = w.resize((int(w.width * scale), int(w.height * scale)), Image.LANCZOS)
    q, method = 80, 6
    wp = os.path.join(WEBP, name + ".webp")
    w.save(wp, "WEBP", quality=q, method=method)
    while os.path.getsize(wp) > webp_budget:
        if q > 35:
            q -= 5
        else:
            w = w.resize((max(1, int(w.width * 0.85)), max(1, int(w.height * 0.85))),
                         Image.LANCZOS)
        w.save(wp, "WEBP", quality=q, method=method)
    # PNG (print, 8-bit quantized with alpha)
    dpi_w = int(7.0 * 180)  # print column ~7in at 180dpi
    p = base.copy()
    scale = min(1.0, dpi_w / p.width)
    if scale < 1.0:
        p = p.resize((dpi_w, int(p.height * scale)), Image.LANCZOS)
    pp = os.path.join(PNGD, name + ".png")
    p.quantize(colors=256, method=Image.FASTOCTREE).save(pp, optimize=True)
    while os.path.getsize(pp) > png_budget and p.width > 400:
        p = p.resize((int(p.width * 0.85), int(p.height * 0.85)), Image.LANCZOS)
        p.quantize(colors=256, method=Image.FASTOCTREE).save(pp, optimize=True)
    return os.path.basename(wp), os.path.getsize(wp), os.path.getsize(pp)

def photo_plates():
    """v6_pack safety + core plates -> cropped, stamped, dual export."""
    out = []
    srcs = sorted(os.listdir(os.path.join(PKG, "01_Images", "v6_pack", "safety")))
    for f in srcs:
        if not f.lower().endswith((".jpg", ".jpeg", ".png")):
            continue
        name = "safeman_" + os.path.splitext(f)[0].lower()
        im = Image.open(os.path.join(PKG, "01_Images", "v6_pack", "safety", f))
        im = im.crop((0, 0, im.width, max(1, im.height - 60)))   # watermark crop
        r = export_dual(im, name, "SAFEMAN // SAFEMAN.ORYXINSTITUTE.ORG", GREEN)
        out.append((name, *r))
    core = sorted(os.listdir(os.path.join(PKG, "01_Images", "v6_pack", "core")))
    for f in core:
        if not f.lower().endswith((".jpg", ".jpeg", ".png")):
            continue
        name = "oryx_" + os.path.splitext(f)[0].lower()
        im = Image.open(os.path.join(PKG, "01_Images", "v6_pack", "core", f))
        im = im.crop((0, 0, im.width, max(1, im.height - 60)))
        r = export_dual(im, name, "ORYX INSTITUTE // ORYXINSTITUTE.ORG", MAROON)
        out.append((name, *r))
    return out

# ---------------- flat technical diagrams (transparent, brand style) -------------
def canvas(s=640):
    im = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    return im, ImageDraw.Draw(im)

def icon_extinguisher():
    im, d = canvas()
    d.rounded_rectangle([260, 90, 380, 150], 18, fill=SLATE)          # head block
    d.rectangle([300, 40, 340, 96], fill=SLATE)                        # neck
    d.ellipse([322, 18, 358, 54], outline=SLATE, width=10)             # pin ring
    d.rounded_rectangle([250, 140, 390, 560], 46, fill=GREEN)          # body
    d.rectangle([250, 210, 390, 250], fill=CREAM)                      # label band
    d.rectangle([300, 150, 340, 560], fill=(0, 0, 0, 0))               # (keeps flat)
    d.line([300, 96, 260, 150], fill=SLATE, width=12)                  # hose
    d.polygon([(232, 132), (268, 148), (252, 176)], fill=SLATE)        # nozzle
    for i in range(3):                                                  # pass sweep marks
        d.arc([180, 60 + i * 44, 260, 140 + i * 44], -60, 40, fill=EMERALD, width=8)
    return im

def icon_harness():
    im, d = canvas()
    d.line([320, 40, 320, 150], fill=SLATE, width=14)                  # anchor line
    d.ellipse([296, 16, 344, 64], outline=SLATE, width=12)
    d.line([320, 150, 320, 260], fill=GREEN, width=22)                 # lanyard
    d.rounded_rectangle([240, 250, 400, 560], 40, outline=GREEN, width=22)  # vest
    d.line([320, 250, 320, 560], fill=GREEN, width=18)                 # sternal strap
    d.line([240, 380, 400, 380], fill=GREEN, width=18)                 # waist belt
    d.rectangle([300, 360, 340, 400], fill=EMERALD)                    # buckle
    d.line([240, 250, 200, 320], fill=GREEN, width=18)
    d.line([400, 250, 440, 320], fill=GREEN, width=18)
    return im

def icon_gas():
    im, d = canvas()
    d.rounded_rectangle([210, 120, 430, 540], 34, fill=GREEN)
    d.rounded_rectangle([240, 160, 400, 300], 16, fill=CREAM)          # display
    for i, t in enumerate(["O2", "LEL", "CO", "H2S"]):
        d.rectangle([248, 316 + i * 52, 262, 352 + i * 52],
                    fill=EMERALD if i % 2 == 0 else SAGE)
        d.text((276, 314 + i * 52), t, font=ImageFont.truetype(FONT_ISB, 34), fill=CREAM)
    d.line([320, 120, 320, 70], fill=SLATE, width=12)                  # probe
    d.ellipse([300, 40, 340, 80], fill=SLATE)
    return im

def icon_padlock():
    im, d = canvas()
    d.arc([250, 150, 430, 360], 180, 360, fill=SLATE, width=26)        # shackle open
    d.line([430, 260, 430, 300], fill=SLATE, width=26)
    d.rounded_rectangle([210, 300, 400, 560], 28, fill=EMERALD)        # body
    d.ellipse([285, 380, 325, 420], fill=CREAM)                        # keyhole
    d.polygon([(297, 410), (313, 410), (320, 480), (290, 480)], fill=CREAM)
    return im

def icon_firstaid():
    im, d = canvas()
    d.rounded_rectangle([120, 220, 520, 540], 36, fill=GREEN)
    d.rectangle([270, 160, 370, 226], fill=GREEN)                      # handle
    d.rectangle([292, 320, 348, 440], fill=CREAM)                      # cross
    d.rectangle([244, 352, 396, 408], fill=CREAM)
    return im

def icon_helmet():
    im, d = canvas()
    d.pieslice([150, 200, 490, 560], 180, 360, fill=GREEN)
    d.rounded_rectangle([120, 340, 520, 420], 22, fill=GREEN)
    d.rectangle([300, 120, 340, 220], fill=GREEN)                      # ridge
    d.line([150, 430, 490, 430], fill=SLATE, width=10)                 # brim line
    return im

def icon_hira_matrix():
    im, d = canvas()
    f = ImageFont.truetype(FONT_ISB, 40)
    cells = [(16, 24, 4), (16, 24, 4)]
    grid = [(1, 1, "L"), (1, 2, "M"), (1, 3, "M"), (1, 4, "H"),
            (2, 1, "M"), (2, 2, "M"), (2, 3, "H"), (2, 4, "E"),
            (3, 1, "M"), (3, 2, "H"), (3, 3, "H"), (3, 4, "E"),
            (4, 1, "H"), (4, 2, "H"), (4, 3, "E"), (4, 4, "E")]
    tones = {"L": SAGE, "M": EMERALD, "H": (202, 138, 4, 255), "E": MAROON}
    for col, row, lv in grid:
        x0, y0 = 120 + (col - 1) * 100, 140 + (row - 1) * 100
        d.rectangle([x0, y0, x0 + 92, y0 + 92], fill=tones[lv])
        d.text((x0 + 32, y0 + 26), lv, font=f, fill=CREAM)
    d.text((118, 70), "L  M  H  E", font=ImageFont.truetype(FONT_ISB, 34), fill=SLATE)
    d.line([120, 560, 520, 560], fill=SLATE, width=8)
    d.line([120, 140, 120, 560], fill=SLATE, width=8)
    return im

def icon_qr_shield():
    im, d = canvas()
    d.polygon([(320, 90), (520, 160), (520, 380), (320, 560), (120, 380), (120, 160)],
              fill=GREEN)
    for (x, y, s) in [(210, 200, 60), (370, 200, 60), (210, 360, 60), (370, 360, 24),
                      (300, 300, 24), (300, 420, 24), (430, 300, 24)]:
        d.rectangle([x, y, x + s, y + s], fill=CREAM)
    return im

ICONS = {
    "sm-extinguisher": icon_extinguisher, "sm-harness": icon_harness,
    "sm-gas-detector": icon_gas, "sm-loto-padlock": icon_padlock,
    "sm-first-aid": icon_firstaid, "sm-helmet": icon_helmet,
    "sm-hira-matrix": icon_hira_matrix, "sm-qr-shield": icon_qr_shield,
}

def green_logos():
    """Clone the maroon brand marks, hue-shift to SafeMan green, add SAFEMAN wordmark."""
    import numpy as np
    src = os.path.join(ROOT, "templates", "oryx_v3", "04_Logos")
    made = []
    for f in ["logo_color.png", "logo_cream.png", "logo_black.png"]:
        p = os.path.join(src, f)
        if not os.path.exists(p):
            continue
        im = Image.open(p).convert("RGBA")
        arr = np.asarray(im).astype(np.float32) / 255.0
        rgb, a = arr[..., :3], arr[..., 3:]
        mx, mn = rgb.max(-1), rgb.min(-1)
        v = mx
        s = np.where(mx > 0, (mx - mn) / np.clip(mx, 1e-6, None), 0)
        r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
        d = np.clip(mx - mn, 1e-6, None)
        h = np.zeros_like(mx)
        m = mx == r; h[m] = (60 * ((g - b) / d) % 360)[m]
        m = mx == g; h[m] = (60 * ((b - r) / d) + 120)[m]
        m = mx == b; h[m] = (60 * ((r - g) / d) + 240)[m]
        maroon = (s > 0.30) & (((h >= 320) | (h <= 25))) & (a[..., 0] > 0.1)
        if not maroon.any():
            continue
        gh, gs = 147 / 360, 0.63
        vv = v; q = np.where(vv < 0.5, vv * (1 + gs), vv + gs - vv * gs)
        pp = 2 * vv - q
        def chan(t):
            t = t % 1.0
            return np.where(t < 1/6, pp + (q - pp) * 6 * t,
                   np.where(t < 1/2, q,
                   np.where(t < 2/3, pp + (q - pp) * (2/3 - t) * 6, pp)))
        new = np.stack([chan(gh + 1/3), chan(gh), chan(gh - 1/3)], -1)
        out = rgb.copy(); out[maroon] = new[maroon]
        res = np.clip(np.concatenate([out, a], -1) * 255, 0, 255).astype(np.uint8)
        logo = Image.fromarray(res)
        # wordmark plate: SAFEMAN (Radley, tracked) + BY ORYX INSTITUTE line
        W = logo.width + 900
        H = max(logo.height, 360)
        plate = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        plate.paste(logo, (0, (H - logo.height) // 2), logo)
        dr = ImageDraw.Draw(plate)
        f1 = ImageFont.truetype(FONT_R, 170)
        f2 = ImageFont.truetype(FONT_ISB, 34)
        x = logo.width + 60
        y0 = H // 2 - 110
        cx = x
        for chx in "SAFEMAN":
            dr.text((cx, y0), chx, font=f1, fill=(20, 83, 45, 255))
            cx += dr.textlength(chx, font=f1) + 14   # +80 tracking equivalent
        dr.text((x + 6, y0 + 195), "BY ORYX INSTITUTE \u2014 SAFEMAN.ORYXINSTITUTE.ORG",
                font=f2, fill=(107, 114, 106, 255))
        outp = os.path.join(LOGO, "safeman_" + f)
        plate.save(outp)
        made.append(os.path.basename(outp))
        logo.save(os.path.join(LOGO, "safeman_shield_" + f))
    return made

def main():
    log = {"webp_budget": "<45KB", "png_budget": "<90KB", "assets": []}
    for name, wp, ws, ps in photo_plates():
        log["assets"].append({"name": name, "webp_kb": round(ws / 1024, 1),
                              "png_kb": round(ps / 1024, 1)})
        print(f"  plate {name}: webp {ws/1024:.1f}KB png {ps/1024:.1f}KB")
    for name, fn in ICONS.items():
        im = fn()
        _, ws, ps = export_dual(im, name, "SAFEMAN // SAFEMAN.ORYXINSTITUTE.ORG", GREEN)
        log["assets"].append({"name": name, "webp_kb": round(ws / 1024, 1),
                              "png_kb": round(ps / 1024, 1)})
        print(f"  icon  {name}: webp {ws/1024:.1f}KB png {ps/1024:.1f}KB")
    for f in green_logos():
        print(f"  logo  {f}")
        log["assets"].append({"name": f, "kind": "logo"})
    import json
    with open(os.path.join(ROOT, "public", "assets", "asset-manifest.json"), "w") as fh:
        json.dump(log, fh, indent=2)
    over = [a for a in log["assets"] if a.get("webp_kb", 0) > 45 or a.get("png_kb", 0) > 90]
    print("BUDGET CHECK:", "PASS" if not over else f"OVER: {over}")

if __name__ == "__main__":
    main()
