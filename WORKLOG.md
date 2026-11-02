# Oryx Ecosystem — Build Worklog

All work on 2–3 November 2026 (Africa/Windhoek context). Builder: build agent for
Tangi Iigonda, Oryx Institute / Oryx Polytechnic Institute. Method: template-first
(clones of Oryx_Build_Package_v3 only — nothing rebuilt from scratch), gauntlet-style
worker/evaluator loop with deterministic checks.

## Session start — intake
- `Oryx_Build_Package_v3.zip` (upload/) extracted: 16 Word templates, Radley + Inter
  fonts, brand marks, v6_pack imagery (safety/core), v3 addendum + SAFETY-COURSE-PLAN +
  CONTENT-CORRECTIONS read and honored (email-only contact, numbers in Inter, founder
  B&W rules, NTA status language, minimum-wage/maternity/leave corrections noted).
- Skills installed by git clone (npx skills add timed out ×2 — known sandbox limit):
  robonuggets/gauntlet-loop + cyog941/gauntlet-mini (read; execute mode with bounded
  cycles applied), google/elephant-goldfish-model (draft→review loop discipline reused
  from earlier clone).

## Track 1 — SafeMan green template pipeline (W1)
- `scripts/make_safeman_theme.py`: clones all 16 `templates/oryx_v3` docx into
  `templates/safeman_green/`. XML recolor map 71111F/6A1B29→14532D, D9CFC0→C6D8C8,
  B89B72→16A34A, F5EEE3/F5EFE6/F4EEE4→F0FDF4. Text: SAFEMAN wordmark on eyebrows,
  ORX→SM codes, P.O. Box stripped (email-only), footer domain swap with info@ protected.
- Media: transparent-alpha brand art hue-shifted maroon→forest green (S>0.30, hue
  320–360/0–25 → green 147°); full-page pattern art detected at >50% maroon coverage and
  shifted; photographs untouched per spec (only the left pattern band on photo covers).
- Fix cycle 1: photos were over-shifted → alpha/pattern-coverage guard added. Visual
  check confirmed natural photo + green band.
- Evaluator: rendered covers inspected; 16/16 templates carry zero maroon XML after
  transform (spot-checked Student Module: 116 color swaps).

## Track 2 — Asset pipeline (W1)
- `scripts/process_assets.py`: bottom-60px watermark crop, brand stamp at 45% opacity
  (`SAFEMAN // SAFEMAN.ORYXINSTITUTE.ORG` green / `ORYX INSTITUTE // ORYXINSTITUTE.ORG`
  maroon), dual export webp (<45KB, downscale retry) + 8-bit PNG (<90KB), 7 photo plates
  + 8 flat vector icons (extinguisher, harness, 4-gas, padlock, first aid, helmet, HIRA
  matrix, QR shield) + 3 green logo plates with SAFEMAN wordmark (Radley, tracked).
- Budget check: PASS (worst webp 42.9KB).

## Track 3 — Data layer (W1)
- `public/data/safeman_courses.json`: 13 courses (SM-INTRO, SM-CORE with 8 modules/40
  MCQs, SM-CPR, SM-FA1, SM-FIRE, SM-WAH, SM-CSE, SM-LOTO, SM-HIRA, SM-HCS, SM-MINE,
  SM-PETRO, SM-CONST), 37 modules with keypoints + nullable video_demo_url, 159 MCQs
  (all with explanations), 7 assessor practicum checklists, mandatory disclosure +
  serial/QR payload schema in system block.
- `public/data/oryx_nqf_levels.json`: NQF L1–7, NTA anchors per spec (1157; 935/LW02;
  846/847; 843/844/848–853/859/2061; 854–860/1929; GN 156 + NRPA Act 5 of 2005; EMA 7 of
  2007), status fields, manual/assessment-pack paths, pre-accreditation disclosure.

## Track 4 — Document generation (W1)
- `scripts/build_safeman_docs.py`: clones green Student Module; strip-sample-body →
  cover edit (XML-level, reaches text boxes) → page break → WELCOME + disclosure callout
  + modules + assessment + practicum table + full question bank with answer key.
  Fix cycles: sentinel order, text-box subtitle, 2-line cover titles (SHORT_TITLES map).
- `scripts/build_oryx_levels_4_7.py`: clones maroon Textbook; L4–7 manuals with authored
  module expansions (EXPANSION map), assessment frameworks, certification-type integrity
  line. Output: OSA-L{4..7}-LEARNER-MANUAL-V1.0-2026.(docx|pdf).
- Generated: 14 SafeMan PDFs (13 manuals + SAMPLE-CERTIFICATE) + 4 L4–7 manuals.
  Visual QA on SM-FIRE cover + inner pages: PASS.

## Track 5 — Web application (W2, full-stack agent)
- Next.js 16 App Router + Tailwind 4, static export (`out/`, trailingSlash), no DB,
  no API routes; localStorage state; client-side jsPDF + qrcode; Web Crypto HMAC.
- Routes: landing, /safeman (catalogue + disclosure), course readers ×13, seeded MCQ
  quizzes ×13, practicum sign-off (checklist + signature canvas), /safeman/issue (A4
  certificate + 2-sided 85.6×54mm PVC passport card + signed QR), /verify (stateless
  HMAC verification, valid/invalid panels), /oryx (NQF explorer + NTA matrix + manual
  downloads), /oryx/lab (4-gas simulator, TWA 8h/12h, noise dose 85dBA/3dB, WBGT table).
- Fonts local (next/font/local) Radley + Inter; numbers in Inter.
- Build evidence: 47/47 static pages, tsc clean. Visual QA screenshots: landing,
  /safeman, reader, /oryx, /verify valid + tampered — PASS. Founder label duplication
  fixed in data JSON; rebuilt clean.

## Evaluators (deterministic, gauntlet order)
1. JSON schema/consistency: 13 courses, quiz banks ≥ exam size, 4-option answers in
   range — PASS.
2. Theme XML audit: no maroon hex in safeman_green — PASS.
3. Asset budgets: webp ≤45KB / png ≤90KB — PASS.
4. `npm run build` static export — PASS (rerun after edits).
5. HMAC round-trip: signed payload → /verify VALID; tampered sig → INVALID — PASS.
6. Document visual render (cover/inner) — PASS after 2 fix cycles.

## Open items (flagged, not fabricated)
- BIPA registration number: publish within 14 days of certificate collection (per
  CONTENT-CORRECTIONS §2) — placeholder language used, none invented.
- First aid / fire practicum legal certification boundary: SafeMan issues competency-
  and-attendance records; statutory first-aid certification remains with partnered
  accredited providers (boundary stated in manuals/L2 materials).
- Video demos: all video_demo_url fields null with UI slots ready (record and drop in
  URLs without code changes).
- L1–3 instructor/assessment packs predate this session (V1.0-2026 built earlier);
  L4–7 assessment packs are referenced in data but generation of per-module papers for
  L4–7 remains a next-iteration item.
