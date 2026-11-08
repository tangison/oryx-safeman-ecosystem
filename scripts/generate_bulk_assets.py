#!/usr/bin/env python3
"""Bulk vector illustration engine - Oryx Institute / SafeMan by Oryx.

Contract (MASTER UPGRADE BRIEF part 4):
  1. PROCEDURAL PLATES - deterministic SVG artwork for every course card and
     portal hero, rendered to webp (<45 KB) + png (<90 KB) at 1200x1500 (4:5).
     Swiss editorial style: warm paper, deep ink, ONE brand accent, hairlines,
     zero gradients / shadows / decorative blobs.
  2. EXTERNAL IMAGE CLEANER - images dropped in assets/raw_plates/ get:
       bottom 64 px cropped (watermark strip removal)
       -> paper-white background knocked out to transparency
       -> corner brand stamp "SAFEMAN // ORYXINSTITUTE.ORG"
       -> same dual export budget.
  Usage:  python3 scripts/generate_bulk_assets.py [--clean-only]
"""
from __future__ import annotations

import sys
from pathlib import Path

import cairosvg
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT_WEBP = ROOT / "public" / "assets" / "webp"
OUT_PNG = ROOT / "public" / "assets" / "png"
RAW_PLATES = ROOT / "assets" / "raw_plates"

W, H = 1200, 1500
PAPER = "#F3EDE2"
PAPER_LIGHT = "#FAF6F0"
INK = "#181514"
MUTED = "#5C554E"
HAIR = "#DED5C6"
MAROON = "#6A1B29"
GREEN = "#14532D"

SYSTEM_FONT = "Inter, DejaVu Sans, sans-serif"


# ------------------------------------------------------------------ helpers -
def svg_open(bg: str = PAPER) -> list[str]:
    return [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">',
            f'<rect width="{W}" height="{H}" fill="{bg}"/>',
            # top hairline + margin rails (editorial grid signal)
            f'<line x1="72" y1="72" x2="{W-72}" y2="72" stroke="{INK}" stroke-width="2"/>',
            f'<line x1="72" y1="96" x2="{W-72}" y2="96" stroke="{HAIR}" stroke-width="1"/>',
            f'<line x1="72" y1="72" x2="72" y2="{H-72}" stroke="{HAIR}" stroke-width="1"/>',
            f'<line x1="{W-72}" y1="72" x2="{W-72}" y2="{H-72}" stroke="{HAIR}" stroke-width="1"/>']


def svg_caption(lines: list[str], accent: str, footer: str | None = None) -> list[str]:
    out = [f'<line x1="72" y1="{H-72-56}" x2="{W-72}" y2="{H-72-56}" stroke="{HAIR}" stroke-width="1"/>']
    y = H - 96
    for i, t in enumerate(lines):
        weight = "700" if i == 0 else "500"
        color = INK if i == 0 else MUTED
        out.append(f'<text x="72" y="{y}" font-family="{SYSTEM_FONT}" font-size="26" '
                   f'font-weight="{weight}" letter-spacing="4" fill="{color}">{t}</text>')
        y -= 38
    if footer:
        out.append(f'<text x="{W-72}" y="{H-40}" text-anchor="end" font-family="{SYSTEM_FONT}" '
                   f'font-size="20" font-weight="600" letter-spacing="3" fill="{accent}">{footer}</text>')
    return out


def svg_close(body: list[str]) -> str:
    return "\n".join(svg_open() + body + ["</svg>"])


def render(name: str, svg: str) -> tuple[Path, Path, int, int]:
    png_path = OUT_PNG / f"{name}.png"
    webp_path = OUT_WEBP / f"{name}.webp"
    png_bytes = cairosvg.svg2png(bytestring=svg.encode("utf-8"), output_width=W, output_height=H)
    png_path.write_bytes(png_bytes)
    img = Image.open(png_path).convert("RGB")
    img.save(webp_path, "WEBP", quality=88, method=6)
    png_kb, webp_kb = png_path.stat().st_size / 1024, webp_path.stat().st_size / 1024
    return png_path, webp_path, png_kb, webp_kb


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


def txt(x, y, s, size=28, fill=INK, weight="600", anchor="middle", ls=2):
    return (f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-family="{SYSTEM_FONT}" '
            f'font-size="{size}" font-weight="{weight}" letter-spacing="{ls}" fill="{fill}">{s}</text>')


# ------------------------------------------------------------------- plates -
def plate_l1():  # foundation: helmet + hazard triangle + signs row
    b = [ring(600, 560, 250, HAIR, 1.5), ring(600, 560, 310, HAIR, 1, "6 10")]
    # hard hat
    b.append(f'<path d="M 450 620 Q 450 420 600 420 Q 750 420 750 620 Z" fill="{INK}"/>')
    b.append(rect(430, 620, 340, 26, INK, None, rx=8))
    b.append(rect(560, 380, 80, 60, INK, None, rx=8))
    b.append(f'<path d="M 560 620 L 560 470" stroke="{PAPER}" stroke-width="6"/>')
    # hazard triangle
    b.append(f'<path d="M 600 850 L 520 990 L 680 990 Z" fill="none" stroke="{MAROON}" stroke-width="10"/>')
    b.append(txt(600, 968, "!", 54, MAROON, "700"))
    for i, (x, w) in enumerate([(120, 90), (230, 90), (900, 90), (1010, 90)]):
        b.append(rect(x, 880, w, 110, "none", HAIR, 2, 6))
    return svg_close(b + svg_caption(["LEVEL 1 // FOUNDATION"], MAROON, "ORYX SAFETY ACADEMY"))


def plate_l2():  # SHE rep: clipboard + vest stripes
    b = [rect(430, 330, 340, 520, PAPER_LIGHT, INK, 3, 6)]
    b.append(rect(530, 300, 140, 60, INK, None, 0, 8))
    for y in (400, 450, 500, 550, 600, 650):
        b.append(line(470, y, 730, y, HAIR, 2))
        b.append(rect(680, y - 14, 24, 24, "none", MAROON, 3, 2))
    b.append(rect(470, 700, 120, 60, MAROON, None, 0, 4))
    b.append(txt(530, 738, "SHE", 26, "#FFFFFF", "700"))
    # vest stripes
    for y in (950, 1010, 1070):
        b.append(f'<path d="M 240 {y} L 960 {y - 130}" stroke="{INK}" stroke-width="14"/>')
        b.append(f'<path d="M 240 {y + 26} L 960 {y + 26 - 130}" stroke="{MAROON}" stroke-width="6"/>')
    return svg_close(b + svg_caption(["LEVEL 2 // SHE REPRESENTATIVE"], MAROON, "ORYX SAFETY ACADEMY"))


def plate_l3():  # supervisor: hat + permit card + check rows
    b = [f'<path d="M 480 460 Q 480 320 600 320 Q 720 320 720 460 Z" fill="none" stroke="{INK}" stroke-width="8"/>',
         rect(460, 460, 280, 22, INK, None, 0, 6),
         rect(480, 380, 60, 80, INK, None, 0, 6),
         rect(420, 560, 360, 430, PAPER_LIGHT, INK, 3, 6),
         txt(600, 640, "PERMIT TO WORK", 30, INK, "700"),
         line(470, 680, 730, 680, HAIR, 2)]
    for y in (740, 800, 860, 920):
        b.append(rect(470, y - 16, 30, 30, "none", INK, 3, 2))
        b.append(line(516, y - 2, 730, y - 2, HAIR, 2))
    b.append(f'<path d="M 470 920 l 14 16 l 26 -34" stroke="{MAROON}" stroke-width="8" fill="none"/>')
    b.append(rect(560, 940, 120, 44, MAROON, None, 0, 4))
    b.append(txt(620, 970, "SIGNED", 22, "#FFFFFF", "700"))
    return svg_close(b + svg_caption(["LEVEL 3 // SUPERVISORY OHS"], MAROON, "ORYX SAFETY ACADEMY"))


def plate_l4():  # safety officer: shield + register rows
    b = [f'<path d="M 600 300 L 790 370 L 790 560 Q 790 720 600 800 Q 410 720 410 560 L 410 370 Z" '
         f'fill="{INK}"/>',
         f'<path d="M 600 340 L 750 396 L 750 556 Q 750 686 600 752 Q 450 686 450 556 L 450 396 Z" '
         f'fill="none" stroke="{PAPER}" stroke-width="3"/>',
         f'<path d="M 545 555 l 40 44 l 78 -96" stroke="#FFFFFF" stroke-width="14" fill="none"/>',
         rect(430, 900, 340, 300, PAPER_LIGHT, INK, 3, 6)]
    for y in (960, 1020, 1080, 1140):
        b.append(line(470, y, 730, y, HAIR, 2))
    b.append(rect(430, 876, 16, 300, MAROON, None, 0, 0))
    return svg_close(b + svg_caption(["LEVEL 4 // SAFETY OFFICER"], MAROON, "ORYX SAFETY ACADEMY"))


def plate_bowtie(name, caption, accent, footer):  # shared bowtie diagram
    b = [ring(600, 620, 46, accent, 5), ring(600, 620, 62, accent, 1.5, "4 8")]
    b.append(f'<path d="M 556 596 L 240 430 L 240 810 Z" fill="none" stroke="{INK}" stroke-width="4"/>')
    b.append(f'<path d="M 644 596 L 960 430 L 960 810 Z" fill="none" stroke="{INK}" stroke-width="4"/>')
    for i, y in enumerate((470, 560, 650, 740)):
        b.append(line(240, y, 566, 608 + (y - 620) // 6, HAIR, 2, "7 7"))
        b.append(line(634, 608 + (y - 620) // 6, 960, y, HAIR, 2, "7 7"))
        b.append(rect(228 + 12, y - 34, 16, 68, accent if i in (1, 2) else "none", INK, 2.5, 3))
        b.append(rect(960 - 28, y - 34, 16, 68, "none", INK, 2.5, 3))
    b.append(txt(600, 720, "TOP EVENT", 24, accent, "700"))
    b.append(txt(386, 880, "THREATS", 22, MUTED, "600"))
    b.append(txt(816, 880, "CONSEQUENCES", 22, MUTED, "600"))
    b.append(txt(600, 545, "BARRIERS", 20, INK, "600"))
    return svg_close(b + svg_caption(caption, accent, footer))


def plate_l6():  # sensors: 4-gas detector face
    b = [rect(420, 300, 360, 560, PAPER_LIGHT, INK, 3, 10)]
    b.append(rect(460, 350, 280, 150, INK, None, 0, 6))
    b.append(txt(600, 415, "O2 20.9", 34, "#F3EDE2", "700"))
    b.append(txt(600, 465, "LEL 0%", 34, "#F3EDE2", "700"))
    for i, (label, y) in enumerate([("H2S", 570), ("CO", 640)]):
        b.append(txt(500, y, label, 26, INK, "700", "start"))
        b.append(line(570, y - 8, 730, y - 8, HAIR, 8))
        b.append(rect(570, y - 16, 60, 16, MAROON, None, 0, 3))
    b.append(f'<circle cx="600" cy="760" r="46" fill="none" stroke="{INK}" stroke-width="4"/>')
    b.append(txt(600, 772, "PUMP", 20, INK, "700"))
    b.append(rect(470, 690, 260, 2, HAIR, None))
    # probe with tube
    b.append(f'<path d="M 780 760 Q 920 760 940 620" stroke="{INK}" stroke-width="6" fill="none"/>')
    b.append(rect(920, 560, 40, 60, INK, None, 0, 6))
    for i in range(3):
        b.append(line(986 - i * 18, 560 - i * 26, 1000 - i * 18, 580 - i * 26, MUTED, 3))
    return svg_close(b + svg_caption(["LEVEL 6 // INSTRUMENTATION LAB"], MAROON, "ORYX SAFETY ACADEMY"))


def plate_l7():  # strategy: ascending blocks + orbit
    b = [rect(300, 900, 140, 300, "none", INK, 4, 4),
         rect(470, 760, 140, 440, "none", INK, 4, 4),
         rect(640, 620, 140, 580, "none", INK, 4, 4),
         rect(810, 480, 140, 720, MAROON, None, 0, 4)]
    for x in (370, 540, 710, 880):
        b.append(txt(x, 470, "EHS", 0))
    labels = ["ISO", "EIA", "PSM", "ESG"]
    for x, lab in zip((370, 540, 710, 880), labels):
        b.append(txt(x, 940 if x != 880 else 500, lab, 30, "#FFFFFF" if x == 880 else INK, "700"))
    b.append(line(250, 440, 990, 400, INK, 3))
    b.append(f'<circle cx="990" cy="400" r="10" fill="{INK}"/>')
    b.append(ring(600, 800, 430, HAIR, 1, "5 12"))
    return svg_close(b + svg_caption(["LEVEL 7 // STRATEGIC EHS"], MAROON, "ORYX SAFETY ACADEMY"))


def plate_cpr():  # 30:2 metronome rhythm
    b = [txt(600, 420, "30 : 2", 120, INK, "700", ls=6)]
    # compression pulse line
    pts, y0 = [], 560
    x = 160
    for i in range(6):
        pts.append(f"L {x} {y0}")
        pts.append(f"L {x+34} {y0-92}")
        pts.append(f"L {x+68} {y0}")
        x += 132
    b.append(f'<path d="M 160 {y0} ' + " ".join(pts) + f'L {x} {y0}" stroke="{MAROON}" stroke-width="8" fill="none"/>')
    b.append(line(160, 700, 1060, 700, HAIR, 2))
    b.append(txt(600, 760, "100-120 BPM - 5-6 CM DEPTH", 24, MUTED, "600"))
    # breaths bars
    for i, x in enumerate((700, 800)):
        b.append(rect(x, 820, 60, 120, "none", INK, 3, 6))
        b.append(f'<path d="M {x+16} 900 q 14 -34 28 0" stroke="{INK}" stroke-width="4" fill="none"/>')
    b.append(txt(750, 1000, "2 BREATHS", 22, MUTED, "600"))
    # torso outline
    b.append(f'<circle cx="360" cy="900" r="56" fill="none" stroke="{INK}" stroke-width="5"/>')
    b.append(f'<path d="M 300 1160 q 0 -160 60 -204 q 60 44 60 204 Z" fill="none" stroke="{INK}" stroke-width="5"/>')
    b.append(txt(360, 916, "+", 44, MAROON, "700"))
    return svg_close(b + svg_caption(["SM-CPR // BASIC LIFE SUPPORT"], GREEN, "SAFEMAN BY ORYX"))


def plate_fak():  # first aid kit
    b = [rect(360, 420, 480, 380, PAPER_LIGHT, INK, 4, 10)]
    b.append(rect(540, 380, 120, 50, "none", INK, 4, 6))
    b.append(rect(560, 430, 80, 46, INK, None, 0, 4))
    b.append(rect(576, 500, 48, 220, MAROON, None, 0, 6))
    b.append(rect(490, 586, 220, 48, MAROON, None, 0, 6))
    for y in (880, 930, 980):
        b.append(line(300, y, 470, y, HAIR, 3))
    for y in (880, 930, 980):
        b.append(line(730, y, 900, y, HAIR, 3))
    b.append(txt(600, 1090, "TRAUMA / BURNS / SPLINTS", 24, MUTED, "600"))
    return svg_close(b + svg_caption(["SM-FA1 // FIRST AID RESPONDER"], GREEN, "SAFEMAN BY ORYX"))


def plate_pass():  # extinguisher + PASS
    b = [rect(500, 380, 200, 480, "none", INK, 5, 24)]
    b.append(f'<path d="M 540 380 L 540 320 L 660 320 L 660 380" fill="none" stroke="{INK}" stroke-width="5"/>')
    b.append(rect(600, 260, 20, 70, INK, None, 0, 4))
    b.append(f'<path d="M 620 300 L 760 260 L 768 292 L 620 330 Z" fill="{INK}"/>')
    b.append(rect(520, 470, 160, 200, MAROON, None, 0, 8))
    b.append(txt(600, 590, "PASS", 44, "#FFFFFF", "700", ls=4))
    steps = [("P", "PULL", 1000, 420), ("A", "AIM", 1000, 540), ("S", "SQUEEZE", 1000, 660), ("S", "SWEEP", 1000, 780)]
    for big, small, x, y in steps:
        b.append(f'<circle cx="{x}" cy="{y}" r="34" fill="none" stroke="{INK}" stroke-width="3"/>')
        b.append(txt(x, y + 10, big, 30, INK, "700"))
        b.append(txt(x + 60, y - 4, small, 22, MUTED, "600", "start"))
    b.append(line(940, 420, 940, 780, HAIR, 2))
    return svg_close(b + svg_caption(["SM-FIRE // EXTINGUISHER DRILL"], GREEN, "SAFEMAN BY ORYX"))


def plate_harness():  # five-point harness
    b = [f'<circle cx="600" cy="470" r="90" fill="none" stroke="{INK}" stroke-width="6"/>',
         f'<path d="M 470 640 Q 600 600 730 640 L 700 1000 L 500 1000 Z" fill="none" stroke="{INK}" stroke-width="6"/>']
    # five adjustment points
    pts = [(600, 590), (505, 700), (695, 700), (520, 960), (680, 960)]
    for i, (x, y) in enumerate(pts):
        b.append(rect(x - 22, y - 22, 44, 44, MAROON if i == 0 else "none", INK, 3, 4))
    b.append(line(600, 560, 600, 340, INK, 4))
    b.append(rect(584, 300, 32, 48, INK, None, 0, 4))
    b.append(txt(600, 1120, "5-POINT PRE-USE INSPECTION", 24, MUTED, "600"))
    b.append(txt(600, 1160, "WEBBING - STITCHES - BUCKLES - D-RING - TAGS", 18, MUTED, "600"))
    return svg_close(b + svg_caption(["SM-WAH // FALL ARREST"], GREEN, "SAFEMAN BY ORYX"))


def plate_gas():  # 4-gas stratification in a vessel
    b = [f'<path d="M 430 300 L 430 1120 Q 600 1220 770 1120 L 770 300" fill="{PAPER_LIGHT}" stroke="{INK}" stroke-width="5"/>']
    bands = [(340, 420, "#FFFFFF", "CH4 / LEL", INK), (420, 560, "#EFE7DA", "O2", INK),
             (560, 700, "#E7DCC8", "CO", MUTED), (700, 840, MAROON, "H2S", "#FFFFFF")]
    for y0, y1, fill, label, tc in bands:
        b.append(f'<path d="M 431 {y0} L 431 {y1} Q 600 {y1 + 60} 769 {y1} L 769 {y0} Q 600 {y0 + 60} 431 {y0} Z" fill="{fill}"/>')
        b.append(txt(600, (y0 + y1) // 2 + 10, label, 26, tc, "700", ls=4))
    b.append(line(600, 200, 600, 300, INK, 3))
    b.append(rect(584, 160, 32, 44, INK, None, 0, 4))
    b.append(txt(600, 1320, "TEST TOP - MIDDLE - BOTTOM AT EVERY LEVEL", 22, MUTED, "600"))
    return svg_close(b + svg_caption(["SM-CSE // GAS STRATIFICATION"], GREEN, "SAFEMAN BY ORYX"))


def plate_loto():  # padlock + danger tag
    b = [f'<path d="M 500 560 L 500 430 Q 500 300 600 300 Q 700 300 700 430 L 700 560" fill="none" stroke="{INK}" stroke-width="10"/>']
    b.append(rect(440, 560, 320, 300, INK, None, 0, 12))
    b.append(f'<circle cx="600" cy="700" r="46" fill="{PAPER}"/>')
    b.append(rect(588, 700, 24, 70, PAPER, None, 0, 4))
    # danger tag
    b.append(f'<path d="M 880 520 L 1060 520 L 1060 720 L 880 720 L 830 620 Z" fill="{MAROON}"/>')
    b.append(f'<circle cx="862" cy="620" r="10" fill="{PAPER}"/>')
    b.append(txt(970, 600, "DANGER", 28, "#FFFFFF", "700", ls=3))
    b.append(txt(970, 646, "DO NOT", 20, "#FFFFFF", "600"))
    b.append(txt(970, 676, "OPERATE", 20, "#FFFFFF", "600"))
    b.append(txt(600, 1010, "ONE WORKER - ONE LOCK - ONE KEY", 24, MUTED, "600"))
    b.append(txt(600, 1050, "TRY-OUT BEFORE TOUCH", 18, GREEN, "700"))
    return svg_close(b + svg_caption(["SM-LOTO // ENERGY ISOLATION"], GREEN, "SAFEMAN BY ORYX"))


def plate_hira():  # 5x5 matrix
    b = []
    cell = 96
    x0, y0 = 340, 330
    colors = ["#EFE7DA", "#E8DBC4", "#E5D3B3", "#D9B79A", "#6A1B29"]
    for r in range(5):
        for c in range(5):
            score = (r + 1) * (c + 1)
            band = 0 if score <= 4 else 1 if score <= 9 else 2 if score <= 15 else 3 if score < 25 else 4
            fill = colors[band] if band < 4 else MAROON
            tc = "#FFFFFF" if band >= 3 else INK
            b.append(rect(x0 + c * cell, y0 + (4 - r) * cell, cell - 4, cell - 4, fill, None, 0, 2))
            b.append(txt(x0 + c * cell + (cell - 4) // 2, y0 + (4 - r) * cell + (cell - 4) // 2 + 10, str(score), 30, tc, "700"))
    b.append(txt(x0 + 2.5 * cell, y0 - 40, "LIKELIHOOD", 24, INK, "700"))
    b.append(f'<path d="M {x0 - 50} {y0 + 5 * cell} L {x0 - 50} {y0 - 30}" stroke="{INK}" stroke-width="3"/>')
    b.append(f'<path d="M {x0 - 62} {y0 - 12} L {x0 - 50} {y0 - 34} L {x0 - 38} {y0 - 12}" fill="none" stroke="{INK}" stroke-width="3"/>')
    b.append(f'<text x="{x0 - 90}" y="{y0 + 2.5 * cell}" font-family="{SYSTEM_FONT}" font-size="24" font-weight="700" fill="{INK}" '
             f'transform="rotate(-90 {x0 - 90} {y0 + 2.5 * cell})">CONSEQUENCE</text>')
    b.append(txt(600, y0 + 5 * cell + 70, "16-25 = STOP THE TASK", 22, MAROON, "700"))
    return svg_close(b + svg_caption(["SM-HIRA // 5X5 RISK MATRIX"], GREEN, "SAFEMAN BY ORYX"))


def plate_dust():  # gravimetric sampler
    b = [rect(470, 320, 260, 480, PAPER_LIGHT, INK, 4, 10)]
    b.append(f'<circle cx="600" cy="430" r="70" fill="none" stroke="{INK}" stroke-width="4"/>')
    b.append(f'<circle cx="600" cy="430" r="40" fill="none" stroke="{INK}" stroke-width="2"/>')
    b.append(txt(600, 560, "PUMP", 22, INK, "700"))
    b.append(txt(600, 600, "2.2 L/MIN", 20, MUTED, "600"))
    b.append(line(600, 800, 600, 900, INK, 3))
    b.append(f'<path d="M 600 900 L 540 980 L 660 980 Z" fill="none" stroke="{INK}" stroke-width="4"/>')
    b.append(txt(600, 1020, "CYCLONE UNDER 4 um", 22, MAROON, "700"))
    # dust field
    for i in range(26):
        x, y = 200 + (i * 137) % 800, 1090 + (i * 61) % 160
        b.append(f'<circle cx="{x}" cy="{y}" r="{2 + (i % 3)}" fill="{MUTED}" opacity="0.5"/>')
    b.append(line(180, 1080, 1020, 1080, HAIR, 2))
    return svg_close(b + svg_caption(["SM-DUST // RESPIRABLE SILICA"], GREEN, "SAFEMAN BY ORYX"))


def plate_noise():  # noise contours
    b = [ring(600, 640, 90, MAROON, 5), ring(600, 640, 170, MAROON, 3, "10 8"),
         ring(600, 640, 250, INK, 2.5, "10 10"), ring(600, 640, 330, HAIR, 2, "6 10"),
         ring(600, 640, 410, HAIR, 1.5, "4 12")]
    labels = ["100 dBA", "95 dBA", "90 dBA", "87 dBA", "85 dBA"]
    ys = [640, 640, 640, 640, 640]
    for (r, lab), y in zip([(90, labels[0]), (170, labels[1]), (250, labels[2]), (330, labels[3]), (410, labels[4])], ys):
        b.append(txt(600, 640 - r + 34, lab, 22, MAROON if r <= 170 else MUTED, "700"))
    b.append(rect(570, 610, 60, 60, INK, None, 0, 6))
    b.append(txt(600, 652, "!", 34, PAPER, "700"))
    b.append(txt(600, 1150, "85 dBA ACTION LEVEL - 8 HOUR Leq", 24, MUTED, "600"))
    return svg_close(b + svg_caption(["SM-NOISE // HEARING CONSERVATION"], GREEN, "SAFEMAN BY ORYX"))


def plate_ptw():  # permit register
    b = [rect(400, 300, 400, 560, PAPER_LIGHT, INK, 3, 6)]
    b.append(rect(400, 300, 400, 70, MAROON, None, 0, 6))
    b.append(txt(600, 346, "PERMIT TO WORK", 26, "#FFFFFF", "700", ls=3))
    rows = [("HOT WORK", "NO. 2026-014"), ("VALID 08:00-17:00", "LEVEL -2 EAST"), ("GAS TEST: 0% LEL", "TIME 07:42")]
    y = 420
    for a, bb in rows:
        b.append(txt(430, y, a, 22, INK, "700", "start"))
        b.append(txt(430, y + 32, bb, 19, MUTED, "500", "start"))
        y += 96
    b.append(line(430, 700, 770, 700, INK, 2))
    b.append(txt(430, 740, "AUTHORISED PERSON", 17, MUTED, "600", "start"))
    b.append(line(430, 800, 770, 800, INK, 2))
    b.append(txt(430, 840, "PERFORMING AUTHORITY", 17, MUTED, "600", "start"))
    b.append(txt(600, 1080, "ONE TASK - ONE PLACE - ONE VALIDITY", 22, MUTED, "600"))
    return svg_close(b + svg_caption(["SM-PTW // AUTHORISED PERSON"], GREEN, "SAFEMAN BY ORYX"))


def plate_incident():  # investigation timeline
    b = [line(200, 640, 1000, 640, INK, 3)]
    xs = [260, 440, 620, 800, 960]
    labels = ["NEAR MISS", "FIRST FAIL", "BARRIER\nLOSS", "TOP EVENT", "CONSEQ."]
    for x, lab in zip(xs, labels):
        b.append(f'<circle cx="{x}" cy="640" r="14" fill="{MAROON if lab == "TOP EVENT" else PAPER_LIGHT}" stroke="{INK}" stroke-width="3"/>')
        parts = lab.split("\n")
        for i, p in enumerate(parts):
            b.append(txt(x, 720 + i * 30, p, 18, INK if lab == "TOP EVENT" else MUTED, "700" if lab == "TOP EVENT" else "600"))
    # ICAM tiers
    tiers = ["ORGANISATIONAL FACTORS", "TASK FACTORS", "FRONT-LINE ACTS"]
    y = 860
    for i, t in enumerate(tiers):
        w = 760 - i * 200
        b.append(rect(600 - w // 2, y, w, 70, "none", INK if i < 2 else MAROON, 3 if i < 2 else 0, 4))
        b.append(txt(600, y + 42, t, 20, INK if i < 2 else "#FFFFFF", "700", ls=3))
        y += 100
    return svg_close(b + svg_caption(["SM-INC // ICAM INVESTIGATION"], GREEN, "SAFEMAN BY ORYX"))


def plate_waste():  # waste streams
    b = []
    bins = [("RECYCLE", "#EFE7DA", INK), ("GENERAL", "#E7DCC8", INK), ("HAZARDOUS", MAROON, "#FFFFFF")]
    x = 330
    for label, fill, tc in bins:
        b.append(f'<path d="M {x} 560 L {x + 180} 560 L {x + 164} 900 L {x + 16} 900 Z" fill="{fill}" stroke="{INK}" stroke-width="3"/>')
        b.append(rect(x - 10, 528, 200, 32, INK, None, 0, 4))
        b.append(txt(x + 90, 620, label.split("HAZ")[0], 0))
        b.append(txt(x + 90, 640, label, 18, tc, "700", ls=2))
        x += 230
    b.append(txt(600, 1020, "4R: REDUCE - REUSE - RECYCLE - RECOVER", 24, MUTED, "600"))
    b.append(txt(600, 1064, "HAZARDOUS WASTE MOVES ONLY WITH A MANIFEST", 19, GREEN, "700"))
    b.append(ring(600, 380, 40, GREEN, 3))
    b.append(f'<path d="M 586 380 l 10 12 l 20 -24" stroke="{GREEN}" stroke-width="4" fill="none"/>')
    return svg_close(b + svg_caption(["SM-ENV // WASTE CONTROL"], GREEN, "SAFEMAN BY ORYX"))


PLATES = {
    "academy_l1_foundation": (plate_l1, MAROON),
    "academy_l2_rep": (plate_l2, MAROON),
    "academy_l3_supervisor": (plate_l3, MAROON),
    "academy_l4_officer": (plate_l4, MAROON),
    "safeman_core_bowtie": (lambda: plate_bowtie("safeman_core_bowtie", ["SM-CORE // MANAGEMENT SYSTEM"], GREEN, "SAFEMAN BY ORYX"), GREEN),
    "academy_l5_manager": (lambda: plate_bowtie("academy_l5_manager", ["LEVEL 5 // RISK MODELLING"], MAROON, "ORYX SAFETY ACADEMY"), MAROON),
    "academy_l6_sensors": (plate_l6, MAROON),
    "academy_l7_strategy": (plate_l7, MAROON),
    "cpr_30_2": (plate_cpr, GREEN),
    "first_aid_kit": (plate_fak, GREEN),
    "pass_extinguisher": (plate_pass, GREEN),
    "harness_5point": (plate_harness, GREEN),
    "gas_4layer": (plate_gas, GREEN),
    "loto_padlock": (plate_loto, GREEN),
    "hira_matrix_5x5": (plate_hira, GREEN),
    "dust_sampler": (plate_dust, GREEN),
    "noise_contours": (plate_noise, GREEN),
    "ptw_register": (plate_ptw, GREEN),
    "investigation_timeline": (plate_incident, GREEN),
    "waste_streams": (plate_waste, GREEN),
}


# --------------------------------------------------------- external cleaner -
def find_font(size: int):
    for p in ("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
              "/usr/share/fonts/truetype/chinese/NotoSansSC-Regular.ttf"):
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def clean_external(path: Path) -> None:
    """bottom-64px crop -> paper knockout -> corner stamp -> dual export."""
    img = Image.open(path).convert("RGB")
    img = img.crop((0, 0, img.width, max(1, img.height - 64)))  # watermark strip

    # knockout: near-white / near-paper pixels -> transparent
    rgba = img.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if r > 232 and g > 228 and b > 218:  # paper-white family
                px[x, y] = (r, g, b, 0)
    rgba = rgba.resize((min(w, 1200), int(h * min(1200, w) / w)), Image.LANCZOS)

    # corner brand stamp
    d = ImageDraw.Draw(rgba)
    stamp = "SAFEMAN // ORYXINSTITUTE.ORG"
    font = find_font(18)
    tw = d.textlength(stamp, font=font)
    mx, my = rgba.width - tw - 28, rgba.height - 40
    d.rectangle([mx - 12, my - 8, mx + tw + 12, my + 26], fill=(250, 246, 240, 235))
    d.text((mx, my), stamp, font=font, fill=(24, 21, 20, 255))

    stem = path.stem.lower().replace(" ", "_")
    png_path, webp_path = OUT_PNG / f"{stem}.png", OUT_WEBP / f"{stem}.webp"
    rgba.save(png_path, "PNG", optimize=True)
    rgba.save(webp_path, "WEBP", quality=90, method=6)
    print(f"  cleaned: {stem} -> png {png_path.stat().st_size/1024:.0f} KB / webp {webp_path.stat().st_size/1024:.0f} KB")


# --------------------------------------------------------------------- main -
def main() -> int:
    OUT_WEBP.mkdir(parents=True, exist_ok=True)
    OUT_PNG.mkdir(parents=True, exist_ok=True)
    args = set(sys.argv[1:])
    budget_fail = []

    if "--clean-only" not in args:
        print(f"[plates] rendering {len(PLATES)} procedural plates...")
        for name, (fn, _accent) in PLATES.items():
            png, webp, kb_png, kb_webp = render(name, fn())
            flag = ""
            if kb_webp > 45:
                flag += " WEBP-OVER"; budget_fail.append(name)
            if kb_png > 90:
                flag += " PNG-OVER"; budget_fail.append(name)
            print(f"  {name:28s} webp {kb_webp:5.1f} KB | png {kb_png:5.1f} KB{flag}")

    if RAW_PLATES.is_dir():
        ext = [p for p in sorted(RAW_PLATES.iterdir())
               if p.suffix.lower() in (".jpg", ".jpeg", ".png") and not p.name.startswith(".")]
        if ext:
            print(f"[cleaner] processing {len(ext)} external image(s) from assets/raw_plates/")
            for p in ext:
                clean_external(p)
        else:
            print("[cleaner] no external images in assets/raw_plates/")
    else:
        print("[cleaner] assets/raw_plates/ not present - external cleaning skipped")

    if budget_fail:
        print(f"[plates] BUDGET OVERFLOW on: {sorted(set(budget_fail))}")
        return 1
    print("[plates] all budgets within: webp<45 KB, png<90 KB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
