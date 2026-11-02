/**
 * Deterministic exam sampling: the same course id always yields the same
 * question order (seeded Fisher–Yates), so learner evidence is reproducible.
 */
import type { SafeManCourse, SafeManQuizItem } from './data';

/** FNV-1a 32-bit string hash. */
export function hashSeed(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Mulberry32 PRNG — small, fast, seedable. */
export function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return function next() {
    t = (t + 0x6d2b79f5) >>> 0;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  const rand = mulberry32(hashSeed(seed));
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** The fixed paper for a course: `questions_in_exam` items, seeded by course id. */
export function buildExam(course: SafeManCourse): SafeManQuizItem[] {
  const shuffled = seededShuffle(course.quiz, `${course.id}:exam`);
  return shuffled.slice(0, Math.min(course.questions_in_exam, course.quiz.length));
}

export function gradeExam(
  exam: SafeManQuizItem[],
  answers: (number | null)[],
  passMarkPercent: number,
): { score: number; total: number; percent: number; passed: boolean } {
  let score = 0;
  exam.forEach((item, i) => {
    if (answers[i] === item.a) score += 1;
  });
  const total = exam.length;
  const percent = total > 0 ? Math.round((score / total) * 100) : 0;
  return { score, total, percent, passed: percent >= passMarkPercent };
}
