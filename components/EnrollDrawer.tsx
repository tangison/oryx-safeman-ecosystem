"use client";

import { useMemo, useState } from "react";
import { ENROLL_EMAIL } from "@/lib/brand";

interface Props {
  open: boolean;
  onClose: () => void;
  /** course code prefilled from a card click, or null for general enrolment */
  course: string | null;
}

/**
 * Dual-mode enrollment drawer (brief part 1):
 *  - mailto drawer: builds a structured email to info@oryxinstitute.org -
 *    zero backend, zero Google account, works on phone + desktop.
 *  - optional webhook: when NEXT_PUBLIC_ENROLL_WEBHOOK is configured the same
 *    payload is POSTed as JSON (free-tier Google Apps Script / Supabase hook).
 */
export function EnrollDrawer({ open, onClose, course }: Props) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [mode, setMode] = useState("Individual Registration");
  const [seats, setSeats] = useState("1");
  const [sent, setSent] = useState(false);

  const subject = useMemo(
    () => encodeURIComponent(`Enrollment Request: ${course || "General Safety Programmes"}`),
    [course]
  );
  const body = useMemo(() => {
    const lines = [
      "ORYX INSTITUTE - ENROLLMENT REQUEST",
      "------------------------------------",
      `Programme:    ${course || "To be advised"}`,
      `Full Name:    ${name || "(not provided)"}`,
      `Company / ID: ${company || "Individual Registration"}`,
      `Mode:         ${mode}`,
      `Cohort Size:  ${seats}`,
      "",
      "Requesting: quotation, invoice, next available cohort dates and",
      "the student portal access code for the programme above.",
      "",
      "-- sent from the Oryx Institute website enrollment drawer",
    ];
    return encodeURIComponent(lines.join("\n"));
  }, [course, name, company, mode, seats]);

  if (!open) return null;

  const webhook = process.env.NEXT_PUBLIC_ENROLL_WEBHOOK;

  const send = () => {
    if (webhook) {
      fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ course, name, company, mode, seats, to: ENROLL_EMAIL }),
      }).catch(() => undefined);
    }
    window.location.href = `mailto:${ENROLL_EMAIL}?subject=${subject}&body=${body}`;
    setSent(true);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Enrollment drawer">
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="eyebrow">ENROLLMENT DRAWER</div>
            <div className="modal-title serif">Request your seat</div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <p className="modal-sub">
          Your request opens as a structured email to <b>{ENROLL_EMAIL}</b> - quotation, invoice
          and your portal access code are answered by return. No account required.
        </p>

        <label className="form-label" htmlFor="en-course">Programme</label>
        <input id="en-course" className="form-input" value={course || "General - advise me on the right track"} readOnly />

        <label className="form-label" htmlFor="en-name">Full name</label>
        <input id="en-name" className="form-input" placeholder="e.g., Petrus Shikongo" value={name} onChange={(e) => setName(e.target.value)} />

        <label className="form-label" htmlFor="en-company">Company / ID number</label>
        <input id="en-company" className="form-input" placeholder="e.g., Namib Mining Contractors CC" value={company} onChange={(e) => setCompany(e.target.value)} />

        <label className="form-label" htmlFor="en-mode">Registration mode</label>
        <select id="en-mode" className="form-select" value={mode} onChange={(e) => setMode(e.target.value)}>
          <option>Individual Registration</option>
          <option>Corporate Cohort (in-house)</option>
          <option>Corporate Cohort (public class)</option>
        </select>

        <label className="form-label" htmlFor="en-seats">Seats required</label>
        <input id="en-seats" className="form-input" type="number" min={1} max={500} value={seats} onChange={(e) => setSeats(e.target.value)} />

        <div className="pane-actions">
          <button className="btn btn-primary" onClick={send} disabled={sent}>
            {sent ? "Email client opened" : "Send Enrollment Request"}
          </button>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
        </div>
        <p className="form-hint">
          {sent
            ? "If your email client did not open, copy the address: " + ENROLL_EMAIL
            : "We reply with cohort dates, the invoice and your access code (e.g., ORYX-2026)."}
        </p>
      </div>
    </div>
  );
}
