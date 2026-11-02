/**
 * localStorage persistence for the SafeMan learner journey.
 * All keys are namespaced. Every accessor is SSR-safe (returns defaults
 * when window is unavailable) and failure-tolerant (private-mode browsers).
 */
import type { SafeManCourse } from './data';

const K = {
  profile: 'safeman:profile',
  quiz: (courseId: string) => `safeman:quiz:${courseId}`,
  practicum: (courseId: string) => `safeman:practicum:${courseId}`,
  ledger: 'safeman:ledger',
  bumpLog: 'oryx:lab:bumptests',
} as const;

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full / disabled — non-fatal */
  }
}

/* ----------------------------- profile ------------------------------ */

export interface LearnerProfile {
  fullName: string;
  idNumber: string;
  company: string;
}

export const EMPTY_PROFILE: LearnerProfile = { fullName: '', idNumber: '', company: '' };

export function getProfile(): LearnerProfile {
  return { ...EMPTY_PROFILE, ...readJson<Partial<LearnerProfile>>(K.profile, {}) };
}

export function saveProfile(profile: LearnerProfile): void {
  writeJson(K.profile, profile);
}

/* --------------------------- quiz results --------------------------- */

export interface QuizResult {
  courseId: string;
  score: number;
  total: number;
  percent: number;
  passed: boolean;
  date: string; // ISO
}

export function getQuizResult(courseId: string): QuizResult | null {
  return readJson<QuizResult | null>(K.quiz(courseId), null);
}

export function setQuizResult(result: QuizResult): void {
  writeJson(K.quiz(result.courseId), result);
}

/* ------------------------ practicum sign-offs ----------------------- */

export interface PracticumSignoff {
  courseId: string;
  assessorName: string;
  assessorRole: string;
  company: string;
  stepsChecked: number[];
  signature: string; // PNG data URL
  date: string; // ISO
}

export function getPracticumSignoff(courseId: string): PracticumSignoff | null {
  return readJson<PracticumSignoff | null>(K.practicum(courseId), null);
}

export function setPracticumSignoff(signoff: PracticumSignoff): void {
  writeJson(K.practicum(signoff.courseId), signoff);
}

/* ------------------------ certificate ledger ------------------------ */

export interface CertRecord {
  serial: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  name: string;
  idMasked: string;
  company: string;
  standards: string[];
  issued: string; // ISO date
  expires: string; // ISO date
  d: string; // base64url payload
  sig: string; // 16-hex signature
}

export function getLedger(): CertRecord[] {
  return readJson<CertRecord[]>(K.ledger, []);
}

export function addToLedger(record: CertRecord): void {
  const ledger = getLedger();
  ledger.push(record);
  writeJson(K.ledger, ledger);
}

/** Next 5-digit sequence number for a course code, based on the local ledger. */
export function nextSeqForCode(courseCode: string): number {
  const n = getLedger().filter((r) => r.courseCode === courseCode.toUpperCase()).length;
  return n + 1;
}

/* --------------------------- eligibility ---------------------------- */

export type Eligibility =
  | { eligible: true }
  | { eligible: false; reason: string };

export function checkEligibility(course: SafeManCourse): Eligibility {
  const quiz = getQuizResult(course.id);
  if (!quiz || !quiz.passed) {
    return {
      eligible: false,
      reason: `Knowledge check not passed yet (needs ${course.pass_mark}%)`,
    };
  }
  if (course.requires_practicum) {
    const prac = getPracticumSignoff(course.id);
    if (!prac) {
      return { eligible: false, reason: 'Practicum sign-off outstanding' };
    }
  }
  return { eligible: true };
}

/** All active (non-expired) tickets from the local ledger, newest first. */
export function getActiveTickets(): CertRecord[] {
  const now = new Date().toISOString().slice(0, 10);
  return getLedger()
    .filter((r) => r.expires >= now)
    .sort((a, b) => (a.issued < b.issued ? 1 : -1));
}

/* ------------------------- lab bump-test log ------------------------ */

export interface BumpLogEntry {
  date: string; // ISO
  result: 'PASS' | 'FAIL';
  detail: string;
}

export function getBumpLog(): BumpLogEntry[] {
  return readJson<BumpLogEntry[]>(K.bumpLog, []);
}

export function addBumpEntry(entry: BumpLogEntry): void {
  const log = getBumpLog();
  log.unshift(entry);
  writeJson(K.bumpLog, log.slice(0, 10));
}
