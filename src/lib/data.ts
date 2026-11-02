/**
 * Typed access to the two static data assets shipped in /public/data.
 * Imported directly (bundled at build time) so the site stays a pure
 * static export with zero runtime data fetches.
 */
import safemanRaw from '../../public/data/safeman_courses.json';
import oryxRaw from '../../public/data/oryx_nqf_levels.json';

/* ------------------------------------------------------------------ */
/* SafeMan — courses                                                   */
/* ------------------------------------------------------------------ */

export interface SafeManQuizItem {
  q: string;
  o: string[];
  a: number;
  why: string;
}

export interface SafeManModule {
  id: string;
  title: string;
  focus: string;
  diagram: string;
  video_demo_url: string | null;
  keypoints: string[];
}

export interface SafeManPracticum {
  title: string;
  pass_standard: string;
  steps: string[];
}

export interface SafeManCourse {
  id: string;
  title: string;
  subtitle: string;
  pass_mark: number;
  questions_in_exam: number;
  requires_practicum: boolean;
  standards: string[];
  cert_validity_months: number;
  video_demo_url: string | null;
  diagram: string;
  manual: string;
  modules: SafeManModule[];
  quiz: SafeManQuizItem[];
  practicum: SafeManPracticum | null;
}

export interface SafeManSystem {
  brand: string;
  owner: string;
  domain: string;
  disclosure: string;
  contact: string;
  cert_validity_months_default: number;
  serial_format: string;
  qr_payload_keys: Record<string, string>;
}

export const SAFEMAN_SYSTEM = safemanRaw.system as SafeManSystem;
export const SAFEMAN_COURSES = safemanRaw.courses as unknown as SafeManCourse[];

export function getCourse(id: string): SafeManCourse | undefined {
  return SAFEMAN_COURSES.find((c) => c.id === id);
}

/** Course code used inside serials: "SM-FIRE" -> "FIRE". */
export function courseCode(id: string): string {
  return (id.split('-')[1] ?? id).toUpperCase();
}

export const SAFEMAN_COURSE_IDS = SAFEMAN_COURSES.map((c) => c.id);

/* ------------------------------------------------------------------ */
/* Oryx Institute — NQF levels                                         */
/* ------------------------------------------------------------------ */

export interface OryxModule {
  id: string;
  title: string;
  nta_ref: string;
  focus: string;
}

export interface OryxLevel {
  level: number;
  title: string;
  duration: string;
  credits: number;
  entry: string | null;
  nta_anchors: string[];
  theme: string;
  manual: string;
  assessment_pack: string;
  status: string;
  modules: OryxModule[];
  assessment: string;
}

export interface OryxSystem {
  brand: string;
  domain: string;
  contact: string;
  disclosure: string;
  certificate_types: string[];
  founder: string;
}

export const ORYX_SYSTEM = oryxRaw.system as OryxSystem;
export const ORYX_LEVELS = oryxRaw.levels as unknown as OryxLevel[];

/**
 * Normalise an NTA / statutory anchor string into a short matrix column label.
 * Pure string transform — nothing is hardcoded beyond the regex families that
 * actually occur in the dataset.
 */
export function normalizeAnchor(anchor: string): string {
  const ntaIds = anchor.match(/NTA\s*Unit\s*Standard\s*IDs?\s+([\d,\s]+)/i);
  if (ntaIds) {
    const nums = ntaIds[1]
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter((s) => /^\d+$/.test(s));
    if (nums.length > 0) {
      return `NTA US ${nums[0]}${nums.length > 1 ? ` +${nums.length - 1}` : ''}`;
    }
  }
  if (/GN\s*156/i.test(anchor)) return 'GN 156/1997';
  if (/Labour Act\s*11/i.test(anchor)) return 'Labour Act 11/2007';
  if (/Atomic Energy/i.test(anchor)) return 'NRPA Act 5/2005';
  if (/Environmental Management Act\s*7/i.test(anchor)) return 'EMA 7/2007';
  return anchor.length > 18 ? `${anchor.slice(0, 15)}…` : anchor;
}

/** Distinct matrix columns, ordered by first appearance across levels 1→7. */
export function ntaMatrixColumns(): string[] {
  const cols: string[] = [];
  for (const lv of ORYX_LEVELS) {
    for (const a of lv.nta_anchors) {
      const label = normalizeAnchor(a);
      if (!cols.includes(label)) cols.push(label);
    }
  }
  return cols;
}

/** level -> Set of normalized anchor labels it is aligned to. */
export function ntaMatrixRows(): { level: OryxLevel; anchors: Set<string> }[] {
  return ORYX_LEVELS.map((lv) => ({
    level: lv,
    anchors: new Set(lv.nta_anchors.map(normalizeAnchor)),
  }));
}
