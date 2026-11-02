'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  parseVerifyInput,
  verifySignedPayload,
  type VerifyOutcome,
  type QrPayload,
} from '@/lib/qr-crypto';

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-safeman-hairline bg-oryx-canvas px-2.5 py-1 text-xs font-medium text-stone-700">
      {children}
    </span>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">{label}</p>
      <p className={`mt-0.5 break-words text-sm font-semibold text-stone-900 ${mono ? 'tnum' : ''}`}>
        {value}
      </p>
    </div>
  );
}

function ValidPanel({ payload }: { payload: QrPayload }) {
  return (
    <section
      aria-live="polite"
      className="overflow-hidden rounded-3xl border border-safeman-hairline bg-white shadow-md"
    >
      <div className="flex items-center gap-3 bg-safeman-primary px-5 py-4 text-white sm:px-7">
        <svg viewBox="0 0 24 24" className="h-8 w-8 shrink-0" fill="currentColor" aria-hidden="true">
          <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Zm-1.2 13.6-3-3 1.4-1.4 1.6 1.6 4-4L16.2 10l-5.4 5.6Z" />
        </svg>
        <div>
          <h2 className="font-display text-xl leading-tight sm:text-2xl">VALID SAFEMAN™ CREDENTIAL</h2>
          <p className="text-xs font-medium uppercase tracking-widest text-green-200">
            Signature verified · issued by Oryx Institute
          </p>
        </div>
      </div>
      <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7">
        <Row label="Worker" value={payload.n} />
        <Row label="Serial" value={payload.s} mono />
        <Row label="Course" value={payload.c} />
        <Row label="Company" value={payload.co || '—'} />
        <Row label="Issued" value={payload.iss} mono />
        <Row label="Expires" value={payload.exp} mono />
        <div className="sm:col-span-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
            Standards
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {payload.st
              .split('|')
              .filter(Boolean)
              .map((s) => (
                <Chip key={s}>{s}</Chip>
              ))}
          </div>
        </div>
        <div className="sm:col-span-2">
          <Row label="Status" value={payload.p === 'VERIFIED' ? 'VERIFIED — signature authentic' : payload.p} />
        </div>
      </div>
    </section>
  );
}

function InvalidPanel({ reason }: { reason: string }) {
  return (
    <section
      aria-live="assertive"
      className="overflow-hidden rounded-3xl border border-red-200 bg-white shadow-md"
    >
      <div className="flex items-center gap-3 bg-red-700 px-5 py-4 text-white sm:px-7">
        <svg viewBox="0 0 24 24" className="h-8 w-8 shrink-0" fill="currentColor" aria-hidden="true">
          <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Zm1 13h-2v2h2v-2Zm0-8h-2v6h2V7Z" />
        </svg>
        <div>
          <h2 className="font-display text-xl leading-tight sm:text-2xl">INVALID SIGNATURE</h2>
          <p className="text-xs font-medium uppercase tracking-widest text-red-200">
            Credential not authentic
          </p>
        </div>
      </div>
      <div className="p-5 sm:p-7">
        <p className="text-sm leading-relaxed text-stone-700">
          {reason} Do not accept this credential as proof of competency. This check runs entirely on
          your device using the same HMAC-SHA256 secret the issuer used — a mismatch means the
          payload was altered, forged, or signed with a different secret.
        </p>
      </div>
    </section>
  );
}

function VerifyInner() {
  const searchParams = useSearchParams();
  const d = searchParams.get('d') ?? '';
  const sig = searchParams.get('sig') ?? '';

  const [outcome, setOutcome] = useState<VerifyOutcome | null>(null);
  const [paste, setPaste] = useState('');
  const [pasteError, setPasteError] = useState('');
  const [checking, setChecking] = useState(false);

  const run = useCallback(async (payload: string, signature: string) => {
    setChecking(true);
    const result = await verifySignedPayload(payload, signature);
    setOutcome(result);
    setChecking(false);
  }, []);

  useEffect(() => {
    if (d) void run(d, sig);
    else setOutcome(null);
  }, [d, sig, run]);

  const verifyPaste = () => {
    setPasteError('');
    const parsed = parseVerifyInput(paste);
    if (!parsed.d) {
      setPasteError('Could not find a payload — paste the full verify URL or the d=… value.');
      return;
    }
    void run(parsed.d, parsed.sig ?? '');
  };

  return (
    <div className="space-y-8">
      {checking ? (
        <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-5 py-4 text-sm text-stone-600">
          <span
            className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-safeman-primary border-t-transparent"
            aria-hidden="true"
          />
          Recomputing signature…
        </div>
      ) : null}

      {!checking && outcome?.status === 'valid' ? <ValidPanel payload={outcome.payload} /> : null}
      {!checking && outcome?.status === 'invalid' ? <InvalidPanel reason={outcome.reason} /> : null}

      <section
        aria-labelledby="manual-heading"
        className="rounded-3xl border border-safeman-hairline bg-white p-5 shadow-sm sm:p-7"
      >
        <h2 id="manual-heading" className="font-display text-xl text-stone-900">
          Verify manually
        </h2>
        <p className="mt-1.5 text-sm text-stone-600">
          Paste the full verification link from a certificate or passport card QR — or just the{' '}
          <code className="tnum rounded bg-stone-100 px-1.5 py-0.5 text-xs">d=…</code> payload.
          Everything is checked locally; works fully offline.
        </p>
        <label htmlFor="paste-box" className="sr-only">
          Paste verification link or payload
        </label>
        <textarea
          id="paste-box"
          rows={3}
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          placeholder="https://safeman.oryxinstitute.org/verify?d=…&sig=…"
          className="tnum mt-3 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-3 font-mono text-xs focus:border-safeman-primary focus:outline-2 focus:outline-safeman-primary/30"
        />
        {pasteError ? (
          <p role="alert" className="mt-2 text-sm font-medium text-red-700">
            {pasteError}
          </p>
        ) : null}
        <button
          type="button"
          onClick={verifyPaste}
          disabled={!paste.trim()}
          className="mt-3 inline-flex min-h-[44px] items-center rounded-full bg-safeman-primary px-6 py-2.5 text-sm font-semibold text-white enabled:hover:bg-safeman-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Verify pasted payload
        </button>
      </section>

      <section aria-labelledby="how-heading" className="grid gap-4 sm:grid-cols-3">
        {[
          {
            n: '1',
            t: 'Decode',
            c: 'The QR carries a compact base64url JSON payload: serial, worker, course, standards, dates, status.',
          },
          {
            n: '2',
            t: 'Re-sign',
            c: 'Your device recomputes HMAC-SHA256 over the payload with the issuer’s public verifier secret.',
          },
          {
            n: '3',
            t: 'Compare',
            c: 'The recomputed 16-char signature must equal the sig in the link — any tampering breaks the match.',
          },
        ].map((step) => (
          <div key={step.n} className="rounded-2xl border border-oryx-hairline bg-white p-5">
            <p className="tnum flex h-7 w-7 items-center justify-center rounded-full bg-safeman-primary text-xs font-bold text-white">
              {step.n}
            </p>
            <h3 className="mt-2 font-display text-lg text-stone-900">{step.t}</h3>
            <p className="mt-1 text-sm leading-relaxed text-stone-600">{step.c}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

export default function VerifyClient() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-5 py-4 text-sm text-stone-600">
          <span
            className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-safeman-primary border-t-transparent"
            aria-hidden="true"
          />
          Loading verification portal…
        </div>
      }
    >
      <VerifyInner />
    </Suspense>
  );
}
