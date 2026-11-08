"use client";

import { useState } from "react";
import type { Practicum } from "@/lib/brand";

interface Props {
  practicum: Practicum;
  courseCode: string;
  onComplete: (allTicked: boolean) => void;
}

/** Assessor Practicum Checklist (brief part 1): every line must be ticked
 *  by the assessor before the certificate unlocks for practical tickets. */
export function PracticumChecklist({ practicum, courseCode, onComplete }: Props) {
  const [ticks, setTicks] = useState<boolean[]>(Array(practicum.items.length).fill(false));
  const done = ticks.every(Boolean);

  const toggle = (i: number) => {
    const next = ticks.map((v, k) => (k === i ? !v : v));
    setTicks(next);
    onComplete(next.every(Boolean));
  };

  return (
    <div className="reader-pane">
      <div className="eyebrow">ASSESSOR PRACTICUM CHECKLIST</div>
      <h2 className="serif">{practicum.title}</h2>
      <p className="lead">{practicum.pass_rule}</p>

      <div style={{ margin: "18px 0", padding: "14px 18px", background: "var(--surface)", borderLeft: "3px solid var(--accent)" }}>
        <b style={{ fontSize: "0.8rem", letterSpacing: "0.08em" }}>{courseCode}</b>
        <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}> — assessor signs on site; this digital record feeds the certificate gate.</span>
      </div>

      {practicum.items.map((item, i) => (
        <div className="check-item" key={i}>
          <input type="checkbox" id={`chk-${i}`} checked={ticks[i]} onChange={() => toggle(i)} />
          <label htmlFor={`chk-${i}`}>
            <b style={{ marginRight: 8, fontVariantNumeric: "tabular-nums" }}>{String(i + 1).padStart(2, "0")}</b>
            {item}
          </label>
        </div>
      ))}

      <div className="pane-actions">
        <div className={`quiz-timer ${done ? "" : "warn"}`}>
          {ticks.filter(Boolean).length}/{practicum.items.length} VERIFIED — {done ? "COMPETENT" : "IN PROGRESS"}
        </div>
      </div>
    </div>
  );
}
