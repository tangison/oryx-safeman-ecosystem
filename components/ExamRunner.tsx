"use client";

import { useEffect, useMemo, useState } from "react";
import type { ExamQuestion } from "@/lib/brand";

interface Props {
  questions: ExamQuestion[];
  minutes: number;
  courseCode: string;
  onResult: (passed: boolean, scorePct: number) => void;
}

const KEY_LETTERS = ["A", "B", "C", "D"];

function sample<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(((i + 1) * Math.imul(2654435761 ^ (i * 977 + Date.now() % 9973), 1)) >>> 33) % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(n, copy.length));
}

/** Timed MCQ exam (brief part 1): countdown clock, one question at a time,
 *  immediate feedback after submit, 80% pass mark enforced client-side. */
export function ExamRunner({ questions, minutes, courseCode, onResult }: Props) {
  const paper = useMemo(() => sample(questions, 8), [questions]);
  const passMark = Math.ceil(paper.length * 0.8);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>(Array(paper.length).fill(-1));
  const [started, setStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [left, setLeft] = useState(minutes * 60);

  useEffect(() => {
    if (!started || submitted) return;
    const t = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          setSubmitted(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [started, submitted]);

  const score = useMemo(() => {
    if (!submitted) return 0;
    return paper.reduce((acc, q, i) => acc + (answers[i] === q.a ? 1 : 0), 0);
  }, [submitted, answers, paper]);

  useEffect(() => {
    if (submitted) {
      const pct = Math.round((score / paper.length) * 100);
      onResult(score >= passMark, pct);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted]);

  if (!started) {
    return (
      <div className="reader-pane">
        <div className="eyebrow">TIMED EXAMINATION</div>
        <h2 className="serif">{courseCode} — Exam</h2>
        <p className="lead">
          {paper.length} multiple-choice questions · {minutes} minutes · pass mark {passMark}/{paper.length} (80%).
          The clock starts the moment you begin. Answer every question - unanswered items score zero.
        </p>
        <div className="pane-actions">
          <button className="btn btn-primary" onClick={() => setStarted(true)}>Start Timed Exam</button>
        </div>
      </div>
    );
  }

  if (submitted) {
    const pct = Math.round((score / paper.length) * 100);
    return (
      <div className="reader-pane">
        <div className="eyebrow">EXAMINATION RESULT</div>
        <div className={`result-banner ${score >= passMark ? "" : "fail"}`}>
          <h3>{score >= passMark ? "PASS - Competency Achieved" : "FAIL - Below Pass Mark"}</h3>
          <div className="serial-line"><b>{score}/{paper.length}</b> ({pct}%) · pass mark {passMark}/{paper.length}</div>
          {score >= passMark ? (
            <p className="course-desc" style={{ marginBottom: 0 }}>
              Proceed to the <b>Certificate</b> section to download your QR-verified credential and PVC pass.
            </p>
          ) : (
            <p className="course-desc" style={{ marginBottom: 0 }}>
              Review the module material and re-attempt. A new paper is drawn from the question bank each attempt.
            </p>
          )}
        </div>

        <div style={{ marginTop: 20 }}>
          {paper.map((q, i) => (
            <div key={i} style={{ marginBottom: 18 }}>
              <div style={{ fontWeight: 600, fontSize: "0.92rem", marginBottom: 6 }}>{i + 1}. {q.q}</div>
              {q.options.map((o, oi) => (
                <div
                  key={oi}
                  className={`quiz-opt ${oi === q.a ? "correct" : ""} ${answers[i] === oi && oi !== q.a ? "wrong" : ""}`}
                  style={{ padding: "8px 14px", marginBottom: 6 }}
                >
                  <span className="opt-key">{KEY_LETTERS[oi]}</span> {o}
                </div>
              ))}
              {q.why && <div className="quiz-why">{q.why}</div>}
            </div>
          ))}
        </div>
        <div className="pane-actions">
          <button className="btn btn-outline" onClick={() => window.location.reload()}>Exit Exam Review</button>
        </div>
      </div>
    );
  }

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  const q = paper[idx];

  return (
    <div className="reader-pane">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="eyebrow">{courseCode} — QUESTION {idx + 1} OF {paper.length}</div>
        <div className={`quiz-timer ${left < 60 ? "warn" : ""}`} role="timer">⏱ {mm}:{ss}</div>
      </div>
      <div className="quiz-progress"><div style={{ width: `${((idx + 1) / paper.length) * 100}%` }} /></div>
      <div className="quiz-q">{q.q}</div>

      {q.options.map((o, oi) => (
        <button
          key={oi}
          className={`quiz-opt ${answers[idx] === oi ? "selected" : ""}`}
          onClick={() => setAnswers((a) => a.map((v, i) => (i === idx ? oi : v)))}
        >
          <span className="opt-key">{KEY_LETTERS[oi]}</span> {o}
        </button>
      ))}

      <div className="pane-actions">
        <button className="btn btn-outline" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>Previous</button>
        {idx < paper.length - 1 ? (
          <button className="btn btn-primary" onClick={() => setIdx(idx + 1)}>Next</button>
        ) : (
          <button className="btn btn-primary" disabled={answers.includes(-1)} onClick={() => setSubmitted(true)}
            title={answers.includes(-1) ? "Answer every question first" : undefined}>
            Submit Paper
          </button>
        )}
      </div>
      {answers.includes(-1) && idx === paper.length - 1 && (
        <p className="form-hint">{answers.filter((v) => v === -1).length} question(s) unanswered.</p>
      )}
    </div>
  );
}
