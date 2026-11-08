#!/usr/bin/env python3
"""Open-source materials pipeline - SafeMan Core (SM-CORE).

Generates the downloadable course-materials library in public/materials/:
  1. SM-CORE-Course-Handbook.pdf   - from scripts/materials-src/sm-core-handbook.html
                                      via the pdf skill's html2pdf-next.js (vector, Paged.js)
  2. SM-CORE-Course-Handbook.md    - same content, agent-friendly Markdown
  3. SM-CORE-Exam-Blueprint.md     - examination structure and integrity policy
  4. SafeMan-Service-Model.md      - the whole SafeMan service model
  5. SafeMan-Course-Catalogue.json - verbatim machine-readable catalogue
  6. LICENSE.txt                   - CC BY 4.0 legal code (bundled copy, canonical source credited)
  7. manifest.json                 - every file with bytes + sha256, for humans and agents

Also renders the handbook cover (page 1) to PNG/WebP for the course page's
materials section visual.

Usage: python3 scripts/generate_course_materials.py
"""
from __future__ import annotations

import hashlib
import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PDF_SKILL = Path("/home/z/my-project/skills/pdf")
SRC = ROOT / "scripts" / "materials-src"
OUT = ROOT / "public" / "materials"
PLATES = ROOT / "public" / "sm-core" / "assets" / "img" / "plates"
TMP = Path("/tmp/render/materials")

HANDBOOK_HTML = SRC / "sm-core-handbook.html"
HANDBOOK_PDF = OUT / "SM-CORE-Course-Handbook.pdf"
LICENSE_SRC = SRC / "CC-BY-4.0.txt"
CATALOGUE_SRC = ROOT / "public" / "data" / "courses.json"

GENERATED = "2026-11-08"
REPO_URL = "https://github.com/tangison/oryx-safeman-ecosystem"
SITE = "safeman.oryxinstitute.org"

# --------------------------------------------------------------- markdown
HANDBOOK_MD = """# SafeMan Core: Safety Management System — Course Handbook

**Course:** SM-CORE — SafeMan Core: Safety Management System
**Suite:** SafeMan by Oryx · Oryx Institute
**Edition:** 1.0 · November 2026
**Licence:** Creative Commons Attribution 4.0 International (CC BY 4.0)
**Source:** {repo}

---

## 1. What SafeMan Core is

SafeMan Core (SM-CORE) is the flagship programme of SafeMan by Oryx, the corporate
safety-training suite of Oryx Institute. It is a SAMTRAC-equivalent, five-day-equivalent
management-systems ticket built around three international standards: ISO 45001:2018 for
occupational health and safety management, ISO 14001:2015 for environmental control, and
ISO 31000 for risk management. A cohort that completes Core can read, run and audit a
safety management system rather than only comply with one.

The programme carries 40 notional hours across four modules, closing on a timed
examination sat in the student portal. Learners who pass are issued a numbered
certificate and a PVC pass, both sealed with a QR code that anyone — an employer, an
auditor, a client — can verify in seconds without an account or a database lookup.

Core is written for HSE managers, safety officers and supervisors: the people who own
the system day to day. It is the five-day spine of the thirteen-ticket SafeMan catalogue;
the other twelve tickets are one-to-two-day specialist programmes that attach to it.

> **Benchmark disclosure.** SafeMan by Oryx is an inter-organizational industry safety
> benchmark aligned with ISO 45001:2018, ISO 14001:2015 and ISO 31000, and pre-referenced
> to NTA Unit Standards 846–858 and Namibian GN 156 of 1997 (non-NQA statutory credit).
> It is not an NQA-accredited qualification. SAMTRAC is a trademark of NOSA (Pty) Ltd;
> "SAMTRAC-style" and "SAMTRAC-equivalent" are comparative descriptors. For the
> government pre-certified pathway, enrol with the Oryx Safety Academy NQF track.

## 2. Course facts

| Fact | Value |
| --- | --- |
| Course code | SM-CORE — SafeMan Core: Safety Management System |
| Duration | 5-day equivalent |
| Notional hours | 40 |
| Standards alignment | ISO 45001:2018 · ISO 14001:2015 · ISO 31000 |
| Statutory pre-references | NTA Unit Standards 846–858 · GN 156 of 1997 (Namibia) |
| Modules | 4 (C1–C4) |
| Examination | 8 questions · 10 minutes · pass mark 7 of 8 |
| Credential | Numbered certificate + PVC pass, QR-verified |
| Delivery modes | Individual · corporate cohort (in-house) · corporate cohort (public class) |
| Materials licence | CC BY 4.0 |

## 3. The four modules

Four modules carry a cohort from the ISO 45001 clause map to an audited environmental
register. Each module pairs the standard's language with the artefact it produces — a
legal register, a BowTie diagram, a permit workflow, an aspects-and-impacts register —
so the system is built on paper while it is taught.

### Module C1 — The OHS management system architecture

Plan-Do-Check-Act applied to ISO 45001:2018: context of the organisation, worker
participation, documented information, and the legal register as the system's foundation.

- ISO 45001 clause map 4–10
- Legal & other requirements register
- Worker consultation obligations
- Documented information control

### Module C2 — ISO 31000 risk & BowTie barrier thinking

Risk assessment methodology from context to treatment. BowTie diagrams make threats,
top events, consequences and preventive/recovery barriers explicit and auditable.

- Risk appetite & criteria
- BowTie: threat — top event — consequence
- Preventive vs recovery barriers
- Barrier health monitoring

### Module C3 — Contractor & e-PTW governance

Managing contractor safety from pre-qualification to demobilisation: safety file review,
mutual responsibility matrices, and electronic permit-to-work workflows.

- Pre-qualification criteria
- Safety file review checklist
- e-PTW workflow & authorities
- Handover & close-out

### Module C4 — ISO 14001 environmental control & auditing

Environmental aspects/impacts registers, waste hierarchy, emergency preparedness for
spills, and internal audit programmes aligned to ISO 45001 and ISO 14001 clause 9.

- Aspects & impacts register
- Waste hierarchy 4Rs
- Spill response preparedness
- Internal audit & MOC

## 4. The timed examination

The examination is sat in the SafeMan student portal, under a live countdown, and is
drawn fresh from the question bank on every attempt. Eight questions in ten minutes;
the pass mark is seven of eight. Questions are drawn from the four modules' own
territory — the clause map, the BowTie, the permit workflow and the environmental
register — so a pass means the material was absorbed, not memorised.

| Format | Value |
| --- | --- |
| Questions per paper | 8 |
| Time limit | 10 minutes, enforced by the portal clock |
| Pass mark | 7 of 8 |
| Draw policy | Fresh draw from the bank each attempt |
| Where it runs | SafeMan student portal, with a cohort access code |

> **Exam integrity.** The live question bank is not published. This handbook and the
> exam blueprint describe the structure, timing and marking of the paper — never the
> questions themselves.

## 5. The credential

A pass issues two documents on the spot: a numbered A4 certificate and a wallet-sized
PVC pass, both signed by Tangi Iigonda, Principal & Founder of Oryx Institute. SafeMan
serials run in the SM-2026-NNNN series and record the learner's name, the course code
and the issue date.

Every credential carries a QR code that encodes its payload and an HMAC-SHA256
signature. Scanning it opens the public verification page, which recomputes the
signature and states plainly whether the document was issued by Oryx Institute — no
account, no database, arithmetic-level trust. Employers and auditors can verify a
SafeMan pass as easily as reading it.

The chain, end to end:

1. **Enrol** — cohort request to the registrar.
2. **Study** — modules C1–C4, 40 notional hours.
3. **Exam** — 8 questions, 10 minutes, in the portal.
4. **Credential** — numbered certificate + PVC pass.
5. **Verify** — QR to the public verify page.

## 6. Delivery and enrollment

Enrollment requests go to the registrar at Oryx Institute by email. The registrar
replies with cohort dates, the invoice and a portal access code for each learner — no
accounts are created and no passwords are remembered.

- **Individual Registration** — one learner, one seat, a scheduled public intake.
- **Corporate Cohort (in-house)** — the ticket runs at your site, for your team, on your
  calendar.
- **Corporate Cohort (public class)** — your team joins a scheduled public intake.

Access codes follow the cohort format issued by the registrar (for example ORYX-2026).
Learners sign into the student portal with their name and code, study the module
material, sit the timed examination and download their certificate and PVC pass from
the same room.

## 7. The thirteen-ticket catalogue

Core is the five-day spine of a thirteen-ticket suite grouped in four families: emergency
practicums, sub-protection tickets, hygiene & exposure, and management systems. Every
ticket closes on the same timed-examination and QR-verified credential chain as Core.
The machine-readable version of this catalogue ships beside this handbook as
`SafeMan-Course-Catalogue.json`.

| Code | Ticket | Duration | Hrs |
| --- | --- | --- | --- |
| SM-CORE | SafeMan Core: Safety Management System | 5-day equiv. | 40 |
| SM-CPR | Basic Life Support, CPR & Choking | 1 day | 8 |
| SM-FA1 | Workplace First Aid Responder | 2 days | 16 |
| SM-FIRE | Basic Firefighting & Fire Marshal | 1 day | 8 |
| SM-WAH | Working at Heights & Fall Arrest | 1 day | 8 |
| SM-CSE | Confined Space & Gas Testing | 1–2 days | 10 |
| SM-LOTO | Lockout / Tagout Energy Isolation | 1 day | 8 |
| SM-HIRA | Task HIRA & DSTI Facilitator | 1 day | 8 |
| SM-DUST | Respirable Crystalline Silica & Dust Control | 1 day | 8 |
| SM-NOISE | Noise Conservation & Hearing Protection | 1 day | 8 |
| SM-PTW | Permit to Work Authorised Person | 1 day | 8 |
| SM-INC | Incident Investigation & ICAM | 1 day | 8 |
| SM-ENV | Environmental Awareness & Waste Control | 1 day | 8 |

## 8. The Oryx dual-track

SafeMan by Oryx is the corporate, industry-benchmark track. Its sister programme, the
Oryx Safety Academy, is the vocational spine pre-referenced to NTA Unit Standards and
Namibian GN 156 of 1997 ahead of formal NQA accreditation, running from Level 1 site
foundation to Level 7 strategic EHS. Organisations that want the government
pre-certified pathway enrol with the Academy; organisations that want a fast, verified
corporate benchmark run SafeMan tickets. Many run both.

| Level | Academy programme | Notional hrs |
| --- | --- | --- |
| NQF L1 | Foundation Workplace Health & Safety | 70 |
| NQF L2 | Workplace SHE Representative & Risk Control | 100 |
| NQF L3 | Supervisory OHS & Environmental Responsibility | 120 |
| NQF L4 | National Vocational Certificate in OHS | 140 |
| NQF L5 | National Vocational Diploma in OHS Management | 160 |
| NQF L6 | Diploma in Applied OHS Instrumentation & Hygiene | 160 |
| NQF L7 | Advanced Diploma in Strategic EHS, PSM & ESG | 180 |

## 9. Open-source licence

This handbook is open source. It is licensed under Creative Commons Attribution 4.0
International (CC BY 4.0): you may copy, reprint, redistribute and adapt it, including
commercially, as long as you credit the source. The full legal code ships beside this
handbook as `LICENSE.txt` in the materials library.

The materials library also carries this handbook in Markdown, the exam blueprint, the
full service model, and a machine-readable manifest that lists every file with its size
and SHA-256 checksum — so a person or an agent can fetch the whole library in one pass.
The site and engine source code that produces the portal, the examination, the
certificates and the verification chain is open source under the MIT licence in the
project repository.

**Required attribution:**
SafeMan Core Course Handbook by Oryx Institute (SafeMan by Oryx),
safeman.oryxinstitute.org. Licensed under CC BY 4.0.
Source: {repo}
"""

BLUEPRINT_MD = """# SM-CORE Examination Blueprint

**Course:** SM-CORE — SafeMan Core: Safety Management System
**Suite:** SafeMan by Oryx · Oryx Institute
**Edition:** 1.0 · November 2026
**Licence:** Creative Commons Attribution 4.0 International (CC BY 4.0)
**Source:** {repo}

---

## 1. Purpose

This blueprint describes the structure, timing, delivery and marking of the SM-CORE
timed examination, so that employers, regulators and other training providers can
understand exactly what a pass certifies. It deliberately does not publish the live
question bank: the examination's value depends on the bank staying unpublished.

## 2. Format

| Element | Value |
| --- | --- |
| Questions per paper | 8 |
| Time limit | 10 minutes, enforced by the portal clock |
| Pass mark | 7 of 8 |
| Delivery | SafeMan student portal, signed in with a cohort access code |
| Draw policy | Fresh draw from the bank on every attempt |
| Result | PASS / FAIL banner in the portal; a pass unlocks the credential room |

## 3. Coverage

Questions are drawn from the four modules' own territory:

- **C1 — The OHS management system architecture:** the ISO 45001 clause map, the legal
  register, worker consultation, documented information.
- **C2 — ISO 31000 risk & BowTie barrier thinking:** risk criteria, threats, top events,
  consequences, preventive and recovery barriers, barrier health.
- **C3 — Contractor & e-PTW governance:** pre-qualification, safety file review, permit
  workflow and authorities, handover and close-out.
- **C4 — ISO 14001 environmental control & auditing:** aspects and impacts, the waste
  hierarchy, spill preparedness, internal audit and management of change.

## 4. Marking and retakes

The paper is marked by the portal immediately on submission. Every question carries
equal weight; seven correct answers of eight pass the paper. A failed attempt may be
followed by another: each attempt is a fresh draw from the bank, so memorising one
paper does not carry the next.

## 5. Integrity

- The live question bank is not published and does not ship in any materials file.
- The examination runs under a live countdown in the portal; the timer is server-side
  to the learner's session.
- The blueprint, the handbook and the catalogue describe structure only — never
  questions, never answers.
"""

SERVICE_MD = """# The SafeMan Service Model

**Suite:** SafeMan by Oryx · Oryx Institute
**Edition:** 1.0 · November 2026
**Licence:** Creative Commons Attribution 4.0 International (CC BY 4.0)
**Source:** {repo}

---

## 1. Brand architecture

Oryx Institute runs two safety-education tracks under one roof:

- **SafeMan by Oryx** — the corporate, industry-benchmark track. Thirteen tickets
  (SM-CORE plus twelve specialist programmes), SAMTRAC-style, aligned with ISO 45001,
  ISO 14001 and ISO 31000, closing on QR-verified credentials. This is the B2B suite.
- **Oryx Safety Academy** — the vocational spine, NQF Levels 1–7, pre-referenced to NTA
  Unit Standards and Namibian GN 156 of 1997 ahead of formal NQA accreditation. This is
  the government pre-certified pathway.

SafeMan is an inter-organizational industry safety benchmark, not an NQA-accredited
qualification; its credit is statutory, through the pre-referenced unit standards.

## 2. The catalogue

Thirteen tickets in four families, every one closing on the same exam-and-credential
chain:

- **Emergency practicums** — SM-CPR (BLS, CPR & choking, 1 day), SM-FA1 (workplace
  first aid responder, 2 days), SM-FIRE (firefighting & fire marshal, 1 day).
- **Sub-protection tickets** — SM-WAH (heights & fall arrest), SM-CSE (confined space
  & gas testing, 1–2 days), SM-LOTO (lockout/tagout), SM-HIRA (task HIRA & DSTI
  facilitator).
- **Hygiene & exposure** — SM-DUST (respirable crystalline silica & dust control),
  SM-NOISE (noise conservation & hearing protection).
- **Management systems** — SM-PTW (permit to work authorised person), SM-INC (incident
  investigation & ICAM), SM-ENV (environmental awareness & waste control), and the
  flagship **SM-CORE** (safety management system, 5-day equivalent, 40 notional hours).

The full machine-readable catalogue — all thirteen SafeMan tickets and all seven
Academy levels with durations, notional hours and standards references — ships as
`SafeMan-Course-Catalogue.json` beside this document.

## 3. The engagement flow

1. **Request.** An organisation or individual emails the registrar
   (info@oryxinstitute.org) with the course, cohort size and preferred mode.
2. **Confirmation.** The registrar replies with cohort dates, the invoice, and a portal
   access code per learner (cohort format, e.g. ORYX-2026).
3. **Study.** Learners sign into the student portal with their name and access code —
   no accounts, no passwords — and work through the module material.
4. **Examination.** The timed examination runs in the portal: eight questions, ten
   minutes, a fresh draw each attempt, pass mark seven of eight.
5. **Credential.** A pass unlocks the credential room: a numbered A4 certificate and a
   wallet-sized PVC pass, generated on the learner's own device, signed by Tangi
   Iigonda, Principal & Founder.
6. **Verification.** Every credential carries a QR code; scanning it opens the public
   verification page, which recomputes an HMAC-SHA256 signature over the credential
   payload and states whether the document was issued by Oryx Institute. No account, no
   database — arithmetic-level trust.

## 4. Registration modes

- **Individual Registration** — one learner, one seat, a scheduled public intake.
- **Corporate Cohort (in-house)** — the ticket runs at the client's site, for the
  client's team, on the client's calendar.
- **Corporate Cohort (public class)** — the client's team joins a scheduled public
  intake.

## 5. The verification architecture

Credentials are verified statelessly. The QR encodes a base64url payload (serial,
learner name, course code, issue date, track) and an HMAC-SHA256 signature computed
over it. The public verification page recomputes the signature with the site key and
compares. Anyone can read a payload; only the key holder can produce a matching
signature. The scheme runs on a static site with zero server cost, which is why
verification stays free and permanent for every issued credential.

Serial formats: SafeMan credentials run SM-2026-NNNN; Academy credentials run
ORYX-2026-NNNN.

## 6. The open-source model

Everything a cohort, a trainer or an agent needs is published:

- **Course materials** (this document, the handbook, the exam blueprint, the catalogue)
  are open source under CC BY 4.0 — copy, print, adapt, even commercially, with
  attribution.
- **Site and engine source** — the Next.js static site, the portal, the exam runner,
  the certificate and PVC-pass generator, the verification chain, the asset pipelines —
  is open source under the MIT licence at {repo}.
- **A machine-readable manifest** (`manifest.json`) lists every materials file with its
  size and SHA-256 checksum, so the whole library can be fetched and verified in one
  pass.

The live examination question bank is the one deliberate exception: it stays
unpublished so the credential keeps its value.

## 7. Contact

Enrollment requests and registrar questions: **info@oryxinstitute.org**.
Credential verification: **safeman.oryxinstitute.org/verify**.
"""


def run(cmd: list[str], cwd: Path | None = None, env: dict | None = None) -> None:
    print("+", " ".join(str(c) for c in cmd))
    import os
    r = subprocess.run([str(c) for c in cmd], cwd=str(cwd) if cwd else None,
                       capture_output=True, text=True,
                       env={**os.environ, **env} if env else None)
    if r.returncode != 0:
        print(r.stdout[-3000:])
        print(r.stderr[-3000:])
        sys.exit(f"FAILED: {' '.join(str(c) for c in cmd)}")
    tail = (r.stdout or r.stderr).strip().splitlines()
    if tail:
        print("  " + "\n  ".join(tail[-6:]))


def sha256(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def validate_html() -> None:
    """poster_validate check-html.

    COVER_TEXT_OVERLAP is auto-run document-wide when a .cover exists, but
    cover_validate.js is a cover-ONLY tool (pdf skill file map: "Do NOT run on
    posters or documents"). On this flow document its document-wide pass
    flags table cells as text-text overlaps. Waiver path: the error is
    accepted only if the cover, validated in isolation, passes cleanly.
    """
    import re
    r = subprocess.run(
        ["python3", str(PDF_SKILL / "scripts" / "poster_validate.py"), "check-html", str(HANDBOOK_HTML)],
        capture_output=True, text=True)
    out = r.stdout.strip()
    try:
        report = json.loads(out[out.index("{"):])
    except ValueError:
        report = {"errors": [{"code": "VALIDATE_CRASH", "message": out[-800:]}]}
    hard = [e for e in report.get("errors", []) if e.get("code") != "COVER_TEXT_OVERLAP"]
    cover_flagged = any(e.get("code") == "COVER_TEXT_OVERLAP" for e in report.get("errors", []))
    cover_unavailable = any(w.get("code") == "COVER_VALIDATE_UNAVAILABLE"
                            for w in report.get("warnings", []))
    for e in hard:
        print("  HTML ERROR:", e.get("code"), "-", e.get("message", "")[:200])
    for w in report.get("warnings", []):
        print("  HTML WARN :", w.get("code"), "-", w.get("message", "")[:160])
    if hard:
        sys.exit("poster_validate reported hard errors - fix the handbook HTML")
    if cover_flagged or cover_unavailable:
        print("  cover check: validating the cover in isolation (document-wide pass "
              + ("flagged" if cover_flagged else "unavailable") + ")")
        src = HANDBOOK_HTML.read_text(encoding="utf-8")
        head = src.split("<body>")[0] + "<body>\n"
        m = re.search(r"<!-- =+ cover -->.*?(?=<!-- =+ content -->)", src, re.S)
        if not m:
            sys.exit("cover block not found for isolated validation")
        Path("/tmp/render/materials").mkdir(parents=True, exist_ok=True)
        cover_only = Path("/tmp/render/materials/cover-only.html")
        cover_only.write_text(head + m.group(0) + "\n</body>\n</html>", encoding="utf-8")
        shutil.copytree(SRC / "assets", "/tmp/render/materials/assets",
                        dirs_exist_ok=True)
        rc = subprocess.run(
            ["node", str(PDF_SKILL / "scripts" / "cover_validate.js"), str(cover_only)],
            capture_output=True, text=True,
            env={**__import__("os").environ,
                 "PLAYWRIGHT_CHROMIUM_PATH":
                     "/home/z/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome"})
        tail = (rc.stdout + rc.stderr).strip().splitlines()
        print("   " + "\n   ".join(tail[-4:]))
        if rc.returncode != 0:
            sys.exit("isolated cover validation FAILED - fix the cover")
        print("  waiver accepted: isolated cover validation passed")


def main() -> None:
    TMP.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)
    PLATES.mkdir(parents=True, exist_ok=True)

    # 1. validate the handbook HTML ----------------------------------------
    validate_html()

    # 2. render the vector PDF via the skill's converter --------------------
    # --nopaged: Chromium native @page pagination. The Paged.js polyfill times
    # out on this document (30 s) and its half-finished DOM mutation leaves an
    # empty body for the fallback print; native mode never touches the DOM and
    # paginates the break-* / thead rules natively (skill-sanctioned mode).
    run(["node", PDF_SKILL / "scripts" / "html2pdf-next.js", HANDBOOK_HTML,
         "--output", HANDBOOK_PDF, "--width", "720px", "--height", "1020px",
         "--nopaged"],
        env={"PLAYWRIGHT_CHROMIUM_PATH":
             "/home/z/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome"})

    # 3. PDF metadata (client-branded) --------------------------------------
    meta_tmp = TMP / "handbook-meta.pdf"
    run(["python3", PDF_SKILL / "scripts" / "pdf.py", "meta.set", HANDBOOK_PDF,
         "-o", meta_tmp,
         "-d", json.dumps({
             "Title": "SafeMan Core Course Handbook (SM-CORE)",
             "Author": "Oryx Institute",
             "Subject": "SafeMan Core: Safety Management System - course handbook, modules C1-C4, examination and verified credential. CC BY 4.0.",
             "Creator": "Oryx Institute - open materials pipeline",
         })])
    shutil.move(meta_tmp, HANDBOOK_PDF)

    # 4. PDF QA --------------------------------------------------------------
    run(["python3", PDF_SKILL / "scripts" / "pdf_qa.py", "--no-tables", HANDBOOK_PDF])

    # 5. markdown + json + licence -------------------------------------------
    (OUT / "SM-CORE-Course-Handbook.md").write_text(
        HANDBOOK_MD.format(repo=REPO_URL), encoding="utf-8")
    (OUT / "SM-CORE-Exam-Blueprint.md").write_text(
        BLUEPRINT_MD.format(repo=REPO_URL), encoding="utf-8")
    (OUT / "SafeMan-Service-Model.md").write_text(
        SERVICE_MD.format(repo=REPO_URL), encoding="utf-8")
    shutil.copyfile(CATALOGUE_SRC, OUT / "SafeMan-Course-Catalogue.json")
    shutil.copyfile(LICENSE_SRC, OUT / "LICENSE.txt")

    # 6. handbook cover render (page 1) for the course page visual -----------
    run(["pdftoppm", "-png", "-r", "150", "-f", "1", "-l", "1",
         HANDBOOK_PDF, str(TMP / "cover")])
    cover_png = next(TMP.glob("cover-*.png"))
    img_target = PLATES / "smcore_handbook_cover"
    from PIL import Image
    im = Image.open(cover_png).convert("RGB")
    im.save(str(img_target) + ".webp", "WEBP", quality=88, method=6)
    im.save(str(img_target) + ".png", "PNG", optimize=True)
    print("cover render:", img_target.with_suffix(".webp"),
          (img_target.with_suffix(".webp")).stat().st_size // 1024, "KB webp,",
          (img_target.with_suffix(".png")).stat().st_size // 1024, "KB png")

    # 7. manifest -------------------------------------------------------------
    files = [
        ("SM-CORE-Course-Handbook.pdf",
         "The full course handbook: modules C1-C4, the timed examination, the verified "
         "credential chain, the thirteen-ticket catalogue and the licence.",
         "application/pdf"),
        ("SM-CORE-Course-Handbook.md",
         "The same handbook in Markdown, for reading and reuse by agents.",
         "text/markdown"),
        ("SM-CORE-Exam-Blueprint.md",
         "Structure, timing, coverage, marking and integrity policy of the timed "
         "examination. The live question bank is never published.",
         "text/markdown"),
        ("SafeMan-Service-Model.md",
         "The whole service model: brand architecture, catalogue, engagement flow, "
         "registration modes, verification architecture and the open-source model.",
         "text/markdown"),
        ("SafeMan-Course-Catalogue.json",
         "All thirteen SafeMan tickets and seven Oryx Safety Academy levels, "
         "machine-readable, verbatim from the site's own data.",
         "application/json"),
        ("LICENSE.txt",
         "Creative Commons Attribution 4.0 International - the full legal code.",
         "text/plain"),
    ]
    manifest = {
        "manifest_version": 1,
        "generated": GENERATED,
        "publisher": "Oryx Institute",
        "course": {
            "code": "SM-CORE",
            "title": "SafeMan Core: Safety Management System",
            "suite": "SafeMan by Oryx",
        },
        "site": SITE,
        "source_code": {"repository": REPO_URL, "license": "MIT"},
        "license": {
            "code": "CC-BY-4.0",
            "name": "Creative Commons Attribution 4.0 International",
            "url": "https://creativecommons.org/licenses/by/4.0/",
            "file": "/materials/LICENSE.txt",
        },
        "attribution": "Oryx Institute (SafeMan by Oryx), safeman.oryxinstitute.org",
        "files": [],
        "agent_instructions": (
            "All files in this library are static and freely downloadable with no "
            "authentication. Fetch this manifest, then GET each file's path relative "
            "to the site root. Verify each download against the sha256 field. "
            "Materials are CC BY 4.0; site and engine source is MIT at "
            + REPO_URL + ". The live examination question bank is deliberately not "
            "published."
        ),
    }
    for name, desc, mime in files:
        p = OUT / name
        manifest["files"].append({
            "name": name,
            "path": f"/materials/{name}",
            "description": desc,
            "format": mime,
            "bytes": p.stat().st_size,
            "sha256": sha256(p),
            "license": "CC-BY-4.0",
            "language": "en",
        })
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    # 8. report ---------------------------------------------------------------
    print("\nMATERIALS LIBRARY")
    for name, _, _ in files:
        p = OUT / name
        print(f"  {name:36s} {p.stat().st_size / 1024:8.1f} KB  {sha256(p)[:16]}...")
    print(f"  {'manifest.json':36s} {(OUT / 'manifest.json').stat().st_size / 1024:8.1f} KB")
    print("OK")


if __name__ == "__main__":
    main()
