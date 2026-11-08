# The SafeMan Service Model

**Suite:** SafeMan by Oryx · Oryx Institute
**Edition:** 1.0 · November 2026
**Licence:** Creative Commons Attribution 4.0 International (CC BY 4.0)
**Source:** https://github.com/tangison/oryx-safeman-ecosystem

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
  is open source under the MIT licence at https://github.com/tangison/oryx-safeman-ecosystem.
- **A machine-readable manifest** (`manifest.json`) lists every materials file with its
  size and SHA-256 checksum, so the whole library can be fetched and verified in one
  pass.

The live examination question bank is the one deliberate exception: it stays
unpublished so the credential keeps its value.

## 7. Contact

Enrollment requests and registrar questions: **info@oryxinstitute.org**.
Credential verification: **safeman.oryxinstitute.org/verify**.
