'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { SafeManCourse } from '@/lib/data';
import SignaturePad from '@/components/signature-pad';
import {
  getPracticumSignoff,
  getQuizResult,
  setPracticumSignoff,
  type PracticumSignoff,
} from '@/lib/storage';

export default function PracticumForm({ course }: { course: SafeManCourse }) {
  const practicum = course.practicum;

  const [quizPassed, setQuizPassed] = useState<boolean | null>(null);
  const [existing, setExisting] = useState<PracticumSignoff | null>(null);
  const [checked, setChecked] = useState<number[]>([]);
  const [assessorName, setAssessorName] = useState('');
  const [assessorRole, setAssessorRole] = useState('');
  const [company, setCompany] = useState('');
  const [signature, setSignature] = useState('');
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const q = getQuizResult(course.id);
    setQuizPassed(Boolean(q?.passed));
    const signoff = practicum ? getPracticumSignoff(course.id) : null;
    setExisting(signoff);
    if (signoff) {
      setChecked(signoff.stepsChecked);
      setAssessorName(signoff.assessorName);
      setAssessorRole(signoff.assessorRole);
      setCompany(signoff.company);
      setSignature(signoff.signature);
    }
    setMounted(true);
  }, [course.id, practicum]);

  if (!practicum) {
    return (
      <div className="rounded-2xl border border-safeman-hairline bg-white p-6 text-center">
        <h2 className="font-display text-xl text-stone-900">No practicum for this course</h2>
        <p className="mt-2 text-sm text-stone-600">
          {course.title} is a theory-only course. Pass the knowledge check, then issue the
          certificate directly.
        </p>
        <Link
          href={`/safeman/course/${course.id}/quiz/`}
          className="mt-4 inline-flex min-h-[44px] items-center rounded-full bg-safeman-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-safeman-primary/90"
        >
          Go to knowledge check
        </Link>
      </div>
    );
  }

  if (mounted && quizPassed === false) {
    return (
      <div className="rounded-3xl border border-amber-300/70 bg-amber-50 p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-400/20">
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-amber-600" fill="currentColor" aria-hidden="true">
              <path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm-3 8V7a3 3 0 1 1 6 0v3H9Zm3 4a2 2 0 0 1 1 3.73V19h-2v-1.27A2 2 0 0 1 12 14Z" />
            </svg>
          </span>
          <div>
            <h2 className="font-display text-2xl text-stone-900">Practicum locked</h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-700">
              The assessor sign-off unlocks only after the knowledge check is passed (
              <span className="tnum">{course.pass_mark}%</span> or higher). Sit the check first — it
              is graded instantly on this device.
            </p>
            <Link
              href={`/safeman/course/${course.id}/quiz/`}
              className="mt-4 inline-flex min-h-[44px] items-center rounded-full bg-safeman-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-safeman-primary/90"
            >
              Start knowledge check
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const allChecked = checked.length === practicum.steps.length;
  const canSave = allChecked && assessorName.trim() && assessorRole.trim() && company.trim() && Boolean(signature);

  const toggle = (i: number) =>
    setChecked((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));

  const save = () => {
    if (!canSave) return;
    const record: PracticumSignoff = {
      courseId: course.id,
      assessorName: assessorName.trim(),
      assessorRole: assessorRole.trim(),
      company: company.trim(),
      stepsChecked: checked,
      signature,
      date: new Date().toISOString(),
    };
    setPracticumSignoff(record);
    setExisting(record);
    setSaved(true);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (saved || (mounted && existing && !saved)) {
    const shown = existing;
    return (
      <div className="space-y-5">
        <div aria-live="polite" className="rounded-3xl border border-safeman-hairline bg-safeman-callout p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-safeman-primary/10">
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-safeman-primary" fill="currentColor" aria-hidden="true">
                <path d="M9.55 17.05 4.9 12.4l1.4-1.4 3.25 3.24 8.15-8.15 1.4 1.42-9.55 9.54Z" />
              </svg>
            </span>
            <div>
              <h2 className="font-display text-2xl text-safeman-primary">Practicum signed off</h2>
              <p className="tnum mt-1 text-sm text-stone-700">
                Signed by {shown?.assessorName} ({shown?.assessorRole}, {shown?.company}) on{' '}
                {shown ? new Date(shown.date).toLocaleDateString() : ''}. The learner is now eligible
                for certificate issue.
              </p>
              <div className="mt-4 flex flex-wrap gap-2.5">
                <Link
                  href="/safeman/issue/"
                  className="inline-flex min-h-[44px] items-center rounded-full bg-safeman-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-safeman-primary/90"
                >
                  Issue certificate →
                </Link>
                <Link
                  href={`/safeman/course/${course.id}/`}
                  className="inline-flex min-h-[44px] items-center rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
                >
                  Back to course
                </Link>
              </div>
            </div>
          </div>
        </div>
        {shown?.signature ? (
          <div className="rounded-2xl border border-stone-200 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-stone-500">
              Stored signature
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={shown.signature}
              alt={`Signature of ${shown.assessorName}`}
              className="mt-2 h-24 w-auto rounded-lg border border-stone-200"
            />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-safeman-hairline bg-safeman-callout p-5 sm:p-6">
        <h2 className="font-display text-xl text-safeman-primary">{practicum.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-700">
          <strong>Pass standard:</strong> {practicum.pass_standard}
        </p>
      </div>

      <fieldset className="rounded-2xl border border-stone-200 bg-white p-5">
        <legend className="px-2 text-xs font-bold uppercase tracking-widest text-stone-500">
          Step-by-step illustrated checklist
        </legend>
        <ul className="space-y-2.5">
          {practicum.steps.map((step, i) => {
            const id = `step-${i}`;
            const on = checked.includes(i);
            return (
              <li key={i}>
                <label
                  htmlFor={id}
                  className={`flex min-h-[44px] cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3 transition-colors ${
                    on ? 'border-safeman-primary/50 bg-safeman-callout' : 'border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <input
                    id={id}
                    type="checkbox"
                    checked={on}
                    onChange={() => toggle(i)}
                    className="mt-0.5 h-5 w-5 shrink-0 accent-[#14532D]"
                  />
                  <span className="tnum text-sm leading-relaxed text-stone-800">
                    <strong className="mr-1.5 text-stone-500">{i + 1}.</strong>
                    {step}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
        <p className="tnum mt-3 text-xs font-medium text-stone-500">
          {checked.length}/{practicum.steps.length} steps verified
        </p>
      </fieldset>

      <div className="grid gap-4 rounded-2xl border border-stone-200 bg-white p-5 sm:grid-cols-3">
        <div className="sm:col-span-1">
          <label htmlFor="assessor-name" className="text-sm font-medium text-stone-700">
            Assessor name
          </label>
          <input
            id="assessor-name"
            type="text"
            value={assessorName}
            onChange={(e) => setAssessorName(e.target.value)}
            autoComplete="name"
            placeholder="e.g. T. Shipanga"
            className="mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm focus:border-safeman-primary focus:outline-2 focus:outline-safeman-primary/30"
          />
        </div>
        <div className="sm:col-span-1">
          <label htmlFor="assessor-role" className="text-sm font-medium text-stone-700">
            Role / qualification
          </label>
          <input
            id="assessor-role"
            type="text"
            value={assessorRole}
            onChange={(e) => setAssessorRole(e.target.value)}
            placeholder="e.g. HSE Officer · SAMTRAC"
            className="mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm focus:border-safeman-primary focus:outline-2 focus:outline-safeman-primary/30"
          />
        </div>
        <div className="sm:col-span-1">
          <label htmlFor="assessor-company" className="text-sm font-medium text-stone-700">
            Company
          </label>
          <input
            id="assessor-company"
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            autoComplete="organization"
            placeholder="e.g. Namib Construction (Pty) Ltd"
            className="mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm focus:border-safeman-primary focus:outline-2 focus:outline-safeman-primary/30"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <SignaturePad onChange={setSignature} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={!canSave}
          className="inline-flex min-h-[44px] items-center rounded-full bg-safeman-primary px-6 py-2.5 text-sm font-semibold text-white enabled:hover:bg-safeman-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Save practicum sign-off
        </button>
        {!canSave ? (
          <p className="text-xs text-stone-500">
            Complete every checklist step, the assessor fields and a signature to unlock.
          </p>
        ) : null}
      </div>
    </div>
  );
}
