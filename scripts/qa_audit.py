#!/usr/bin/env python3
"""Repository quality gate - Oryx Institute (MASTER UPGRADE BRIEF part 5).

Scans the web repository for the defect classes named in the brief:
  - date inconsistencies (everything static must read 2026-11; client PDFs
    use the live date, which is correct by construction)
  - legacy contact hygiene (old P.O. Box strings, phone numbers, duplicate
    'Principal and Founder' variants, 'Appointment Pending' placeholders)
  - generic AI-layout signals (shadows, gradients, decorative blobs/dots)
  - placeholder debris (XXX, TODO, FIXME, Lorem, undefined, NaN, chinese
    full-width brackets left in code)
  - asset budget enforcement (signature height 240px, plate KB limits)

Exit code 0 = clean. Run before every build:  npm run qa
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCAN_DIRS = ["app", "components", "lib", "scripts", "public/data", "data_src"]
SCAN_EXT = {".ts", ".tsx", ".css", ".json", ".py", ".md", ".html", ".js", ".mjs"}

# (pattern, human label) - hits are failures
FORBIDDEN = [
    (re.compile(r"Appointment\s+Pending", re.I), "placeholder 'Appointment Pending'"),
    (re.compile(r"P\.?O\.?\s*Box", re.I), "legacy P.O. Box contact"),
    (re.compile(r"Principal\s+and\s+Founder", re.I), "legacy title variant 'Principal and Founder' (use 'Principal & Founder')"),
    (re.compile(r"\+264[\s\d]{6,}"), "telephone number (email-only rule)"),
    (re.compile(r"\bLorem\s+ipsum", re.I), "lorem ipsum debris"),
    (re.compile(r"XXX(?!X)"), "placeholder debris (XXX)"),
    (re.compile(r"\bTODO\b|\bFIXME\b"), "placeholder debris"),
    (re.compile(r"['\">]\s*undefined\s*[\"'<]|\bNaN\b(?!\))"), "undefined/NaN literal in source"),
    (re.compile(r"【|】"), "chinese bracket placeholder"),
    (re.compile(r"box-shadow\s*:"), "CSS box-shadow (AI-layout signal)"),
    (re.compile(r"linear-gradient|radial-gradient"), "CSS gradient (AI-layout signal)"),
    (re.compile(r"drop-shadow|text-shadow"), "CSS shadow (AI-layout signal)"),
]

ALLOWED_IN = {
    # qa_audit owns these patterns by definition (self-scan safe)
    "qa_audit.py",
    # npm lockfiles / build output never scanned (not in SCAN_DIRS)
}

DATE_OK = "2026-11"
# date-like literals that are NOT the approved stamp - excluding dynamic client date pattern
DATE_RE = re.compile(r"\b20\d{2}-\d{2}\b")
DYNAMIC_OK = re.compile(r"toISOString\(\)\.split")

def scan_text():
    failures = []
    for d in SCAN_DIRS:
        base = ROOT / d
        if not base.exists():
            continue
        for p in base.rglob("*"):
            if not p.is_file() or p.suffix.lower() not in SCAN_EXT:
                continue
            if p.name in ALLOWED_IN:
                continue
            try:
                text = p.read_text(encoding="utf-8")
            except Exception:
                continue
            rel = str(p.relative_to(ROOT))
            for i, line in enumerate(text.splitlines(), 1):
                for pat, label in FORBIDDEN:
                    if pat.search(line):
                        failures.append(f"{rel}:{i}  {label}: {line.strip()[:96]}")
    return failures


def scan_dates():
    """Static date literals must be 2026-11 (client-side dynamic dates are exempt)."""
    hits = []
    for d in ["app", "components", "lib", "data_src"]:
        base = ROOT / d
        if not base.exists():
            continue
        for p in base.rglob("*"):
            if p.suffix.lower() not in {".ts", ".tsx", ".json", ".py"}:
                continue
            try:
                text = p.read_text(encoding="utf-8")
            except Exception:
                continue
            rel = str(p.relative_to(ROOT))
            for i, line in enumerate(text.splitlines(), 1):
                for m in DATE_RE.finditer(line):
                    val = m.group(0)
                    if val == DATE_OK:
                        continue
                    window = line[max(0, m.start() - 60):m.end() + 60]
                    if DYNAMIC_OK.search(window):
                        continue
                    hits.append(f"{rel}:{i}  date '{val}' != {DATE_OK}")
    return hits


def scan_assets():
    msgs = []
    sig = ROOT / "public" / "assets" / "signatures" / "principal_signature.png"
    if sig.exists():
        try:
            from PIL import Image
            with Image.open(sig) as im:
                if im.height != 240:
                    msgs.append(f"signature height {im.height}px != 240px - re-run scripts/process_signature.py")
        except Exception:
            msgs.append("signature unreadable")
    else:
        msgs.append("missing public/assets/signatures/principal_signature.png - run scripts/process_signature.py")

    webp = ROOT / "public" / "assets" / "webp"
    png = ROOT / "public" / "assets" / "png"
    if not webp.exists() or not any(webp.iterdir()):
        msgs.append("missing plate webp set - run scripts/generate_bulk_assets.py")
    else:
        for f in webp.iterdir():
            kb = f.stat().st_size / 1024
            if kb > 45:
                msgs.append(f"{f.name} webp {kb:.0f}KB > 45KB budget")
        for f in png.iterdir():
            kb = f.stat().st_size / 1024
            if kb > 90:
                msgs.append(f"{f.name} png {kb:.0f}KB > 90KB budget")

    data = ROOT / "public" / "data"
    for name in ("courses.json", "portal.json"):
        f = data / name
        if not f.exists():
            msgs.append(f"missing public/data/{name} - run scripts/build_site_data.py")
    return msgs


def main() -> int:
    print("=" * 64)
    print("ORYX INSTITUTE - REPOSITORY QUALITY GATE")
    print("=" * 64)
    failures = scan_text()
    dates = scan_dates()
    assets = scan_assets()

    if failures:
        print(f"\n[FAIL] contact/placeholder/layout hygiene - {len(failures)} hit(s):")
        for f in failures:
            print("   " + f)
    else:
        print("[OK]   contact/placeholder/layout hygiene")

    if dates:
        print(f"\n[FAIL] date discipline - {len(dates)} hit(s):")
        for f in dates:
            print("   " + f)
    else:
        print(f"[OK]   date discipline ({DATE_OK} + dynamic client dates only)")

    if assets:
        print(f"\n[FAIL] asset pipeline - {len(assets)} issue(s):")
        for f in assets:
            print("   " + f)
    else:
        print("[OK]   asset pipeline (signature 240px, plates within budget, data present)")

    total = len(failures) + len(dates) + len(assets)
    print("-" * 64)
    if total:
        print(f"RESULT: {total} issue(s) - fix before npm run build")
        return 1
    print("RESULT: CLEAN - repository is build-ready")
    return 0


if __name__ == "__main__":
    sys.exit(main())
