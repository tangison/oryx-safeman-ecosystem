'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { SAFEMAN_COURSES, getCourse } from '@/lib/data';
import {
  checkEligibility,
  getActiveTickets,
  getLedger,
  getProfile,
  saveProfile,
  type CertRecord,
  type LearnerProfile,
} from '@/lib/storage';
import { issueCertificate, relayToWebhook } from '@/lib/credential';
import { generateCertificatePdf, regenerateCertificatePdf } from '@/lib/pdf-certificate';
import { buildLocalVerifyPath } from '@/lib/qr-crypto';

interface IssueOutcome {
  record: CertRecord;
  filename: string;
}

export default function Issuer() {
  const [profile, setProfile] = useState<LearnerProfile>({ fullName: '', idNumber: '', company: '' });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [outcomes, setOutcomes] = useState<IssueOutcome[]>([]);
  const [error, setError] = useState('');
  const [ledger, setLedger] = useState<CertRecord[]>([]);
  const [tickets, setTickets] = useState<CertRecord[]>([]);
  const [mounted, setMounted] = useState(false);

  const webhookConfigured = Boolean(process.env.NEXT_PUBLIC_WEBHOOK_URL);

  const eligibility = useMemo(() => {
    const map = new Map<string, { eligible: boolean; reason: string }>();
    for (const course of SAFEMAN_COURSES) {
      const e = checkEligibility(course);
      map.set(course.id, { eligible: e.eligible, reason: e.eligible ? '' : e.reason });
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recompute when ledger changes
  }, [ledger]);

  useEffect(() => {
    setProfile(getProfile());
    setLedger(getLedger());
    setTickets(getActiveTickets());
    setMounted(true);
  }, []);

  const eligibleCourses = SAFEMAN_COURSES.filter(
    (c) => mounted && eligibility.get(c.id)?.eligible,
  );

  const toggle = (courseId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) next.delete(courseId);
      else next.add(courseId);
      return next;
    });
  };

  const updateProfile = (patch: Partial<LearnerProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      saveProfile(next);
      return next;
    });
  };

  const generate = async () => {
    setError('');
    if (!profile.fullName.trim() || !profile.idNumber.trim() || !profile.company.trim()) {
      setError('Full name, national ID / passport and company are all required.');
      return;
    }
    const courses = SAFEMAN_COURSES.filter((c) => selected.has(c.id));
    if (courses.length === 0) {
      setError('Select at least one course the learner has passed.');
      return;
    }
    setBusy(true);
    setOutcomes([]);
    try {
      const results: IssueOutcome[] = [];
      for (let i = 0; i < courses.length; i++) {
        const course = courses[i];
        setProgress(`Signing and rendering ${i + 1} of ${courses.length} — ${course.title}`);
        const record = await issueCertificate({
          course,
          fullName: profile.fullName.trim(),
          idNumber: profile.idNumber.trim(),
          company: profile.company.trim(),
        });
        const filename = await generateCertificatePdf({
          record,
          tickets: getActiveTickets(),
          assessor: course.requires_practicum
            ? (await import('@/lib/credential')).getAssessorFor(course.id)
            : null,
          examQuestions: course.questions_in_exam,
          passMark: course.pass_mark,
        });
        relayToWebhook(record);
        results.push({ record, filename });
      }
      setOutcomes(results);
      setLedger(getLedger());
      setTickets(getActiveTickets());
      setSelected(new Set());
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Certificate generation failed.');
    } finally {
      setBusy(false);
      setProgress('');
    }
  };

  const redownload = async (record: CertRecord) => {
    const course = getCourse(record.courseId);
    if (!course) return;
    await regenerateCertificatePdf(record, course, getActiveTickets());
  };

  return (
    <div className="space-y-8">
      {/* Learner details */}
      <section aria-labelledby="learner-heading" className="rounded-3xl border border-safeman-hairline bg-white p-5 shadow-sm sm:p-6">
        <h2 id="learner-heading" className="font-display text-xl text-stone-900">
          Learner details
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="full-name" className="text-sm font-medium text-stone-700">
              Full name
            </label>
            <input
              id="full-name"
              type="text"
              value={profile.fullName}
              onChange={(e) => updateProfile({ fullName: e.target.value })}
              autoComplete="name"
              placeholder="e.g. Petrus Nangolo"
              className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm focus:border-safeman-primary focus:outline-2 focus:outline-safeman-primary/30"
            />
          </div>
          <div>
            <label htmlFor="id-number" className="text-sm font-medium text-stone-700">
              National ID or passport
            </label>
            <input
              id="id-number"
              type="text"
              value={profile.idNumber}
              onChange={(e) => updateProfile({ idNumber: e.target.value })}
              placeholder="Only first+last 4 digits appear on the QR"
              className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm focus:border-safeman-primary focus:outline-2 focus:outline-safeman-primary/30"
            />
          </div>
          <div>
            <label htmlFor="company" className="text-sm font-medium text-stone-700">
              Company
            </label>
            <input
              id="company"
              type="text"
              value={profile.company}
              onChange={(e) => updateProfile({ company: e.target.value })}
              autoComplete="organization"
              placeholder="e.g. Rössing Uranium"
              className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm focus:border-safeman-primary focus:outline-2 focus:outline-safeman-primary/30"
            />
          </div>
        </div>
      </section>

      {/* Course selection */}
      <section aria-labelledby="courses-heading" className="rounded-3xl border border-safeman-hairline bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="courses-heading" className="font-display text-xl text-stone-900">
            Select courses the learner passed
          </h2>
          <p className="tnum text-xs font-semibold text-stone-500">
            {eligibleCourses.length} of {SAFEMAN_COURSES.length} eligible
          </p>
        </div>

        <ul className="mt-4 grid max-h-96 gap-2 overflow-y-auto pr-1 slim-scroll sm:grid-cols-2">
          {SAFEMAN_COURSES.map((course) => {
            const e = eligibility.get(course.id);
            const isEligible = mounted && e?.eligible;
            const isSelected = selected.has(course.id);
            return (
              <li key={course.id}>
                <label
                  htmlFor={`sel-${course.id}`}
                  className={`flex min-h-[44px] items-start gap-3 rounded-xl border px-3.5 py-3 transition-colors ${
                    isSelected
                      ? 'border-safeman-primary/60 bg-safeman-callout'
                      : isEligible
                        ? 'border-stone-200 hover:bg-stone-50'
                        : 'border-stone-100 bg-stone-50 opacity-70'
                  } ${isEligible ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                >
                  <input
                    id={`sel-${course.id}`}
                    type="checkbox"
                    disabled={!isEligible}
                    checked={isSelected}
                    onChange={() => toggle(course.id)}
                    className="mt-0.5 h-5 w-5 shrink-0 accent-[#14532D]"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-stone-800">
                      {course.title}
                    </span>
                    <span
                      className={`mt-0.5 block text-xs ${
                        isEligible ? 'text-safeman-primary' : 'text-stone-500'
                      }`}
                    >
                      {isEligible
                        ? `Eligible · validity ${course.cert_validity_months} months`
                        : (e?.reason ?? 'Checking…')}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>

        {error ? (
          <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={generate}
            disabled={busy || selected.size === 0}
            className="inline-flex min-h-[44px] items-center rounded-full bg-safeman-primary px-6 py-2.5 text-sm font-semibold text-white enabled:hover:bg-safeman-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? 'Generating…' : `Generate certificate & passport PDF${selected.size > 1 ? 's' : ''}`}
          </button>
          <span className="text-xs text-stone-500">
            A4 certificate + 2-sided 85.6 mm × 54 mm PVC passport card, QR-signed on this device.
          </span>
        </div>
        {busy && progress ? (
          <p aria-live="polite" className="tnum mt-3 text-sm font-medium text-safeman-primary">
            {progress}
          </p>
        ) : null}
        <p className="mt-3 text-xs text-stone-500">
          {webhookConfigured
            ? 'Webhook relay configured — issued records are also POSTed to NEXT_PUBLIC_WEBHOOK_URL (fire-and-forget).'
            : 'No webhook configured (NEXT_PUBLIC_WEBHOOK_URL unset) — records stay on this device only.'}
        </p>
      </section>

      {/* Outcomes */}
      {outcomes.length > 0 ? (
        <section aria-labelledby="outcome-heading" className="rounded-3xl border border-safeman-hairline bg-safeman-callout p-5 sm:p-6">
          <h2 id="outcome-heading" className="font-display text-xl text-safeman-primary">
            Issued {outcomes.length} credential{outcomes.length > 1 ? 's' : ''}
          </h2>
          <ul className="mt-4 space-y-3">
            {outcomes.map(({ record, filename }) => (
              <li key={record.serial} className="rounded-2xl border border-safeman-hairline bg-white p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="tnum rounded-md bg-safeman-primary px-2 py-1 text-xs font-bold text-white">
                    {record.serial}
                  </span>
                  <span className="text-sm font-semibold text-stone-800">{record.courseTitle}</span>
                  <span className="tnum ml-auto text-xs text-stone-500">
                    valid to {record.expires}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void redownload(record)}
                    className="inline-flex min-h-[36px] items-center rounded-full border border-stone-300 px-3.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50"
                  >
                    Download {filename ? 'PDF again' : 'PDF'}
                  </button>
                  <Link
                    href={buildLocalVerifyPath(record.d, record.sig)}
                    className="inline-flex min-h-[36px] items-center rounded-full border border-safeman-hairline bg-safeman-callout px-3.5 py-1.5 text-xs font-semibold text-safeman-primary hover:bg-green-100"
                  >
                    Test in verification portal
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Ledger */}
      {mounted && ledger.length > 0 ? (
        <section aria-labelledby="ledger-heading" className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 id="ledger-heading" className="font-display text-xl text-stone-900">
            Local certificate ledger
          </h2>
          <p className="tnum mt-1 text-xs text-stone-500">
            {ledger.length} record{ledger.length > 1 ? 's' : ''} · stored under
            &quot;safeman:ledger&quot; in this browser
          </p>
          <div className="mt-4 max-h-96 overflow-y-auto slim-scroll">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-safeman-hairline text-left text-xs font-bold uppercase tracking-wider text-stone-500">
                  <th className="py-2 pr-3">Serial</th>
                  <th className="py-2 pr-3">Course</th>
                  <th className="py-2 pr-3">Worker</th>
                  <th className="py-2 pr-3">Expires</th>
                  <th className="py-2">Verify</th>
                </tr>
              </thead>
              <tbody>
                {[...ledger].reverse().map((r) => (
                  <tr key={r.serial} className="border-b border-stone-100">
                    <td className="tnum py-2.5 pr-3 font-semibold text-stone-800">{r.serial}</td>
                    <td className="py-2.5 pr-3 text-stone-600">{r.courseCode}</td>
                    <td className="py-2.5 pr-3 text-stone-600">{r.name}</td>
                    <td className="tnum py-2.5 pr-3 text-stone-600">{r.expires}</td>
                    <td className="py-2.5">
                      <Link
                        href={buildLocalVerifyPath(r.d, r.sig)}
                        className="font-semibold text-safeman-primary hover:underline"
                      >
                        check →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
