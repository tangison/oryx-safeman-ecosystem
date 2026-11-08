"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { EnrollDrawer } from "@/components/EnrollDrawer";
import { useTrack } from "@/components/TrackContext";
import { SAFEMAN_DISCLOSURE, type Course } from "@/lib/brand";

export default function HomePage() {
  const { track, catalogue, setTrack } = useTrack();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerCourse, setDrawerCourse] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("All");

  const brand = catalogue ? catalogue[track] : null;
  const categories = useMemo(
    () => (brand ? ["All", ...Array.from(new Set(brand.courses.map((c: Course) => c.category)))] : ["All"]),
    [brand]
  );
  const visible = brand ? brand.courses.filter((c) => filter === "All" || c.category === filter) : [];

  const openDrawer = (course: string | null) => {
    setDrawerCourse(course);
    setDrawerOpen(true);
  };

  return (
    <>
      <SiteHeader onEnroll={() => openDrawer(null)} />
      <EnrollDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} course={drawerCourse} />

      {/* ---------------------------------------------------------- hero */}
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <div className="eyebrow">{brand ? brand.eyebrow : "LOADING PROGRAMME DATA..."}</div>
            <h1 className="hero-title">{brand ? brand.headline : "Precision safety education."}</h1>
            <p className="hero-lead">{brand ? brand.lead : ""}</p>
            <div className="hero-cta-row">
              <button className="btn btn-primary" onClick={() => openDrawer(null)}>Request Enrollment</button>
              <Link href="/portal/" className="btn btn-outline">Student Portal Login</Link>
            </div>
          </div>
          <div className="stats-column" aria-label="Institution statistics">
            <div>
              <div className="stat-num">7<span>LEVELS</span></div>
              <div className="stat-label">NQF Pre-Accreditation Ladder</div>
            </div>
            <div>
              <div className="stat-num">13<span>TICKETS</span></div>
              <div className="stat-label">SafeMan Operational Modules</div>
            </div>
            <div>
              <div className="stat-num">100<span>%</span></div>
              <div className="stat-label">QR-Verified Credentials & Manuals</div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ catalogue */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <div className="eyebrow">CURRICULUM ARCHITECTURE</div>
              <h2 className="section-title">
                {track === "academy" ? "Oryx Safety Academy — Levels 1 to 7" : "SafeMan Corporate Courses & Practicum Tickets"}
              </h2>
            </div>
            <div className="filter-row" role="tablist" aria-label="Category filter">
              {categories.map((c) => (
                <button key={c} className={`filter-chip ${filter === c ? "active" : ""}`} onClick={() => setFilter(c)}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="course-grid">
            {visible.map((c) => (
              <article className="course-card" key={c.code}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="card-plate"
                  src={`/assets/webp/${c.plate}.webp`}
                  alt={`${c.code} programme plate`}
                  loading="lazy"
                />
                <div className="card-top-meta">
                  <span className="course-code">{c.flag ? `${c.code} (${c.flag})` : c.code}</span>
                  <span className="course-duration">{c.duration}{c.notional ? ` • ${c.notional}` : ""}</span>
                </div>
                <h3 className="course-title">
                  {c.code === "SM-CORE" ? (
                    <Link href="/sm-core/" title="SafeMan Core course site">{c.title}</Link>
                  ) : (
                    c.title
                  )}
                </h3>
                <p className="course-desc">{c.desc}</p>
                <span className="standard-pill">{c.standards}</span>
                <div className="card-actions">
                  <button className="btn btn-primary btn-sm" onClick={() => openDrawer(c.code)}>Enroll</button>
                  <Link className="btn btn-outline btn-sm" href={`/portal/?course=${encodeURIComponent(c.code)}`}>
                    Portal Access
                  </Link>
                </div>
              </article>
            ))}
            {!brand && <p className="course-desc">Loading programme catalogue...</p>}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------- disclosure */}
      <section className="container">
        <div className="disclosure">
          {track === "safeman" ? (
            <>
              <div className="eyebrow" style={{ marginBottom: 10 }}>STATUTORY DISCLOSURE — SAFEMAN BY ORYX</div>
              <p>
                <strong>SafeMan™ by Oryx</strong> is an {SAFEMAN_DISCLOSURE} SafeMan tickets certify
                competence against the Institute&apos;s own industry benchmark and are issued with
                HMAC-SHA256 QR verification; they are not NQA-accredited qualifications.
                For the government pre-certified pathway, enrol with the{" "}
                <a
                  href="/"
                  onClick={(e) => {
                    e.preventDefault();
                    setTrack("academy");
                  }}
                >
                  Oryx Safety Academy NQF track
                </a>.
              </p>
            </>
          ) : (
            <>
              <div className="eyebrow" style={{ marginBottom: 10 }}>INSTITUTIONAL DISCLOSURE — ORYX SAFETY ACADEMY</div>
              <p>
                <strong>Oryx Safety Academy</strong> delivers the NQF Levels 1-7 vocational spine,
                pre-referenced to NTA Unit Standards and Namibian GN 156 of 1997 regulations ahead of
                formal NQA accreditation. Every issued credential carries a serial number and an
                HMAC-SHA256 signed QR code verifiable at <b>oryxinstitute.org/verify</b> — no account,
                no database, arithmetic-level trust. Contact: <b>info@oryxinstitute.org</b>.
              </p>
            </>
          )}
        </div>
      </section>

      {/* --------------------------------------------------------- footer */}
      <footer className="container site-footer">
        <div>
          <b>ORYX INSTITUTE</b> — Research. Practice. Ventures.
        </div>
        <div className="footer-rules">
          <a href="mailto:info@oryxinstitute.org">info@oryxinstitute.org</a>
          <Link href="/sm-core/">SM-CORE Course Site</Link>
          <Link href="/portal/">Student Portal</Link>
          <Link href="/verify/">Verify a Credential</Link>
        </div>
      </footer>
    </>
  );
}
