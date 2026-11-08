export type Track = "academy" | "safeman";

export interface Course {
  code: string;
  level?: string;
  flag?: string;
  duration: string;
  notional?: string;
  tier?: string;
  title: string;
  desc: string;
  standards: string;
  category: string;
  plate: string;
  brand: Track;
}

export interface CatalogueBrand {
  brandMark: string;
  brandTitle: string;
  brandSub: string;
  eyebrow: string;
  headline: string;
  lead: string;
  courses: Course[];
}

export interface Catalogue {
  generated: string;
  academy: CatalogueBrand;
  safeman: CatalogueBrand;
}

export interface ReaderModule {
  id: string;
  title: string;
  summary: string;
  points: string[];
}

export interface ExamQuestion {
  q: string;
  options: string[];
  a: number;
  why?: string;
}

export interface Practicum {
  title: string;
  pass_rule: string;
  items: string[];
}

export interface PortalCourse {
  code: string;
  title: string;
  plate: string;
  modules: ReaderModule[];
  bank: ExamQuestion[];
  examMinutes: number;
  practicum: Practicum | null;
  simulator: "gas4" | null;
}

export interface PortalData {
  generated: string;
  academy: PortalCourse[];
  safeman: PortalCourse[];
}

export const ENROLL_EMAIL = "info@oryxinstitute.org";
export const FOUNDER_NAME = "Tangi Iigonda";
export const FOUNDER_TITLE = "Principal & Founder, Oryx Institute";
export const SITE_DATE = "2026-11";

/** SafeMan disclosure - contractual wording, never reword. */
export const SAFEMAN_DISCLOSURE =
  "Inter-organizational industry safety benchmark aligned with ISO 45001:2018, ISO 14001:2015, ISO 31000, and pre-referenced to NTA Unit Standards & Namibian GN 156 of 1997 (Non-NQA statutory credit).";

export async function loadCatalogue(): Promise<Catalogue> {
  const r = await fetch("/data/courses.json");
  return r.json();
}

export async function loadPortal(): Promise<PortalData> {
  const r = await fetch("/data/portal.json");
  return r.json();
}

export function serialFor(track: Track, seed: string): string {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const n = (h >>> 0) % 9000 + 1000;
  return track === "safeman" ? `SM-2026-${n}` : `ORYX-2026-${n}`;
}
