"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTrack } from "@/components/TrackContext";
import { ExamRunner } from "@/components/ExamRunner";
import { GasSimulator } from "@/components/GasSimulator";
import { PracticumChecklist } from "@/components/PracticumChecklist";
import { downloadCertificate, downloadPvcPass } from "@/lib/pdf-certificate";
import { serialFor, type PortalCourse, type PortalData, type Track } from "@/lib/brand";

interface Session { name: string; id: string; code: string; track: Track; courseCode: string }
interface Progress { examPassed: boolean; bestPct: number; practicumDone: boolean }

const SESSION_KEY = "oryx-session";
const progressKey = (s: Session) => `oryx-progress:${s.courseCode}:${s.id.toLowerCase()}`;

function PortalInner() {
  const params = useSearchParams();
  const { setTrack } = useTrack();
  const [data, setData] = useState<PortalData | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [course, setCourse] = useState<PortalCourse | null>(null);
  const [pane, setPane] = useState<string>("m0");
  const [progress, setProgress] = useState<Progress>({ examPassed: false, bestPct: 0, practicumDone: false });
  const [busy, setBusy] = useState(false);

  // login form state
  const [fName, setFName] = useState("");
  const [fId, setFId] = useState("");
  const [fCode, setFCode] = useState("");
  const [fCourse, setFCourse] = useState("");
  const [loginErr, setLoginErr] = useState("");

  const loadProgress = useCallback((s: Session) => {
    try {
      const raw = window.localStorage.getItem(progressKey(s));
      setProgress(raw ? JSON.parse(raw) : { examPassed: false, bestPct: 0, practicumDone: false });
    } catch {
      setProgress({ examPassed: false, bestPct: 0, practicumDone: false });
    }
  }, []);

  const launch = useCallback((s: Session, d: PortalData) => {
    const found = [...d.academy, ...d.safeman].find((c) => c.code === s.courseCode) || d.academy[0];
    setCourse(found);
    setPane("m0");
    loadProgress(s);
    setSession(s);
    setTrack(s.track);
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  }, [loadProgress, setTrack]);

  useEffect(() => {
    fetch("/data/portal.json")
      .then((r) => r.json())
      .then((d: PortalData) => {
        setData(d);
        const saved = window.localStorage.getItem(SESSION_KEY);
        if (saved) {
          try { launch(JSON.parse(saved), d); } catch { /* fresh login */ }
        }
        const pre = params.get("course");
        if (pre) {
          setFCourse(pre);
          const match = [...d.academy, ...d.safeman].find((c) => c.code === pre);
          if (match) setTrack(match.code.startsWith("SM-") ? "safeman" : "academy");
        }
      })
      .catch(() => setData(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doLogin = () => {
    if (!data) return;
    if (!fName.trim() || !fId.trim() || !fCourse) {
      setLoginErr("Full name, ID number and programme are required.");
      return;
    }
    const track: Track = fCourse.startsWith("SM-") ? "safeman" : "academy";
    // access code is optional; a malformed one blocks (they arrive by email after payment)
    if (fCode && !/^(ORYX|SM)-\d{4}$/i.test(fCode.trim())) {
      setLoginErr("Access code format looks wrong - leave it blank or use the code from your enrolment email (e.g., ORYX-2026).");
      return;
    }
    launch(
      {
        name: fName.trim(),
        id: fId.trim(),
        code: fCode.trim() || (track === "safeman" ? "SM-2026" : "ORYX-2026"),
        track,
        courseCode: fCourse,
      },
      data
    );
  };

  const saveProgress = (p: Progress) => {
    if (!session) return;
    setProgress(p);
    window.localStorage.setItem(progressKey(session), JSON.stringify(p));
  };

  const certReady = course && progress.examPassed && (!course.practicum || progress.practicumDone);
  const serial = session && course ? serialFor(session.track, session.id + course.code) : "";

  const certReq: Parameters<typeof downloadCertificate>[0] | null =
    session && course && certReady
      ? {
          learner: session.name,
          learnerId: session.id,
          courseCode: course.code,
          courseTitle: course.title,
          standards: course.code.startsWith("SM-")
            ? "ISO 45001:2018 | ISO 14001:2015 | ISO 31000 | Pre-referenced to NTA Unit Standards & GN 156 of 1997 (Non-NQA statutory credit)"
            : "Pre-referenced to NTA Unit Standards | Namibian GN 156 of 1997 | Labour Act 11 of 2007",
          track: session.track,
          serial,
        }
      : null;

  const doDownload = async (fn: (r: Parameters<typeof downloadCertificate>[0]) => Promise<void>) => {
    if (!certReq) return;
    setBusy(true);
    try { await fn(certReq); } finally { setBusy(false); }
  };

  /* ------------------------------------------------------------- login view */
  if (!session || !course) {
    return (
      <main className="container portal-shell" style={{ maxWidth: 720 }}>
        <div className="eyebrow">STUDENT PORTAL // INSTANT ACCESS</div>
        <h1 className="hero-title" style={{ fontSize: "clamp(2rem,4vw,3rem)" }}>Open your course.</h1>
        <p className="hero-lead">
          Enter your details and go straight into the reader, the timed examination and your
          QR-verified certificate. The cohort access code arrives by email after enrolment —
          leave it blank for the open preview.
        </p>
        {loginErr && <div className="result-banner fail"><p style={{ margin: 0 }}><b>{loginErr}</b></p></div>}
        <label className="form-label" htmlFor="pt-name">Full legal name</label>
        <input id="pt-name" className="form-input" placeholder="e.g., Petrus Shikongo" value={fName} onChange={(e) => setFName(e.target.value)} />
        <label className="form-label" htmlFor="pt-id">ID / Passport number</label>
        <input id="pt-id" className="form-input" placeholder="e.g., 96120900481" value={fId} onChange={(e) => setFId(e.target.value)} />
        <label className="form-label" htmlFor="pt-course">Programme</label>
        <select id="pt-course" className="form-select" value={fCourse} onChange={(e) => setFCourse(e.target.value)}>
          <option value="">— Select your programme —</option>
          <optgroup label="Oryx Safety Academy (NQF L1-L7)">
            {(data?.academy || []).map((c) => <option key={c.code} value={c.code}>{c.code} — {c.title}</option>)}
          </optgroup>
          <optgroup label="SafeMan by Oryx (13 tickets)">
            {(data?.safeman || []).map((c) => <option key={c.code} value={c.code}>{c.code} — {c.title}</option>)}
          </optgroup>
        </select>
        <label className="form-label" htmlFor="pt-code">Cohort access code (optional)</label>
        <input id="pt-code" className="form-input" placeholder="e.g., ORYX-2026" value={fCode} onChange={(e) => setFCode(e.target.value)} />
        <div className="pane-actions">
          <button className="btn btn-primary" onClick={doLogin} disabled={!data}>Enter Portal</button>
          <Link href="/" className="btn btn-outline">Back to Catalogue</Link>
        </div>
      </main>
    );
  }

  /* ------------------------------------------------------------- portal view */
  const moduleIndex = pane.startsWith("m") ? parseInt(pane.slice(1), 10) : -1;
  const navItems = [
    ...course.modules.map((m, i) => ({ id: `m${i}`, num: `M${i + 1}`, label: m.title })),
    { id: "sim", num: "LAB", label: "4-Gas Simulator (virtual)" },
    { id: "exam", num: "EXAM", label: "Timed Examination" },
    ...(course.practicum ? [{ id: "practicum", num: "DRILL", label: course.practicum.title }] : []),
    { id: "cert", num: "CERT", label: "Certificate & PVC Pass" },
  ];

  return (
    <main className="container portal-shell">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
        <div>
          <div className="eyebrow">{session.track === "safeman" ? "SAFEMAN PORTAL" : "ACADEMY PORTAL"} — SIGNED IN</div>
          <h1 className="section-title" style={{ marginBottom: 4 }}>{course.code} — {course.title}</h1>
          <span style={{ fontSize: "0.84rem", color: "var(--muted)" }}>
            {session.name} · ID {session.id} · access code {session.code}
          </span>
        </div>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => { window.localStorage.removeItem(SESSION_KEY); setSession(null); setCourse(null); }}
        >
          Sign Out
        </button>
      </div>

      <div className="portal-grid">
        <nav className="reader-nav" aria-label="Course sections">
          <div className="reader-nav-head">
            <div className="eyebrow" style={{ fontSize: "0.62rem" }}>COURSE SECTIONS</div>
            <div style={{ fontSize: "0.8rem", fontWeight: 600, marginTop: 4 }}>
              {progress.examPassed ? "Exam: PASSED" : "Exam: pending"} · {course.practicum ? (progress.practicumDone ? "Drill: VERIFIED" : "Drill: pending") : "No drill"}
            </div>
          </div>
          {navItems.map((n) => (
            <button key={n.id} className={`reader-item ${pane === n.id ? "active" : ""}`} onClick={() => setPane(n.id)}>
              <span className="reader-num">{n.num}</span>
              <span>{n.label}</span>
            </button>
          ))}
        </nav>

        <div>
          {moduleIndex >= 0 && course.modules[moduleIndex] && (
            <div className="reader-pane">
              <div className="eyebrow">MODULE {moduleIndex + 1} OF {course.modules.length}</div>
              <h2>{course.modules[moduleIndex].title}</h2>
              <p className="lead">{course.modules[moduleIndex].summary}</p>
              <ul className="keypoints">
                {course.modules[moduleIndex].points.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
              <div className="pane-actions">
                {moduleIndex > 0 && <button className="btn btn-outline" onClick={() => setPane(`m${moduleIndex - 1}`)}>Previous Module</button>}
                {moduleIndex < course.modules.length - 1 ? (
                  <button className="btn btn-primary" onClick={() => setPane(`m${moduleIndex + 1}`)}>Next Module</button>
                ) : (
                  <button className="btn btn-primary" onClick={() => setPane("exam")}>Go to Examination</button>
                )}
              </div>
              <figure className="module-plate">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/assets/webp/${course.plate}.webp`} alt={`${course.code} programme plate`} loading="lazy" />
                <figcaption>PROGRAMME PLATE — {course.code}</figcaption>
              </figure>
            </div>
          )}

          {pane === "sim" && (
            course.simulator === "gas4" ? (
              <GasSimulator />
            ) : (
              <div className="reader-pane">
                <div className="eyebrow">VIRTUAL LAB</div>
                <h2>No simulator attached to this programme</h2>
                <p className="lead">The 4-gas atmospheric laboratory is attached to SM-CSE (Confined Space &amp; Gas Testing) and Academy Level 6 (Instrumentation &amp; Hygiene).</p>
              </div>
            )
          )}

          {pane === "exam" && (
            <ExamRunner
              questions={course.bank}
              minutes={course.examMinutes}
              courseCode={course.code}
              onResult={(passed, pct) =>
                saveProgress({
                  ...progress,
                  examPassed: progress.examPassed || passed,
                  bestPct: Math.max(progress.bestPct, pct),
                })
              }
            />
          )}

          {pane === "practicum" && course.practicum && (
            <PracticumChecklist
              practicum={course.practicum}
              courseCode={course.code}
              onComplete={(all) => { if (all && !progress.practicumDone) saveProgress({ ...progress, practicumDone: true }); }}
            />
          )}

          {pane === "cert" && (
            <div className="reader-pane">
              <div className="eyebrow">CREDENTIAL ISSUANCE</div>
              <h2>Certificate &amp; PVC Wallet Pass</h2>
              <p className="lead">
                Your A4 landscape certificate carries a double frame, the Principal&apos;s signature,
                a serial number and an HMAC-SHA256 QR code. The tear-off PVC pass prints front and
                back at wallet size (85.6 × 54 mm).
              </p>

              {!progress.examPassed && (
                <div className="result-banner fail">
                  <h3>Exam gate: not yet passed</h3>
                  <p className="course-desc" style={{ margin: 0 }}>
                    Pass the timed examination first{course.practicum ? " and complete the assessor practicum checklist" : ""}.
                  </p>
                </div>
              )}
              {progress.examPassed && course.practicum && !progress.practicumDone && (
                <div className="result-banner fail">
                  <h3>Practicum gate: pending</h3>
                  <p className="course-desc" style={{ margin: 0 }}>The assessor checklist must be fully verified for practical tickets.</p>
                </div>
              )}

              {certReady && (
                <>
                  <div className="result-banner">
                    <h3>Competency verified — credentials unlocked</h3>
                    <div className="serial-line">SERIAL <b>{serial}</b> · LEARNER <b>{session.name}</b> · BEST SCORE <b>{progress.bestPct}%</b></div>
                    <p className="course-desc" style={{ marginBottom: 16 }}>
                      Dates print with the live issue date. The QR resolves to{" "}
                      <b>{session.track === "safeman" ? "safeman.oryxinstitute.org" : "oryxinstitute.org"}/verify</b> —
                      stateless HMAC-SHA256 verification, no account needed.
                    </p>
                    <div className="hero-cta-row">
                      <button className="btn btn-primary" disabled={busy} onClick={() => doDownload(downloadCertificate)}>
                        {busy ? "Building PDF..." : "Download Certificate (A4)"}
                      </button>
                      <button className="btn btn-outline" disabled={busy} onClick={() => doDownload(downloadPvcPass)}>
                        {busy ? "Building PDF..." : "Download PVC Pass (85.6 × 54)"}
                      </button>
                    </div>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/assets/signatures/principal_signature.png"
                      alt="Principal signature"
                      width={130}
                      style={{ display: "block", marginTop: 6 }}
                    />
                    <div style={{ fontSize: "0.7rem", color: "var(--muted)", borderTop: "1px solid var(--ink)", display: "inline-block", paddingTop: 4 }}>
                      Tangi Iigonda — Principal &amp; Founder, Oryx Institute
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function PortalPage() {
  return (
    <>
      <header className="site-header">
        <div className="container nav-bar">
          <Link href="/" className="brand">
            <span className="brand-mark">O</span>
            <span>
              <span className="brand-name">ORYX INSTITUTE</span>
              <span className="brand-sub">Dual-brand safety education • student portal</span>
            </span>
          </Link>
          <div className="nav-actions">
            <Link href="/" className="btn btn-outline btn-sm">Catalogue</Link>
            <Link href="/verify/" className="btn btn-outline btn-sm">Verify</Link>
          </div>
        </div>
      </header>
      <Suspense fallback={<main className="container portal-shell"><p className="course-desc">Loading portal...</p></main>}>
        <PortalInner />
      </Suspense>
    </>
  );
}
