# WORKLOG — oryx-safeman-ecosystem v3.0.0 (2026-11)

## Session: MASTER UPGRADE BRIEF execution (complete)

Sandbox was recycled between sessions; the repo was rebuilt from source materials
(Oryx_Build_Package_v3, OSA LMS package, brand fonts) with all five brief parts
implemented natively.

### Delivered

1. **TANGISON UI** — 60-30-10 tokens in `app/globals.css`; sticky header with
   segmented Academy/SafeMan pill (localStorage-persisted, single accent swap);
   image-led course cards (7 + 13); disclosure blocks with contractual SafeMan
   wording; mailto enrollment drawer + access-code portal.
2. **Signature pipeline** — `scripts/process_signature.py`: flat-field removal of
   ruled-paper background, adaptive ink mask, #181514 RGBA, getbbox crop, 240px
   normalise, PNG+WebP export; deterministic vector-ink "T. Iigonda" fallback
   (779×240px, 69 KB PNG) active until a real scan lands in
   `assets/raw_signature.jpg`.
3. **Certificates** — `lib/pdf-certificate.ts`: A4 landscape, outer 2.5pt accent
   frame + inner 0.75pt hairline, three-column footer (signature | serial+ID+date
   | QR), live issue date; PVC pass 85.6×54mm front/back (headband, badge, mini
   signature; QR + verify URL + if-found email). QR decodes to
   `safeman.oryxinstitute.org/verify?d=...&sig=...`; HMAC-SHA256 round-trip
   validated in Node against the deployed key.
4. **Asset engine** — `scripts/generate_bulk_assets.py`: 20 procedural SVG plates
   (bowtie, 4-gas stratification, PASS, 5-point harness, LOTO, 5×5 HIRA, dust
   sampler, noise contours, PTW, ICAM, waste streams, ...), all within
   webp<45KB / png<90KB; external cleaner (bottom-64px watermark crop, paper
   knockout, SAFEMAN // ORYXINSTITUTE.ORG stamp) ready for `assets/raw_plates/`.
5. **Quality gate** — `scripts/qa_audit.py` prints CLEAN: no Appointment-Pending
   placeholders, no P.O. Box / phone numbers, no `Principal and Founder` variant,
   no shadows/gradients, dates pinned to 2026-11 with client-side dynamic dates
   exempt, asset budgets enforced.
6. **Content** — 20 courses, 156 exam questions (30 authentic from the OSA LMS
   package), 6 practicum checklists, 4-gas simulator attached to SM-CSE + Level 6.

### Verification

- `npm run build` → 4 static routes, 0 errors, `out/` 6.2 MB
- Playwright e2e: dual-brand switch (accent 6A1B29 → 14532D), 7/13 card counts,
  drawer field binding, portal login (SM-CSE), simulator alarm, timed exam,
  verify-page rejection — 0 console errors
- Cert pipeline: exam pass → certificate PDF + PVC PDF downloads; QR payload +
  HMAC re-verified in Node (`HMAC VALID: true`)

### Known limits

- filebin.net upload blocked from this environment (IP ban from previous
  session) — packages delivered in `download/`:
  `oryx-safeman-ecosystem_v3.zip` (source, 4.2 MB) and
  `oryx-safeman-ecosystem_v3_out.zip` (deployable static export, 3.3 MB)
- Academy certificates use the shared engine; Word/PDF doc builders for the
  OSA L1-L3 print suite remain in the earlier
  `Oryx_Safety_Academy_Complete_V1.0-2026.zip` deliverable

## Session: SM-CORE course landing page (taste-skill build, 2026-11-06)

Built `landing/index.html` with the leonxlnx/taste-skill `design-taste-frontend` 2.5.0 system
(skill installed via `npx skills add`; its deal scripts dealt nav/footer/close/rhythm/buttons/mark,
`start.mjs brand` carried the client's own palette, `source-serif` pairing, sharp radius).

- Kind: **service** (safety-training provider, site-kind other: flat colour, type, the client's own
  brand-stamped plates, the hover layer; no effects/scenes/moments). Copy from brief facts only:
  SM-CORE (5-day equivalent, 40 notional hrs, ISO 45001/14001/31000, NTA Ref 846-858, 4 modules,
  timed exam 8Q/10min/pass 7-8), the 13-ticket model in four families, delivery modes, the
  contractual disclosure, Tangi Iigonda. Main action: Request Enrollment (mailto).
- Visuals: 10 of the repo's own plates (hero BowTie, PTW register, CPR/HIRA-era family plates,
  verification QR) - no stock, no library photos, no third-party assets.
- Checker evidence: consistency.mjs 0 FAIL at 1024x768 and 390x844 (full run), 0/0 at 820 in the
  quick pass; check.mjs "no findings" at 1440/1024/768/390; page weight 748 KB vs 2400 KiB budget.
  Judged finding at 768/820 (hero-gap uniformity) documented in the page comment. perf.mjs and the
  1440 consistency pass exceed the sandbox time budget (software rendering) - reported as not
  checked here.
- Delivered: download/safeman_core_landing.zip (self-contained static page).

## Session: everything-on-the-page + open-source materials + push (2026-11-08)

Continued the taste-skill build (skill refreshed to 2.5.1; vendored kit under
public/sm-core/assets/ updated 2.5.0 -> 2.5.1, whose phone min-height section fix
is what the 320 walk now requires). The SM-CORE course site moved from landing/
into the Next.js export as /sm-core/ so one deploy carries the course page, the
materials library, the portal and verification.

### Delivered

1. **Everything on the page** - nav (5 words), hero (materials secondary action),
   #modules, NEW #pathway (steps: the three-step engagement chain, panels carry
   two new brand-stamped plates from scripts/generate_pathway_plates.py plus a
   render of the real certificate engine output), #faq (five buyer questions,
   live /verify/ link), NEW #materials (the open-materials library: 7 files with
   real sizes, direct download paths, the manifest for agents), #families,
   close + footer (Materials column, GitHub source, licence line, phone
   two-column links). Fixed a latent bug from the original build: the #close
   CSS selector never matched (the close div carries no id).
2. **Open-source materials** - scripts/generate_course_materials.py renders the
   SM-CORE Course Handbook (HTML source in scripts/materials-src/, PDF via the
   pdf skill's html2pdf-next.js, 9 pages) plus handbook/exam-blueprint/
   service-model markdown, the verbatim course catalogue JSON, the CC BY 4.0
   legal code and manifest.json with sha256 per file. Repo root gains LICENSE
   (MIT) and README.md; public/llms.txt + robots.txt make the site agent-readable.
3. **App integration** - the homepage SM-CORE card title and the footer link the
   course site; scripts/verify_materials.py verifies the whole download chain.

### Verification (design-taste-frontend 2.5.1)

- copy-lint: 0 FAIL, 0 WARN
- check.mjs: "no findings" at 1440x900, 1024x768, 820x1180, 768x1024, 390x844
- consistency (1024,390 one run): 390 pass clean of unwaived FAILs (4 WARN
  kinds kept and documented); 1024 carries two waived findings (.taste-skill/
  waivers.json: the kit's own two-up + odd-card-across steps rule, cited from
  system.css and the steps recipe); the 320 walk clean
- gate: "no FAIL in what ran", GATE: ERROR (its 1440 consistency pass exceeds
  this sandbox's software-rendering budget; direct measurement verifies every
  section exactly one or two screens at 1024 and 390 instead)
- ecosystem e2e: PASSED, 0 console errors (dual-brand switch, cards, drawer,
  portal, simulator, timed exam, verify rejection)
- materials: verify_materials.py PASSED - every manifest sha256 verified over
  HTTP, all page links land, llms.txt/robots.txt served
- VLM visual pass on the hero, pathway and materials sections; handbook pages
  checked page by page (trailing blank <= 27%, pdf_qa PASS, cover validated in
  isolation)
- No SafeMan origin-site photographs: the only live safeman domains belong to
  unrelated companies (Safeman Australia PPE; Safetyman Academy), so none of
  their material may stand in for this client; the client's own brand-stamped
  plates carry every visual

### Known limits

- The 1440-width consistency pass and the gate's embedded consistency cannot
  complete inside this sandbox (software rendering); documented per the skill's
  GATE: ERROR provision
- The page carries no dealt moment (the original 2.5.0 deal had none for kind
  other); under 2.5.1's rules this is an open item, kept and documented rather
  than padded

## Session: photo-chapters moment + perf + full checker closure (2026-11-08)

Continued from the v4 push. Closed the two open items the previous session documented:
the missing dealt moment and the never-completed perf/1440 runs (this sandbox's Chrome
runs them; CHROME_PATH points at the puppeteer-downloaded Chrome).

### Delivered

1. **The dealt moment** - `moments.mjs pick --page service --count 1 --fits
   section,statement --photo --history .taste-skill/history.json` dealt **photo-chapters**
   (seed eac10a2e). New `#hazards` section between #modules and #pathway: three chapters
   of practicum craft (the gas vessel / the 5x5 matrix / the first-aid kit - SM-CSE,
   SM-HIRA, SM-FA1), each with its own plate, none used elsewhere on the page. The kit's
   moments loader is vendored at `public/sm-core/assets/moments/` (moments.js, lib.js,
   photo-chapters); system.js imports it when [data-moment] exists. Page CSS letterboxes
   the plates whole on their paper field, live and at rest - a diagram is never cropped.
2. **Rhythm fixes the new checker runs exposed** (the 1440 pass and perf.mjs had never
   completed in this sandbox before): both list sections' plates letterbox to a capped
   540px at 1280+ so the sections fit their screens; #faq's five answers breathe at 1280+
   (40px rows) so the FAQ fills its screen; #materials stacks under its rows at 1024-1279
   (30px rows, 380px cover) and the cover runs 450px on the phone, so the two-screen
   blocks fill their height; headings renamed to name the thing ("The hazards the SafeMan
   tickets train for", "The SafeMan materials library"); a stray em dash fixed.
3. **perf.mjs PASS** - `-700.webp` variants for all thirteen plates (scripts/
   make_700_variants.py), a 120px QR variant, `loading="lazy"` below the fold and
   srcset/sizes on every image; the handbook cover and certificate imgs now carry their
   true intrinsic sizes.
4. **Waivers** (`.taste-skill/waivers.json`): the steps recipe's own two-up +
   odd-card-across layout (row-gap) and the card--row text line (container-edges), cited
   from system.css, the steps recipe and cards.md.

### Verification (all fresh, against out/ with --root out)

- copy-lint: 0 FAIL, 0 WARN
- moments.mjs check: ok (1 moment, WebGL 0 of 4)
- check.mjs: "no findings" at 1440x900, 1024x768, 820x1180, 768x1024, 390x844
- consistency quick 1440+390: 0 FAIL; full 1024+390: only the two waived kit-rule findings
- **gate: GATE: PASS** (first PASS on this build; runs checker 1440+390, the 320 walk and copy-lint)
- **perf.mjs: PASS, 0 FAIL 0 WARN** (first completed run on this build)
- materials: scripts/verify_materials.py PASSED over HTTP
- visual pass on the shots: hero, pathway cards, the live photo-chapters stage with its
  chapter panel, and the materials rows all read as designed

### Known limits

- consistency at 1024 keeps the two documented waivers (the kit's own steps layout).
- The WARN kinds kept on purpose: the moment's own scroll-reveal + pinned inside
  [data-moment] (expected), cta on informational sections, nav-current, action-repeat
  (nav + hero share the one action), no-visual on a two-screen phone window share,
  empty-area under the footer's second phone screen.
