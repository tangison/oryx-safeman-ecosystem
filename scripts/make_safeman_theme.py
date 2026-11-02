#!/usr/bin/env python3
"""
make_safeman_theme.py — SafeMan Green Theme Transformer.

Rule 1 (never build from scratch): every SafeMan document template is a CLONE of the
Oryx_Build_Package_v3 Word templates. We clone the .docx zip, recolor XML hex attributes
and hue-shift maroon brand pixels to SafeMan Forest Green, then rezip. Geometry, styles,
fonts and layout come entirely from the original templates.

Recolor map (Oryx maroon track -> SafeMan green track):
  #71111F (v2 maroon) / #6A1B29 (v3 maroon) -> #14532D  Forest Green
  #D9CFC0  Tan Hairline                     -> #C6D8C8  Sage Hairline
  #B89B72  Warm Sand accent                 -> #16A34A  Safety Emerald
  #F5EEE3 / #F5EFE6 / #F4EEE4  Cream fills  -> #F0FDF4  Mint Cream fill

Contact rule (build brief v3 addendum): email only, no P.O. Box, no phone.
SafeMan wordmark is applied by build_safeman_docs.py when content is injected; this
script stamps the doc-type eyebrow and fixes org strings inside the templates.
"""
import os, re, sys, shutil, zipfile, tempfile, json
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "templates", "oryx_v3", "01_Word_Templates")
DST = os.path.join(ROOT, "templates", "safeman_green")

COLOR_MAP = {
    "71111F": "14532D", "6A1B29": "14532D",
    "D9CFC0": "C6D8C8", "B89B72": "16A34A",
    "F5EEE3": "F0FDF4", "F5EFE6": "F0FDF4", "F4EEE4": "F0FDF4",
}

TEXT_REPL = [
    # P.O. Box is forbidden — email only
    (re.compile(r"oryxinstitute\.org[^<]*?P\.O\.[^<]*?Windhoek", re.I),
     "info@oryxinstitute.org"),
    (re.compile(r"P\.O\.\s*Box[^<,<]*,\s*Windhoek", re.I), ""),
    # SafeMan wordmark on the doc-type eyebrow
    (re.compile(r"STUDENT MODULE"), "SAFEMAN \u00b7 STUDENT MODULE"),
    (re.compile(r"TEXTBOOK"), "SAFEMAN \u00b7 TEXTBOOK"),
    (re.compile(r"CERTIFICATE"), "SAFEMAN \u00b7 CERTIFICATE"),
    (re.compile(r"LETTERHEAD"), "SAFEMAN \u00b7 LETTERHEAD"),
    (re.compile(r"PROSPECTUS"), "SAFEMAN \u00b7 PROSPECTUS"),
    (re.compile(r"ORX (\d)"), r"SM-\1"),
    # Footer org line -> SafeMan domain (protect the info@ email)
    (re.compile(r"(?<!info@)oryxinstitute\.org", re.I), "safeman.oryxinstitute.org"),
]

# Maroon-detect: hue in [320..360]∪[0..25] deg, saturation > 0.30
def recolor_media(path):
    im = Image.open(path).convert("RGBA")
    arr = np.asarray(im).astype(np.float32) / 255.0
    rgb, a = arr[..., :3], arr[..., 3:]
    # Spec 3.1: hue-shift ONLY the shield / pattern band / emblem art (transparent
    # brand marks). Full-bleed photographs keep their natural colour — except the
    # maroon pattern band on cover backgrounds, which lives in the left edge strip.
    if im.mode != "RGBA" or not (a.min() < 0.98):
        # RGB art: distinguish full-page brand pattern art (>50% maroon-ish -> shift all)
        # from photography (<50% -> shift only the left pattern band).
        W = rgb.shape[1]
        mx0, mn0 = rgb.max(-1), rgb.min(-1)
        v0 = mx0
        s0 = np.where(mx0 > 0, (mx0 - mn0) / np.clip(mx0, 1e-6, None), 0)
        r0, g0, b0 = rgb[..., 0], rgb[..., 1], rgb[..., 2]
        d0 = np.clip(mx0 - mn0, 1e-6, None)
        h0 = np.zeros_like(mx0)
        m0 = mx0 == r0; h0[m0] = (60 * ((g0 - b0) / d0) % 360)[m0]
        m0 = mx0 == g0; h0[m0] = (60 * ((b0 - r0) / d0) + 120)[m0]
        m0 = mx0 == b0; h0[m0] = (60 * ((r0 - g0) / d0) + 240)[m0]
        maroon_all = (s0 > 0.30) & (((h0 >= 320) | (h0 <= 25)))
        if maroon_all.mean() > 0.5:
            region = maroon_all                      # brand pattern page: shift everywhere
        else:
            band = np.zeros(rgb.shape[:2], bool)
            band[:, : int(W * 0.11)] = True
            region = band & maroon_all               # photo page: left band only
        if not region.any():
            return False
        gh, gs = 147 / 360, 0.63
        vv = v0
        q = np.where(vv < 0.5, vv * (1 + gs), vv + gs - vv * gs)
        pp2 = 2 * vv - q
        def chan2(t):
            t = t % 1.0
            return np.where(t < 1/6, pp2 + (q - pp2) * 6 * t,
                   np.where(t < 1/2, q,
                   np.where(t < 2/3, pp2 + (q - pp2) * (2/3 - t) * 6, pp2)))
        newb = np.stack([chan2(gh + 1/3), chan2(gh), chan2(gh - 1/3)], -1)
        out0 = rgb.copy(); out0[region] = newb[region]
        res0 = np.clip(out0 * 255, 0, 255).astype(np.uint8)
        Image.fromarray(res0).save(path)
        return True
    mx, mn = rgb.max(-1), rgb.min(-1)
    v = mx
    s = np.where(mx > 0, (mx - mn) / np.clip(mx, 1e-6, None), 0)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    d = np.clip(mx - mn, 1e-6, None)
    h = np.zeros_like(mx)
    m = mx == r
    h[m] = (60 * ((g - b) / d) % 360)[m]
    m = mx == g
    h[m] = (60 * ((b - r) / d) + 120)[m]
    m = mx == b
    h[m] = (60 * ((r - g) / d) + 240)[m]
    maroon = ((s > 0.30) & (((h >= 320) | (h <= 25))) & (v > 0.05))
    # Forest green #14532D hue ≈ 147deg, keep perceptual value & saturation
    gh, gs = 147.0 / 360.0, 0.63
    hh, ss, vv = np.vectorize(lambda x: x)(h / 360.0), s, v
    i = (0.5 if False else gh)  # target hue
    q = np.where(vv < 0.5, vv * (1 + gs), vv + gs - vv * gs)
    p = 2 * vv - q
    def chan(t):
        t = t % 1.0
        return np.where(t < 1/6, p + (q - p) * 6 * t,
               np.where(t < 1/2, q,
               np.where(t < 2/3, p + (q - p) * (2/3 - t) * 6, p)))
    nt = i + 1/3
    new = np.stack([chan(nt), chan(i), chan(i - 1/3)], -1)
    out = rgb.copy()
    out[maroon] = new[maroon]
    res = np.concatenate([out, a], -1)
    res = np.clip(res * 255, 0, 255).astype(np.uint8)
    Image.fromarray(res).save(path)
    return True

def transform_docx(src_path, dst_path):
    tmp = tempfile.mkdtemp()
    try:
        with zipfile.ZipFile(src_path) as z:
            z.extractall(tmp)
        changed = {"colors": 0, "text": 0, "media": 0}
        for sub in ["word/styles.xml", "word/document.xml", "word/header1.xml",
                    "word/header2.xml", "word/header3.xml", "word/footer1.xml",
                    "word/footer2.xml", "word/footer3.xml"]:
            p = os.path.join(tmp, sub)
            if not os.path.exists(p):
                continue
            x = open(p, encoding="utf-8").read()
            for old, new in COLOR_MAP.items():
                n = len(re.findall(old, x, re.I))
                if n:
                    x = re.sub(old, new, x, flags=re.I)
                    changed["colors"] += n
            for rx, rep in TEXT_REPL:
                x, n = rx.subn(rep, x)
                changed["text"] += n
            open(p, "w", encoding="utf-8").write(x)
        media = os.path.join(tmp, "word", "media")
        if os.path.isdir(media):
            for f in os.listdir(media):
                if f.lower().endswith((".png", ".jpg", ".jpeg")):
                    if recolor_media(os.path.join(media, f)):
                        changed["media"] += 1
        os.makedirs(os.path.dirname(dst_path), exist_ok=True)
        if os.path.exists(dst_path):
            os.remove(dst_path)
        with zipfile.ZipFile(dst_path, "w", zipfile.ZIP_DEFLATED) as z:
            for root, _, files in os.walk(tmp):
                for f in files:
                    fp = os.path.join(root, f)
                    z.write(fp, os.path.relpath(fp, tmp))
        return changed
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

def main():
    os.makedirs(DST, exist_ok=True)
    report = []
    for f in sorted(os.listdir(SRC)):
        if not f.endswith(".docx"):
            continue
        dst = os.path.join(DST, f.replace("Oryx", "SafeMan"))
        stats = transform_docx(os.path.join(SRC, f), dst)
        report.append({"template": f, "out": os.path.basename(dst), **stats})
        print(f"  {f} -> {os.path.basename(dst)}  {stats}")
    with open(os.path.join(ROOT, "templates", "safeman_green", "_theme_report.json"), "w") as fh:
        json.dump(report, fh, indent=2)
    print(f"SafeMan green theme: {len(report)} templates cloned into templates/safeman_green/")

if __name__ == "__main__":
    sys.exit(main())
