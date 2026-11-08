#!/usr/bin/env python3
"""Generate -700.webp variants for every plate the SM-CORE page shows, so phones fetch a
right-sized file (perf.mjs: natural > 2.2x shown is a FAIL). Idempotent; skips existing."""
from PIL import Image
from pathlib import Path

PLATES = Path('/home/z/my-project/oryx-safeman-ecosystem/public/sm-core/assets/img/plates')
TARGETS = [
    'safeman_core_bowtie', 'ptw_register', 'gas_4layer', 'hira_matrix_5x5',
    'first_aid_kit', 'smcore_enrol_register', 'smcore_exam_portal',
    'smcore_certificate', 'smcore_handbook_cover', 'cpr_30_2',
    'harness_5point', 'dust_sampler', 'investigation_timeline',
]

for name in TARGETS:
    src = PLATES / f'{name}.webp'
    dst = PLATES / f'{name}-700.webp'
    if not src.exists():
        print(f'SKIP (missing): {src}')
        continue
    if dst.exists():
        print(f'exists: {dst.name}')
        continue
    im = Image.open(src)
    w, h = im.size
    nw = 700
    nh = round(h * nw / w)
    small = im.resize((nw, nh), Image.LANCZOS)
    small.save(dst, 'WEBP', quality=82, method=6)
    print(f'{dst.name}: {nw}x{nh} {dst.stat().st_size // 1024} KB (from {w}x{h})')

# the on-page QR is shown at 56px; a 120px variant halves its bytes
qr = PLATES.parent / 'verify_qr.png'
qr120 = PLATES.parent / 'verify_qr-120.png'
if qr.exists() and not qr120.exists():
    im = Image.open(qr)
    im.resize((120, 120), Image.NEAREST).save(qr120, 'PNG', optimize=True)
    print(f'verify_qr-120.png: {qr120.stat().st_size // 1024} KB')
