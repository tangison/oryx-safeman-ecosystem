# Oryx Ecosystem — Oryx Institute × SafeMan™

One repository, two brand tracks, one $0 stack (GitHub + Vercel free tier, static export, no database).

| Track | Theme | Route | Content |
|---|---|---|---|
| **Oryx Institute** (NQA/NTA pre-accreditation) | Maroon `#6A1B29` | `/oryx` | NQF Levels 1–7 curriculum explorer, NTA alignment matrix, Level 6 Virtual Sensor & A.I.A. Hygiene Lab, manual downloads |
| **SafeMan™** (proprietary corporate benchmark) | Forest Green `#14532D` | `/safeman` | 13-course LMS: readers, auto-graded MCQs, assessor practicum sign-off, instant QR-verified certificates + PVC Site Passport cards |
| **Public verifier** | — | `/verify` | Stateless HMAC-SHA256 QR verification — works forever, zero database |

## Quick start

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static export -> out/
```

Deploy: import the repo into Vercel (framework preset: Next.js). Set optional env vars from `.env.example`:

- `NEXT_PUBLIC_SAFEMAN_QR_SECRET` — HMAC secret for certificate QR signing (falls back to a dev secret)
- `NEXT_PUBLIC_WEBHOOK_URL` — optional fire-and-forget registry sync (Supabase / Google Sheets webhook)

## Repository layout

```
templates/oryx_v3/        Original Oryx_Build_Package_v3 Word templates + fonts + brand marks (master geometry)
templates/safeman_green/  Auto-generated SafeMan green clones (#14532D / #C6D8C8 / #F0FDF4) — never edited by hand
scripts/make_safeman_theme.py   Clones oryx_v3 -> safeman_green (XML recolor + media hue-shift + email-only contact)
scripts/process_assets.py       Watermark-crop, brand stamp, dual export (webp <45KB / png <90KB) + flat icons + green logos
scripts/build_safeman_docs.py   Clones green Student Module template -> 13 SafeMan learner manuals + sample certificate
scripts/build_oryx_levels_4_7.py Clones maroon Textbook template -> NQF L4–7 learner manuals
public/data/safeman_courses.json   13 courses, 37 modules, 159 MCQs with explanations, 7 practicum checklists
public/data/oryx_nqf_levels.json   NQF Levels 1–7 with NTA unit-standard anchors
public/assets/webp|png|logos       Processed brand assets (stamped, dual-format)
public/manuals/safeman/*.pdf|docx  Print-ready SafeMan manuals
public/manuals/oryx/*.pdf          L1–7 manuals (L1–3 built & verified; L4–7 pre-accreditation drafts)
src/                       Next.js 16 App Router app (static export, localStorage state, client-side PDF/QR)
```

## Integrity notes

- SafeMan is disclosed on every page, manual and certificate as a **proprietary, non-NQA
  credit-bearing** benchmark, pre-referenced against ISO 45001:2018, ISO 14001:2015, ISO 31000,
  NTA Unit Standards and GN 156 of 1997.
- Oryx NQF track discloses its pre-accreditation status verbatim (NTA provider registration pending;
  NQA accreditation pursued in parallel).
- Certificates are issued as Attendance / Completion types only; "Accredited" is reserved for
  post-NQA status.
- Contact standard everywhere: **info@oryxinstitute.org** only — no phone, no P.O. Box, no copyright lines.
- Author of record: **Tangi Iigonda · Oryx Institute | Oryx Safety Academy**.

Regulatory anchors referenced (not legal advice; verify with the Ministry of Labour and NTA before
commercial delivery): Labour Act 11 of 2007; GN 156 of 1997; NTA Unit Standard IDs
843/844/846–860/935/1157/1763/1929/2061; Fire Brigade Services Act 5 of 2006 (local authority);
Atomic Energy and Radiation Protection Act 5 of 2005; Environmental Management Act 7 of 2007.

See `WORKLOG.md` for the build log and `AGENT-NOTES.md` for the web build evidence.
