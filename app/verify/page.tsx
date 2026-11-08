"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { verifyParam, type VerifyResult } from "@/lib/verify";

function Verdict() {
  const params = useSearchParams();
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [manual, setManual] = useState("");

  useEffect(() => {
    const d = params.get("d");
    const sig = params.get("sig");
    verifyParam(d, sig).then(setResult);
  }, [params]);

  const check = () => {
    const raw = manual.trim();
    if (!raw) return;
    // accepts the full URL, or the raw d/sig pair
    try {
      const u = new URL(raw);
      verifyParam(u.searchParams.get("d"), u.searchParams.get("sig")).then(setResult);
    } catch {
      const [d, sig] = raw.split(".");
      verifyParam(d, raw.includes(".") ? raw : sig).then(setResult);
    }
  };

  const trackName = (t?: string) => (t === "m" ? "SafeMan by Oryx" : "Oryx Safety Academy");

  return (
    <main className="container portal-shell" style={{ maxWidth: 760 }}>
      <div className="verify-box">
        <div className="eyebrow">CREDENTIAL VERIFICATION // STATELESS</div>
        <h1 className="section-title" style={{ marginBottom: 8 }}>Verify a document</h1>
        <p className="hero-lead" style={{ fontSize: "0.95rem" }}>
          Certificates and PVC passes carry an HMAC-SHA256 signature inside the QR code. This page
          re-computes the signature locally — there is no database to query and nothing personal to
          leak. Paste the verify URL or scan the code.
        </p>

        <label className="form-label" htmlFor="vf-in">Verify URL or signed string</label>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            id="vf-in"
            className="form-input"
            style={{ flex: "1 1 320px" }}
            placeholder="https://oryxinstitute.org/verify?d=...&sig=..."
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && check()}
          />
          <button className="btn btn-primary" onClick={check}>Verify</button>
        </div>

        {result && (
          <div className={`result-banner ${result.valid ? "" : "fail"}`} style={{ marginTop: 26 }}>
            <h3>{result.valid ? "AUTHENTIC" : "NOT VERIFIED"}</h3>
            <p className="course-desc" style={{ marginBottom: 12 }}>{result.reason}</p>
            {result.valid && result.payload && (
              <table className="verify-table">
                <tbody>
                  <tr><td>Serial</td><td>{result.payload.s}</td></tr>
                  <tr><td>Learner</td><td>{result.payload.n}</td></tr>
                  <tr><td>Programme</td><td>{result.payload.c}</td></tr>
                  <tr><td>Issued</td><td>{result.payload.d}</td></tr>
                  <tr><td>Track</td><td>{trackName(result.payload.t)}</td></tr>
                  <tr><td>Signature</td><td>HMAC-SHA256 valid (keyed, stateless)</td></tr>
                </tbody>
              </table>
            )}
          </div>
        )}

        <div className="pane-actions" style={{ marginTop: 30 }}>
          <Link href="/" className="btn btn-outline btn-sm">Catalogue</Link>
          <Link href="/portal/" className="btn btn-outline btn-sm">Student Portal</Link>
        </div>
      </div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <>
      <header className="site-header">
        <div className="container nav-bar">
          <Link href="/" className="brand">
            <span className="brand-mark">O</span>
            <span>
              <span className="brand-name">ORYX INSTITUTE</span>
              <span className="brand-sub">Credential verification • oryxinstitute.org</span>
            </span>
          </Link>
          <div className="nav-actions">
            <Link href="/" className="btn btn-outline btn-sm">Catalogue</Link>
          </div>
        </div>
      </header>
      <Suspense fallback={<main className="container portal-shell"><p>Checking signature...</p></main>}>
        <Verdict />
      </Suspense>
    </>
  );
}
