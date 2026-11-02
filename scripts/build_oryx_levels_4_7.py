#!/usr/bin/env python3
"""
build_oryx_levels_4_7.py — Oryx Institute NQF Level 4–7 learner manuals.

Rule 1: cloned from the ORIGINAL maroon Oryx_Build_Package_v3 Textbook template
(templates/oryx_v3/01_Word_Templates/05_Textbook_Print.docx) and injected with the
Level 4–7 curriculum from public/data/oryx_nqf_levels.json, using the template's own
style vocabulary (OxEyebrow, Heading1, Heading2, OxBody, OxLead, OxList, OxTable,
OxSmall). Maroon track: #6A1B29 / cream — no recoloring of content, template geometry
untouched. Contact lines normalized to email-only per the build brief.

Usage:  python3 scripts/build_oryx_levels_4_7.py
Output: public/manuals/oryx/OSA-L{4..7}-LEARNER-MANUAL-V1.0-2026.(docx|pdf)
"""
import os, sys, json, subprocess
from docx import Document
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TPL = os.path.join(ROOT, "templates", "oryx_v3", "01_Word_Templates", "05_Textbook_Print.docx")
DATA = os.path.join(ROOT, "public", "data", "oryx_nqf_levels.json")
OUT = os.path.join(ROOT, "public", "manuals", "oryx")
os.makedirs(OUT, exist_ok=True)

SAND = "D9CFC0"

# Short cover titles that fit the template's 2-line title frame
COVER_TITLES = {
    4: "National Vocational Certificate in OHS",
    5: "National Vocational Diploma in OHS",
    6: "OHS Instrumentation & A.I.A. Practicals",
    7: "Strategic EHS, Process Safety & ESG",
}

# Authored expansion per Level 4–7 module (kept here: single print source of truth)
EXPANSION = {
 "L4-M1": "The permit-to-work is the last administrative barrier before high-risk energy meets people. Learners draft and audit PTWs for confined space, hot work, heights and electrical isolation, then monitor field compliance against the written condition set, learning where permits decay and why conflict detection belongs in the system, not the supervisor's memory.",
 "L4-M2": "Supervising welfare means walking the workplace with a hygiene eye: workstation fit, manual handling reality, sanitation, drinking water, fatigue patterns and medical surveillance triggers. Learners build a supervision routine that captures early indicators before they become claims.",
 "L4-M3": "Competence is a managed asset. This module builds the skills matrix from statutory and business requirements, runs the training needs analysis, and maintains the appointment registers that Namibian enforcement expects to see current and signed.",
 "L4-M4": "Safety communication fails as broadcast; it works as loop. Learners design committee structures, alert systems and escalation paths, then measure culture with leading indicators rather than poster counts.",
 "L4-M5": "Interlocks and guarding only protect while they function. Learners install, inspect and test machine safety systems, document defeats as major non-conformances, and maintain the inspection regime that proves integrity over time.",
 "L4-M6": "Coordinating first aid and fire response means drills with timing objectives, equipment readiness checks, and a handover to emergency services that carries what burns, who is missing and what is isolated.",
 "L4-M7": "The hygiene inspection walk becomes a programme: survey scheduling, exposure records, and the PPE programme designed from hazard data with issue registers, fit records and retirement criteria that survive an audit.",
 "L4-M8": "The contractor gate decides site safety before the first shift. Learners compile and vet SHE packs, run mobilization gate checks, and schedule compliance inspections that catch drift early.",
 "L5-M1": "Designing an enterprise programme starts with context and leadership, moves through risk register architecture and objective setting, and lands as an implementation roadmap with owners, budgets and review points that top management signs.",
 "L5-M2": "Quantitative risk moves beyond the matrix: BowTie barrier modelling, FMEA scoring, HAZOP guide-word studies and the discipline of documenting assumptions so the numbers can be challenged.",
 "L5-M3": "Lead auditors design the audit programme by risk, brief auditors for independence, run evidence-based fieldwork and drive findings through corrective action to management review without losing objectivity.",
 "L5-M4": "Multi-agency response is negotiated in peacetime: scenario plans, mutual aid agreements, command board architecture, and joint exercises that test the seams between organizations.",
 "L5-M5": "Complex investigations demand ICAM leadership: evidence strategy, team management, organizational analysis and the Social Security Commission claims interface, ending in findings that change the system rather than the scapegoat.",
 "L5-M6": "Project HSE management on construction, civil and mining works means contractor ecosystems, interface risk and the paperwork spine \u2014 files, appointments, registers \u2014 kept alive across a moving site.",
 "L5-M7": "Administrative law is the SHEQ manager's arena: inspector powers, improvement and prohibition notices, appeal routes, and the corporate liability exposure that reaches the boardroom.",
 "L5-M8": "The capstone applies research methods to a live OHS problem: problem statement, literature, method, ethics, analysis and a defended recommendation that the host organization can implement.",
 "L6-M1": "Exposure math is the hygiene licence: 8-hour and 12-hour TWAs, STEL comparisons, mixture corrections, action levels and excursion limits calculated by hand and defended line by line.",
 "L6-M2": "Sensor telemetry starts at the physics: catalytic bead, infrared and PID sensing principles, calibration gas discipline, cross-sensitivity traps and the bump-test regime that keeps readings honest.",
 "L6-M3": "Gravimetric sampling runs on flow: cyclone selection, rotameter calibration, filter handling and the respirable crystalline silica and uranium dust analyses that Namibian mines require.",
 "L6-M4": "Noise work is dosimetry plus interpretation: full-shift dosimetry, octave-band analysis for engineering decisions, and the 85 dBA zoning that drives hearing conservation under GN 156.",
 "L6-M5": "Thermal and visual environments are measured, not guessed: WBGT arrays with work-rest regimes, anemometry for duct velocity, and lux grid surveys against task lighting requirements.",
 "L6-M6": "Vibration assessment combines accelerometry with biomechanics: whole-body and hand-arm exposure points, tool selection, and the ergonomic reasoning that turns data into work redesign.",
 "L6-M7": "Radiation telemetry under the NRPA: Geiger-M\u00fcller survey practice, TLD dosimetry programmes, NORM management in mining streams, and IoT proximity detection as an engineering control layer.",
 "L6-M8": "The A.I.A. capstone is metrology governance: calibration chain of custody, fault-finding on poisoned sensors, and authoring a statutory-style survey report that a client and an inspector can both rely on.",
 "L7-M1": "Namibian EIA practice under the Environmental Management Act: screening, scoping, ESIA authorship, EMP commitments and the audit trail MEFT expects when conditions are checked.",
 "L7-M2": "Process safety at board level: MHI regimes, PSM element maturity, and the specific risk profiles of green hydrogen and oil & gas assets entering the Namibian economy.",
 "L7-M3": "Epidemiology and toxicology governance: cohort interpretation, dose-response reasoning and the ethics of biological monitoring programmes in the workplace.",
 "L7-M4": "Integrated SHEQ systems collapse three standards into one audit: combined clause mapping, integrated documentation architecture and lead-audit practice across ISO 45001, 14001 and 9001.",
 "L7-M5": "Sustainability disclosure is becoming assurance work: GRI structure, ESG metrics that survive scrutiny, and climate resilience risk woven into enterprise risk management.",
 "L7-M6": "Human factors close the gap between procedure and practice: safety psychology, human factors engineering in design, and fatigue telemetry feeding roster decisions.",
 "L7-M7": "Risk economics makes the case in money: cost-benefit analysis, ALARP arguments, insurance underwriting interfaces and the language that moves boards.",
 "L7-M8": "The dissertation or turnaround strategy is the exit evidence: applied research or a supervised organizational transformation, defended before a panel of practitioners."
}

from docx.enum.text import WD_BREAK

def set_para_text(p, text):
    runs = p.runs
    if not runs:
        p.add_run(text); return
    runs[0].text = text
    for r in runs[1:]:
        r.text = ""

def clear_after_cover(doc, sentinel="WINDHOEK"):
    body = doc.element.body
    children = list(body)
    last_keep = None
    for ch in children:
        texts = "".join(t.text or "" for t in ch.iter(qn("w:t")))
        last_keep = ch
        if sentinel in texts.upper() or "info@oryxinstitute.org" in texts:
            break
    if last_keep is not None:
        idx = children.index(last_keep)
        for ch in children[idx + 1:]:
            if ch.tag == qn("w:sectPr"):
                continue
            body.remove(ch)

def page_break(doc):
    p = doc.add_paragraph()
    p.add_run().add_break(WD_BREAK.PAGE)
    return p

def P(doc, text, style): return doc.add_paragraph(text, style=style)
def H1(doc, t): return P(doc, t, "Heading1")
def H2(doc, t): return P(doc, t, "Heading2")
def BODY(doc, t): return P(doc, t, "OxBody")

def set_cell_borders(cell, color=SAND):
    tcPr = cell._tc.get_or_add_tcPr()
    borders = OxmlElement("w:tcBorders")
    for edge in ("top", "left", "bottom", "right"):
        el = OxmlElement(f"w:{edge}")
        el.set(qn("w:val"), "single"); el.set(qn("w:sz"), "4"); el.set(qn("w:color"), color)
        borders.append(el)
    tcPr.append(borders)

def TABLE(doc, headers, rows):
    t = doc.add_table(rows=1, cols=len(headers))
    for i, h in enumerate(headers):
        c = t.rows[0].cells[i]; c.text = ""
        p = c.paragraphs[0]; p.style = doc.styles["OxTableHead"]; p.add_run(h)
        set_cell_borders(c)
    for row in rows:
        cells = t.add_row().cells
        for i, v in enumerate(row):
            c = cells[i]; c.text = ""
            p = c.paragraphs[0]; p.style = doc.styles["OxTable"]; p.add_run(str(v))
            set_cell_borders(c)
    return t

def to_pdf(docx_path):
    subprocess.run(["soffice", "--headless", "--convert-to", "pdf", "--outdir",
                    os.path.dirname(docx_path), docx_path], check=True, capture_output=True, timeout=180)

def build_level(lvl):
    doc = Document(TPL)
    # Strip template sample body FIRST (original sentinel = the press line, para 5).
    clear_after_cover(doc, sentinel="WINDHOEK")
    # Cover
    for p in doc.paragraphs[:8]:
        t = p.text.strip()
        if t.startswith("SAFEMAN \u00b7 TEXTBOOK"):
            set_para_text(p, f"ORYX INSTITUTE \u00b7 NQF LEVEL {lvl['level']}")
        elif t == "Foundations of Applied Measurement":
            set_para_text(p, COVER_TITLES.get(lvl["level"], lvl["title"]))
        elif t.startswith("A practical course"):
            set_para_text(p, f"{lvl['duration']} \u00b7 {lvl['credits']} credits \u00b7 Entry: {lvl['entry']}")
        elif "Faculty of Applied Engineering" in t:
            set_para_text(p, "Oryx Institute \u00b7 Windhoek, Namibia \u00b7 info@oryxinstitute.org")
        elif "Institute Press" in t:
            set_para_text(p, "Oryx Institute \u00b7 Windhoek, Namibia")
    page_break(doc)

    P(doc, f"NQF LEVEL {lvl['level']}", "OxEyebrow")
    H1(doc, lvl["title"])
    BODY(doc, f"Anchors: {'; '.join(lvl['nta_anchors'])}.")
    BODY(doc, "Formal vocational delivery and pre-accreditation submission: programmes commence only after NTA "
              "provider registration has been granted; NQA accreditation is pursued in parallel and will be announced "
              "on the public register. This pack is a pre-accreditation curriculum draft built on the Oryx template system.")
    P(doc, "Author: Tangi Iigonda \u00b7 Institution: Oryx Institute | Oryx Safety Academy", "OxSmall")
    P(doc, "Contact: info@oryxinstitute.org", "OxSmall")

    H2(doc, "Programme outcomes")
    BODY(doc, "On completion of this level the learner can plan, execute and supervise the module outcomes below "
              "under normal workplace supervision, and produce the associated records to audit standard.")

    P(doc, "MODULES", "OxEyebrow")
    for m in lvl["modules"]:
        H2(doc, m["title"])
        P(doc, f"NTA reference: {m['nta_ref']}", "OxSmall")
        BODY(doc, m["focus"])
        if m["id"] in EXPANSION:
            BODY(doc, EXPANSION[m["id"]])
        P(doc, "Practical video recording scheduled \u2014 the online reader reserves a demonstration slot for this module.",
          "OxCaption")

    P(doc, "ASSESSMENT", "OxEyebrow")
    H2(doc, "Assessment framework")
    BODY(doc, lvl["assessment"])
    TABLE(doc, ["Module", "Assessment evidence", "Weight"],
          [[m["id"], "Module paper + portfolio evidence", "Equal"] for m in lvl["modules"]])
    P(doc, "Certification: Attendance and Completion certificates are issued internally; Accredited certification "
           "follows only after NQA status is granted for this qualification.", "OxSmall")

    out = os.path.join(OUT, f"OSA-L{lvl['level']}-LEARNER-MANUAL-V1.0-2026.docx")
    doc.save(out)
    return out

def main():
    data = json.load(open(DATA))
    for lvl in data["levels"]:
        if lvl["level"] < 4:
            continue
        p = build_level(lvl)
        print("  manual", os.path.basename(p))
        to_pdf(p)
        print("  pdf    ", os.path.basename(p).replace(".docx", ".pdf"))
    print("Done: Oryx NQF L4\u20137 manuals in public/manuals/oryx/")

if __name__ == "__main__":
    main()
