"use client";

import Link from "next/link";
import { useTrack } from "./TrackContext";

export function SiteHeader({ onEnroll }: { onEnroll: () => void }) {
  const { track, setTrack } = useTrack();
  const academy = track === "academy";
  return (
    <header className="site-header">
      <div className="container nav-bar">
        <Link href="/" className="brand">
          <span className="brand-mark">{academy ? "O" : "S"}</span>
          <span>
            <span className="brand-name">{academy ? "ORYX SAFETY ACADEMY" : "SAFEMAN BY ORYX"}</span>
            <span className="brand-sub">
              {academy ? "NQF Levels 1-7 Vocational Spine • oryxinstitute.org" : "Corporate HSE & Practicum Tickets • safeman.oryxinstitute.org"}
            </span>
          </span>
        </Link>

        <div className="track-switcher" role="tablist" aria-label="Product line switcher">
          <button
            className={`track-btn ${academy ? "active" : ""}`}
            onClick={() => setTrack("academy")}
            aria-pressed={academy}
          >
            Academy
          </button>
          <button
            className={`track-btn ${!academy ? "active" : ""}`}
            onClick={() => setTrack("safeman")}
            aria-pressed={!academy}
          >
            SafeMan
          </button>
        </div>

        <div className="nav-actions">
          <Link href="/portal/" className="btn btn-outline btn-sm">
            Student Portal
          </Link>
          <button className="btn btn-primary btn-sm" onClick={onEnroll}>
            Enroll Now
          </button>
        </div>
      </div>
    </header>
  );
}
