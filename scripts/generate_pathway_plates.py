#!/usr/bin/env python3
"""Pathway step plates - SafeMan Core course page.

Extends the repo's procedural plate engine (scripts/generate_bulk_assets.py)
with three landscape visuals for the #pathway steps section, in the same
Swiss editorial house style (warm paper, deep ink, green accent, hairlines):

  1. smcore_enrol_register  - the cohort request ledger (step 1)
  2. smcore_exam_portal     - the timed portal examination (step 2)
  3. smcore_certificate     - rendered from the real certificate engine's
                              output (download/sample_credentials PDF),
                              so the credential shown is the actual artefact

Output: public/sm-core/assets/img/plates/*.webp + *.png
Usage:  python3 scripts/generate_pathway_plates.py
"""
from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

import cairosvg
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "sm-core" / "assets" / "img" / "plates"
CERT_SRC = Path("/home/z/my-project/download/sample_credentials/"
                "SAMPLE_SM-2026-6727_certificate.pdf")
TMP = Path("/tmp/render/pathway")

W, H = 1200, 848
PAPER = "#F3EDE2"
PAPER_LIGHT = "#FAF6F0"
INK = "#181514"
MUTED = "#5C554E"
HAIR = "#DED5C6"
GREEN = "#14532D"

SYSTEM_FONT = "Inter, DejaVu Sans, sans-serif"


# ------------------------------------------------------------------ helpers -
def svg_open() -> list[str]:
    return [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">',
            f'<rect width="{W}" height="{H}" fill="{PAPER}"/>',
            f'<line x1="56" y1="56" x2="{W-56}" y2="56" stroke="{INK}" stroke-width="2"/>',
            f'<line x1="56" y1="80" x2="{W-56}" y2="80" stroke="{HAIR}" stroke-width="1"/>',
            f'<line x1="56" y1="56" x2="56" y2="{H-56}" stroke="{HAIR}" stroke-width="1"/>',
            f'<line x1="{W-56}" y1="56" x2="{W-56}" y2="{H-56}" stroke="{HAIR}" stroke-width="1"/>']


def svg_caption(lines: list[str]) -> list[str]:
    out = [f'<line x1="56" y1="{H-56-52}" x2="{W-56}" y2="{H-56-52}" stroke="{HAIR}" stroke-width="1"/>']
    y = H - 76
    for i, t in enumerate(lines):
        weight = "700" if i == 0 else "500"
        color = INK if i == 0 else MUTED
        out.append(f'<text x="56" y="{y}" font-family="{SYSTEM_FONT}" font-size="24" '
                   f'font-weight="{weight}" letter-spacing="4" fill="{color}">{t}</text>')
        y -= 34
    out.append(f'<text x="{W-56}" y="{H-34}" text-anchor="end" font-family="{SYSTEM_FONT}" '
               f'font-size="19" font-weight="600" letter-spacing="3" fill="{GREEN}">SAFEMAN BY ORYX</text>')
    return out


def svg_close(body: list[str]) -> str:
    return "\n".join(svg_open() + body + ["</svg>"])


def ring(cx, cy, r, stroke, width=3, dash=None):
    d = f' stroke-dasharray="{dash}"' if dash else ""
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{stroke}" stroke-width="{width}"{d}/>'


def line(x1, y1, x2, y2, stroke=INK, width=2, dash=None):
    d = f' stroke-dasharray="{dash}"' if dash else ""
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{stroke}" stroke-width="{width}"{d}/>'


def rect(x, y, w, h, fill="none", stroke=INK, sw=2, rx=0):
    r = f' rx="{rx}"' if rx else ""
    s = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ""
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}"{s}{r}/>'


def txt(x, y, s, size=26, fill=INK, weight="600", anchor="middle", ls=2):
    return (f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-family="{SYSTEM_FONT}" '
            f'font-size="{size}" font-weight="{weight}" letter-spacing="{ls}" fill="{fill}">{s}</text>')


# ------------------------------------------------------------------- plates -
def plate_enrol() -> str:
    """Step 1 - the cohort request ledger."""
    b = []
    # ledger card
    b.append(rect(140, 150, 560, 500, PAPER_LIGHT, INK, 3, 8))
    b.append(rect(140, 150, 560, 64, INK, None, 0, 8))
    b.append(txt(420, 190, "COHORT REQUEST", 24, "#F3EDE2", "700", ls=5))
    rows = [("COURSE", "SM-CORE"), ("MODE", "IN-HOUSE / PUBLIC / SEAT"),
            ("COHORT SIZE", "12 LEARNERS"), ("START", "NOVEMBER 2026")]
    y = 290
    for label, value in rows:
        b.append(txt(180, y, label, 17, MUTED, "600", "start", ls=3))
        b.append(line(180, y + 16, 660, y + 16, HAIR, 2))
        b.append(txt(660, y - 2, value, 19, INK, "600", "end", ls=2))
        y += 86
    # reviewed tick
    b.append(rect(180, 646, 30, 30, "none", INK, 3, 4))
    b.append(f'<path d="M 186 662 l 10 12 l 20 -26" stroke="{GREEN}" stroke-width="7" fill="none"/>')
    b.append(txt(232, 668, "REVIEWED BY THE REGISTRAR", 16, MUTED, "600", "start", ls=3))

    # envelope -> access code chip
    b.append(rect(800, 200, 300, 210, PAPER_LIGHT, INK, 3, 8))
    b.append(rect(830, 240, 240, 130, "none", INK, 3, 4))
    b.append(f'<path d="M 830 240 L 950 330 L 1070 240" stroke="{INK}" stroke-width="3" fill="none"/>')
    b.append(txt(950, 384, "INFO@ORYXINSTITUTE.ORG", 15, MUTED, "600", ls=2))
    b.append(f'<path d="M 700 400 L 760 400" stroke="{INK}" stroke-width="4"/>')
    b.append(f'<path d="M 754 392 L 766 400 L 754 408 Z" fill="{INK}"/>')
    # access code chip
    b.append(rect(800, 460, 300, 96, GREEN, None, 0, 8))
    b.append(txt(950, 502, "ACCESS CODE", 15, "#BFD8C7", "600", ls=4))
    b.append(txt(950, 534, "ORYX-2026", 27, "#FAF6F0", "700", ls=3))
    b.append(txt(950, 592, "ISSUED WITH THE COHORT DATES", 14, MUTED, "600", ls=2))
    return svg_close(b + svg_caption(["STEP 1 // COHORT REQUEST"]))


def plate_exam() -> str:
    """Step 2 - the timed examination in the portal."""
    b = []
    # portal window
    b.append(rect(150, 140, 620, 520, PAPER_LIGHT, INK, 3, 10))
    b.append(rect(150, 140, 620, 54, INK, None, 0, 10))
    for i, cx in enumerate((178, 202, 226)):
        b.append(f'<circle cx="{cx}" cy="167" r="7" fill="none" stroke="#F3EDE2" stroke-width="2.5"/>')
    b.append(txt(460, 175, "SAFEMAN STUDENT PORTAL", 15, "#F3EDE2", "600", ls=4))
    # question counter + timer chip row
    b.append(rect(186, 226, 150, 44, "none", INK, 2.5, 6))
    b.append(txt(261, 254, "Q 3 / 8", 18, INK, "700", ls=2))
    b.append(rect(536, 226, 190, 44, GREEN, None, 0, 6))
    b.append(txt(631, 254, "00:07:12", 18, "#FAF6F0", "700", ls=2))
    # question line + options
    b.append(line(186, 308, 734, 308, HAIR, 2))
    b.append(txt(186, 348, "UNDER ISO 45001:2018, WHICH CLAUSE REQUIRES", 16, INK, "600", "start", ls=2))
    b.append(txt(186, 374, "WORKER CONSULTATION AND PARTICIPATION?", 16, INK, "600", "start", ls=2))
    opts = [("A", False), ("B", True), ("C", False)]
    y = 412
    for label, selected in opts:
        b.append(rect(186, y, 548, 52, "none", INK if not selected else GREEN, 2.5, 6))
        if selected:
            b.append(f'<circle cx="216" cy="{y+26}" r="13" fill="{GREEN}"/>')
            b.append(f'<circle cx="216" cy="{y+26}" r="5" fill="#FAF6F0"/>')
        else:
            b.append(f'<circle cx="216" cy="{y+26}" r="13" fill="none" stroke="{INK}" stroke-width="2.5"/>')
        b.append(txt(248, y + 33, "OPTION " + label, 16, INK if selected else MUTED,
                     "600", "start", ls=3))
        y += 68
    # progress track
    b.append(line(186, 628, 734, 628, HAIR, 4))
    b.append(line(186, 628, 400, 628, GREEN, 4))

    # countdown ring
    b.append(ring(940, 380, 120, HAIR, 10))
    b.append(f'<path d="M 940 380 L 940 260 A 120 120 0 0 1 1034 313 Z" fill="{GREEN}"/>')
    b.append(ring(940, 380, 96, PAPER, 0))
    b.append(txt(940, 368, "10:00", 44, INK, "700", ls=1))
    b.append(txt(940, 404, "MINUTES", 15, MUTED, "600", ls=4))
    b.append(txt(940, 560, "FRESH DRAW", 18, INK, "700", ls=3))
    b.append(txt(940, 590, "EVERY ATTEMPT", 15, MUTED, "600", ls=3))
    b.append(line(880, 530, 1000, 530, HAIR, 2))
    return svg_close(b + svg_caption(["STEP 2 // TIMED EXAMINATION"]))


def render(name: str, svg: str) -> None:
    png_path = OUT / f"{name}.png"
    webp_path = OUT / f"{name}.webp"
    png_bytes = cairosvg.svg2png(bytestring=svg.encode("utf-8"), output_width=W, output_height=H)
    png_path.write_bytes(png_bytes)
    img = Image.open(png_path).convert("RGB")
    img.save(webp_path, "WEBP", quality=88, method=6)
    print(f"  {name}: png {png_path.stat().st_size // 1024} KB, "
          f"webp {webp_path.stat().st_size // 1024} KB")


def render_certificate() -> None:
    """Render page 1 of the real certificate engine output to dual format."""
    TMP.mkdir(parents=True, exist_ok=True)
    subprocess.run(["pdftoppm", "-png", "-r", "150", "-f", "1", "-l", "1",
                    str(CERT_SRC), str(TMP / "cert")], check=True)
    cert_png = next(TMP.glob("cert-*.png"))
    img = Image.open(cert_png).convert("RGB")
    if img.width > 1000:  # the step panel renders at ~2x of 410px; 1000px is ample
        img = img.resize((1000, round(img.height * 1000 / img.width)), Image.LANCZOS)
    img.save(OUT / "smcore_certificate.png", "PNG", optimize=True)
    img.save(OUT / "smcore_certificate.webp", "WEBP", quality=82, method=6)
    print(f"  smcore_certificate: png {(OUT / 'smcore_certificate.png').stat().st_size // 1024} KB, "
          f"webp {(OUT / 'smcore_certificate.webp').stat().st_size // 1024} KB")


def main() -> None:
    if not CERT_SRC.exists():
        sys.exit(f"certificate source missing: {CERT_SRC} (run scripts/cert_test.py first)")
    OUT.mkdir(parents=True, exist_ok=True)
    print("pathway plates:")
    render("smcore_enrol_register", plate_enrol())
    render("smcore_exam_portal", plate_exam())
    render_certificate()
    print("OK")


if __name__ == "__main__":
    main()
