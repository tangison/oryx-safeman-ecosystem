'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { SafeManCourse } from '@/lib/data';
import { buildExam, gradeExam } from '@/lib/quiz';
import { getQuizResult, setQuizResult, type QuizResult } from '@/lib/storage';

const LETTERS = ['A', 'B', 'C', 'D'];

export default function QuizRunner({ course }: { course: SafeManCourse }) {
  const exam = useMemo(() => buildExam(course), [course]);
  const [answers, setAnswers] = useState<(number | null)[]>(() => exam.map(() => null));
  const [idx, setIdx] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [previous] = useState<QuizResult | null>(() =>
    typeof window === 'undefined' ? null : getQuizResult(course.id),
  );

  const answered = answers.filter((a) => a !== null).length;
  const item = exam[idx];

  const choose = (option: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[idx] = option;
      return next;
    });
  };

  const submit = () => {
    const graded = gradeExam(exam, answers, course.pass_mark);
    const record: QuizResult = {
      courseId: course.id,
      score: graded.score,
      total: graded.total,
      percent: graded.percent,
      passed: graded.passed,
      date: new Date().toISOString(),
    };
    setQuizResult(record);
    setResult(record);
    setSubmitted(true);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const retake = () => {
    setAnswers(exam.map(() => null));
    setIdx(0);
    setSubmitted(false);
    setResult(null);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ------------------------------ graded view ----------------------------- */
  if (submitted && result) {
    const nextStep = course.requires_practicum ? (
      <Link
        href={`/safeman/course/${course.id}/practicum/`}
        className="inline-flex min-h-[44px] items-center rounded-full bg-safeman-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-safeman-primary/90"
      >
        Continue to practicum sign-off →
      </Link>
    ) : (
      <Link
        href="/safeman/issue/"
        className="inline-flex min-h-[44px] items-center rounded-full bg-safeman-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-safeman-primary/90"
      >
        Issue certificate →
      </Link>
    );

    return (
      <div className="space-y-6">
        <div
          aria-live="polite"
          className={`rounded-3xl border p-6 sm:p-8 ${
            result.passed
              ? 'border-safeman-hairline bg-safeman-callout'
              : 'border-red-200 bg-red-50'
          }`}
        >
          <div className="flex flex-wrap items-center gap-4">
            <span
              className={`tnum flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white ${
                result.passed ? 'bg-safeman-primary' : 'bg-red-600'
              }`}
            >
              {result.percent}%
            </span>
            <div>
              <h2
                className={`font-display text-2xl ${result.passed ? 'text-safeman-primary' : 'text-red-700'}`}
              >
                {result.passed ? 'Knowledge check passed' : 'Not passed this time'}
              </h2>
              <p className="tnum mt-1 text-sm text-stone-600">
                {result.score} of {result.total} correct · pass mark {course.pass_mark}% ·{' '}
                {new Date(result.date).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2.5">
            {result.passed ? (
              nextStep
            ) : (
              <p className="text-sm text-stone-600">
                Review the module key points below, then retake the check — the paper is fixed for
                this course, so revisit the modules before trying again.
              </p>
            )}
            <Link
              href={`/safeman/course/${course.id}/`}
              className="inline-flex min-h-[44px] items-center rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Back to course
            </Link>
            <button
              type="button"
              onClick={retake}
              className="inline-flex min-h-[44px] items-center rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Retake check
            </button>
          </div>
        </div>

        <section aria-label="Answer review" className="space-y-3">
          <h3 className="font-display text-xl text-stone-900">Answer review</h3>
          {exam.map((q, i) => {
            const picked = answers[i];
            const correct = picked === q.a;
            return (
              <article
                key={i}
                className={`rounded-2xl border bg-white p-4 sm:p-5 ${
                  correct ? 'border-safeman-hairline' : 'border-red-200'
                }`}
              >
                <p className="tnum text-xs font-bold uppercase tracking-widest text-stone-400">
                  Question {i + 1} {correct ? '· correct' : '· incorrect'}
                </p>
                <p className="mt-1 font-medium text-stone-900">{q.q}</p>
                <ul className="mt-2 space-y-1 text-sm">
                  {q.o.map((opt, oi) => (
                    <li
                      key={oi}
                      className={`flex items-start gap-2 rounded-lg px-2.5 py-1.5 ${
                        oi === q.a
                          ? 'bg-green-50 font-semibold text-safeman-primary'
                          : oi === picked
                            ? 'bg-red-50 text-red-700 line-through'
                            : 'text-stone-600'
                      }`}
                    >
                      <span className="tnum text-xs font-bold">{LETTERS[oi]}</span>
                      <span>{opt}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 rounded-lg bg-oryx-callout px-3 py-2 text-xs leading-relaxed text-stone-700">
                  <strong>Why:</strong> {q.why}
                </p>
              </article>
            );
          })}
        </section>
      </div>
    );
  }

  /* ------------------------------ exam view ------------------------------ */
  return (
    <div className="space-y-5">
      {previous?.passed ? (
        <p className="rounded-xl border border-safeman-hairline bg-safeman-callout px-4 py-3 text-sm text-stone-700">
          You already passed this check on {new Date(previous.date).toLocaleDateString()} (
          <span className="tnum">{previous.percent}%</span>). A new attempt overwrites the stored
          result.
        </p>
      ) : null}

      <div className="sticky top-[68px] z-10 -mx-1 rounded-2xl border border-safeman-hairline bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between text-xs font-semibold text-stone-500">
          <span className="tnum">
            Question {idx + 1} of {exam.length}
          </span>
          <span className="tnum">
            {answered}/{exam.length} answered · pass {course.pass_mark}%
          </span>
        </div>
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-200"
          role="progressbar"
          aria-valuenow={answered}
          aria-valuemin={0}
          aria-valuemax={exam.length}
        >
          <div
            className="h-full rounded-full bg-safeman-primary transition-all"
            style={{ width: `${(answered / exam.length) * 100}%` }}
          />
        </div>
      </div>

      <article className="rounded-3xl border border-safeman-hairline bg-white p-5 shadow-sm sm:p-7">
        <h2 className="font-display text-xl leading-snug text-stone-900 sm:text-2xl">{item.q}</h2>
        <fieldset className="mt-5">
          <legend className="sr-only">Choose one answer</legend>
          <div className="space-y-2.5">
            {item.o.map((opt, oi) => {
              const selected = answers[idx] === oi;
              return (
                <button
                  key={oi}
                  type="button"
                  onClick={() => choose(oi)}
                  aria-pressed={selected}
                  className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors min-h-[44px] ${
                    selected
                      ? 'border-safeman-primary bg-safeman-callout font-semibold text-safeman-primary'
                      : 'border-stone-200 bg-white text-stone-700 hover:border-safeman-hairline hover:bg-stone-50'
                  }`}
                >
                  <span
                    className={`tnum flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      selected ? 'bg-safeman-primary text-white' : 'bg-stone-100 text-stone-500'
                    }`}
                  >
                    {LETTERS[oi]}
                  </span>
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIdx((v) => Math.max(0, v - 1))}
            disabled={idx === 0}
            className="inline-flex min-h-[44px] items-center rounded-full border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 enabled:hover:bg-stone-50 disabled:opacity-40"
          >
            ← Previous
          </button>

          {idx < exam.length - 1 ? (
            <button
              type="button"
              onClick={() => setIdx((v) => Math.min(exam.length - 1, v + 1))}
              className="inline-flex min-h-[44px] items-center rounded-full bg-safeman-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-safeman-primary/90"
            >
              Next →
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={answered < exam.length}
              className="inline-flex min-h-[44px] items-center rounded-full bg-safeman-primary px-5 py-2.5 text-sm font-semibold text-white enabled:hover:bg-safeman-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Submit for grading
            </button>
          )}
        </div>
      </article>

      <p className="text-center text-xs text-stone-500">
        Grading is instant and fully on-device. Your score is stored only in this browser&apos;s
        learner profile.
      </p>
    </div>
  );
}
