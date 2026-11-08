#!/usr/bin/env python3
"""Build static site data for the oryx-safeman-ecosystem web app.

Ingests:
  1. The OSA LMS package (levels L1-L3: lessons + quizzes)  -> portal reader + exam banks
  2. data_src/safeman_content.json (13 SM-* courses)        -> SafeMan catalogue + exams + practicums
  3. data_src/academy_l4_7_content.json (Levels 4-7)        -> Academy L4-L7 catalogue + exams

Emits:
  public/data/courses.json  - dual-brand catalogue (cards, filters, enrolment)
  public/data/portal.json   - portal reader: modules, exam banks, practicum checklists, simulator hooks
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LMS = Path("/home/z/my-project/oryx-safety-academy/lms/OSA-LMS-PACKAGE-V1.0-2026")
OUT = ROOT / "public" / "data"
OUT.mkdir(parents=True, exist_ok=True)

# --------------------------------------------------------------------------
# Academy catalogue for L1-L3 (mirrors the approved single-file reference DATA)
# --------------------------------------------------------------------------
ACADEMY_L1_3 = [
    {
        "code": "ACADEMY LEVEL 1", "level": "NQF L1", "duration": "6 Units",
        "notional": "70 Notional Hrs", "tier": "Foundation",
        "title": "Foundation Workplace Health & Safety",
        "desc": "Workplace hazard identification, safety signs, PPE hierarchies, emergency roll-call, and worker rights & duties under the Namibian Labour Act 11 of 2007.",
        "standards": "Aligned: NTA Unit Std 1157 (7 Credits) | Labour Act s. 39",
        "category": "Foundation (L1-L3)", "plate": "academy_l1_foundation",
    },
    {
        "code": "ACADEMY LEVEL 2", "level": "NQF L2", "duration": "10 Units",
        "notional": "100 Notional Hrs", "tier": "Foundation",
        "title": "Workplace SHE Representative & Risk Control",
        "desc": "Statutory SHE Representative inspections, incident recording, toolbox talk facilitation, fire prevention, and task risk matrices.",
        "standards": "Aligned: NTA IDs 935 & LW02 | Labour Act s. 43-44",
        "category": "Foundation (L1-L3)", "plate": "academy_l2_rep",
    },
    {
        "code": "ACADEMY LEVEL 3", "level": "NQF L3", "duration": "8 Modules",
        "notional": "120 Notional Hrs", "tier": "Foundation",
        "title": "Supervisory OHS & Environmental Responsibility",
        "desc": "Frontline supervisory safety leadership, contractor control, permit-to-work execution, environmental waste control, and root-cause investigation.",
        "standards": "Aligned: NTA Unit Stds 846 & 847 | GN 156 of 1997",
        "category": "Foundation (L1-L3)", "plate": "academy_l3_supervisor",
    },
]


def parse_lesson(md_text: str):
    """Split a lesson markdown file into (intro, sections[]) with points."""
    text = md_text.strip()
    # Drop the H1 title line
    lines = text.split("\n")
    body_lines, title = [], ""
    for i, ln in enumerate(lines):
        m = re.match(r"^#\s+(.+)$", ln)
        if m and not title:
            title = m.group(1).strip()
            continue
        body_lines.append(ln)
    body = "\n".join(body_lines)

    # Capture "## section" blocks
    sections = []
    cur = None
    for ln in body.split("\n"):
        m = re.match(r"^##\s+(.+)$", ln)
        if m:
            if cur:
                sections.append(cur)
            cur = {"h": m.group(1).strip(), "paras": []}
        elif cur is not None:
            cur["paras"].append(ln)
    if cur:
        sections.append(cur)

    # Compress each section: 2-3 sentences of prose + bullet points
    out_sections = []
    for sec in sections:
        raw = "\n".join(sec["paras"]).strip()
        if not raw:
            continue
        paras = [p.strip() for p in re.split(r"\n\s*\n", raw) if p.strip()]
        bullets = []
        prose = []
        for p in paras:
            if p.startswith(("-", "*")):
                items = [x.strip(" -*") for x in p.split("\n") if x.strip(" -*")]
                bullets.extend(items[:8])
            elif p.startswith("|"):
                rows = [r for r in p.split("\n") if r.strip() and not re.match(r"^\|[\s:-]+\|$", r.strip())]
                cells = []
                for r in rows[:10]:
                    parts = [c.strip() for c in r.strip("|").split("|")]
                    cells.append(" — ".join(parts))
                bullets.extend(cells)
            elif re.match(r"^\d+\.\s", p):
                items = [re.sub(r"^\d+\.\s*", "", x).strip() for x in p.split("\n") if x.strip()]
                bullets.extend(items[:8])
            else:
                clean = re.sub(r"\s+", " ", p)
                if len(clean) > 24:
                    prose.append(clean)
        summary = " ".join(prose)
        # keep summaries tight for the portal reader
        if len(summary) > 520:
            summary = summary[:517].rsplit(" ", 1)[0] + "..."
        out_sections.append({"h": sec["h"], "summary": summary, "points": bullets})
    return title, out_sections


def load_lms_level(level_dir: Path, level_code: str):
    mods, mcq_bank = [], []
    modules_root = level_dir / "modules" if (level_dir / "modules").is_dir() else level_dir
    for mod_dir in sorted(p for p in modules_root.iterdir() if p.is_dir()):
        qf, lf = mod_dir / "quiz.json", mod_dir / "lesson.md"
        if not (qf.exists() and lf.exists()):
            continue
        quiz = json.loads(qf.read_text(encoding="utf-8"))
        title, sections = parse_lesson(lf.read_text(encoding="utf-8"))
        mods.append({
            "id": mod_dir.name.replace("M0", "M"),
            "title": title or quiz["title"],
            "summary": sections[0]["summary"] if sections else quiz["title"],
            "points": [p for s in sections for p in s["points"]][:8],
        })
        for q in quiz["questions"]:
            if q["type"] == "multiple-choice":
                mcq_bank.append({"q": q["question"], "options": q["options"], "a": q["options"].index(q["correct"])})
    return mods, mcq_bank


def main():
    # ---------------- Academy ----------------
    academy_levels = []
    level_meta = [
        ("L1", ACADEMY_L1_3[0], "academy_l1_foundation"),
        ("L2", ACADEMY_L1_3[1], "academy_l2_rep"),
        ("L3", ACADEMY_L1_3[2], "academy_l3_supervisor"),
    ]
    for lv, cat, plate in level_meta:
        mods, bank = load_lms_level(LMS / "levels" / lv, lv)
        academy_levels.append({"cat": cat, "plate": plate, "modules": mods, "bank": bank})

    l47 = json.loads((ROOT / "data_src" / "academy_l4_7_content.json").read_text(encoding="utf-8"))
    for c in l47["courses"]:
        academy_levels.append({
            "cat": c, "plate": c["plate"], "modules": c["modules"],
            "bank": [{"q": q["q"], "options": q["options"], "a": q["a"], "why": q["why"]} for q in c["quiz"]],
        })

    academy_courses = []
    portal_academy = []
    for entry in academy_levels:
        cat, plate, mods, bank = entry["cat"], entry["plate"], entry["modules"], entry["bank"]
        course = {
            "code": cat["code"], "level": cat.get("level", ""), "duration": cat["duration"],
            "notional": cat.get("notional", ""), "tier": cat.get("tier", ""),
            "title": cat["title"], "desc": cat["desc"], "standards": cat["standards"],
            "category": cat["category"], "plate": plate, "brand": "academy",
        }
        academy_courses.append(course)
        portal_academy.append({
            "code": cat["code"], "title": cat["title"], "plate": plate, "modules": mods,
            "bank": bank, "examMinutes": 12, "practicum": None, "simulator": "gas4" if cat["code"] == "ACADEMY LEVEL 6" else None,
        })

    # ---------------- SafeMan ----------------
    sm = json.loads((ROOT / "data_src" / "safeman_content.json").read_text(encoding="utf-8"))
    safeman_courses, portal_safeman = [], []
    for c in sm["courses"]:
        safeman_courses.append({
            "code": c["code"], "flag": c["flag"], "duration": c["duration"],
            "notional": c["notional"], "title": c["title"], "desc": c["desc"],
            "standards": c["standards"], "category": c["category"],
            "plate": c["plate"], "brand": "safeman",
        })
        portal_safeman.append({
            "code": c["code"], "title": c["title"], "plate": c["plate"], "modules": c["modules"],
            "bank": [{"q": q["q"], "options": q["options"], "a": q["a"], "why": q["why"]} for q in c["quiz"]],
            "examMinutes": 10, "practicum": c.get("practicum"), "simulator": c.get("simulator"),
        })

    # ---------------- Emit ----------------
    courses_doc = {
        "generated": "2026-11",
        "academy": {
            "brandMark": "O", "brandTitle": "ORYX SAFETY ACADEMY",
            "brandSub": "NQF Levels 1-7 Vocational Spine • oryxinstitute.org",
            "eyebrow": "PRIMARY PRODUCT // NAMIBIAN OHS QUALIFICATION LADDER",
            "headline": "Precision safety education built for Namibian industry.",
            "lead": "Structured Occupational Health & Safety programmes from Level 1 Site Foundation to Level 6 Applied Hygiene Sensors and Level 7 Strategic EHS - pre-referenced to NTA Unit Standards and Namibian GN 156 of 1997.",
            "courses": academy_courses,
        },
        "safeman": {
            "brandMark": "S", "brandTitle": "SAFEMAN BY ORYX",
            "brandSub": "SAMTRAC-Style Corporate HSE & Practicum Tickets • safeman.oryxinstitute.org",
            "eyebrow": "SECONDARY PRODUCT // PROPRIETARY SAMTRAC-STYLE INDUSTRY SUITE",
            "headline": "High-impact corporate safety management & practical tickets.",
            "lead": "Our proprietary green-label B2B benchmark engineered around ISO 45001:2018, ISO 14001:2015, ISO 31000, and hands-on emergency practicums (CPR, First Aid, Firefighting, Heights, Confined Space & LOTO).",
            "courses": safeman_courses,
        },
    }
    portal_doc = {"generated": "2026-11", "academy": portal_academy, "safeman": portal_safeman}
    (OUT / "courses.json").write_text(json.dumps(courses_doc, indent=1, ensure_ascii=False), encoding="utf-8")
    (OUT / "portal.json").write_text(json.dumps(portal_doc, indent=1, ensure_ascii=False), encoding="utf-8")

    n_academy = len(academy_courses)
    n_safeman = len(safeman_courses)
    n_bank = sum(len(p["bank"]) for p in portal_academy) + sum(len(p["bank"]) for p in portal_safeman)
    print(f"courses.json : {n_academy} academy + {n_safeman} safeman courses")
    print(f"portal.json  : {len(portal_academy) + len(portal_safeman)} reader records, {n_bank} exam questions")
    # sanity: every course needs a bank >= 6 and modules >= 3
    for p in portal_academy + portal_safeman:
        if len(p["bank"]) < 6 or len(p["modules"]) < 3:
            print(f"  WARNING: {p['code']} bank={len(p['bank'])} modules={len(p['modules'])}")


if __name__ == "__main__":
    main()
