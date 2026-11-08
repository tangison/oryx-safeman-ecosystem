# oryx-safeman-ecosystem

**Oryx Institute × SafeMan™ by Oryx** — the open-source safety-education ecosystem for Namibian industry. Dual-brand, static-export, zero-cost stack: no backend, no database, no paid service.

- **Oryx Safety Academy** (maroon `#6A1B29`) — the NQF Levels 1–7 vocational spine, pre-referenced to NTA Unit Standards and Namibian GN 156 of 1997.
- **SafeMan™ by Oryx** (forest green `#14532D`) — the SAMTRAC-style corporate B2B suite: SM-CORE plus twelve specialist practicum and management-systems tickets.

## What ships in here

| Route | What it is |
| --- | --- |
| `/` | Dual-brand catalogue home (20 courses, enrollment drawer, statutory disclosures) |
| `/sm-core/` | **The SafeMan Core course site** — the flagship ticket's full page: modules, pathway, FAQ, the thirteen-ticket catalogue, and the open-materials library |
| `/portal/` | Access-code student portal: module material, timed examinations (8 questions / 10 minutes / pass 7 of 8), certificate + PVC-pass download |
| `/verify/` | Public HMAC-SHA256 credential verification (QR payload + signature) |
| `/materials/` | The open-source course-materials library, with a machine-readable `manifest.json` (paths, sizes, SHA-256) |
| `/llms.txt`, `/robots.txt` | Agent-friendly site index and crawl rules |

## Quickstart

```bash
npm install
npm run build        # static export -> out/  (serve out/ from any static host)
npm run dev          # local development
```

Python asset and QA pipelines (optional, for regenerating artwork and checks):

```bash
pip install cairosvg pillow
python3 scripts/generate_bulk_assets.py        # 20 procedural teaching plates (SVG -> webp/png)
python3 scripts/generate_pathway_plates.py     # course-page pathway plates + certificate render
python3 scripts/generate_course_materials.py   # materials library + handbook PDF + manifest
python3 scripts/build_site_data.py             # data_src/*.json -> public/data/*.json
python3 scripts/qa_audit.py                    # content QA gate
python3 scripts/e2e_test.py                    # Playwright e2e (serves out/ on :4173)
```

## How verification works

Every certificate and PVC pass carries a QR that encodes a base64url payload (serial, learner, course, issue date, track) plus an HMAC-SHA256 signature (`lib/verify.ts`). The public `/verify/` page recomputes the signature and states whether the document was issued by Oryx Institute — no account, no database, arithmetic-level trust.

> The default verification key in `lib/verify.ts` is a **demo key**, kept in-repo so the static build works with zero configuration. For production, set `NEXT_PUBLIC_VERIFY_HMAC_KEY` at build time and keep it out of any public repository.

## Licensing

- **Course materials** (`public/materials/`) — [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/). Copy, print, adapt, even commercially, with attribution: *"Oryx Institute (SafeMan by Oryx), safeman.oryxinstitute.org, CC BY 4.0."*
- **Site and engine code** — MIT (see `LICENSE`).
- **The live examination question bank** is deliberately not published.

## Repository map

```
app/                     Next.js 14 App Router (/, /portal/, /verify/) - static export
components/              SiteHeader, EnrollDrawer, ExamRunner, GasSimulator, ...
lib/                     verify.ts (HMAC), pdf-certificate.ts (jsPDF cert + PVC)
public/sm-core/          the SafeMan Core course site (self-contained static page)
public/materials/        the open-source materials library + manifest.json
public/assets/           brand artwork: 20+ teaching plates, signatures
scripts/                 asset engines, materials pipeline, QA and e2e scripts
scripts/materials-src/   handbook HTML source (renders to the materials PDF)
data_src/                course content sources (safeman_content.json, ...)
shots/                   visual QA screenshots
```

## Credits

Oryx Institute — Tangi Iigonda, Principal & Founder (info@oryxinstitute.org).
SafeMan™ by Oryx is an inter-organizational industry safety benchmark aligned with ISO 45001:2018, ISO 14001:2015 and ISO 31000, pre-referenced to NTA Unit Standards 846–858 and Namibian GN 156 of 1997; it is not an NQA-accredited qualification. SAMTRAC is a trademark of NOSA (Pty) Ltd.
Course-site design built with the [taste-skill](https://github.com/leonxlnx/taste-skill) design system (self-hosted kit under `public/sm-core/assets/`).
