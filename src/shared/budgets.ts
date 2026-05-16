import { SECTION_BUDGETS } from "./constants";
import type { GeneratedBullet, JobId } from "./schemas";

const ESTIMATED_CHARS_PER_LINE = 104;

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function estimateLines(text: string): number {
  return Math.max(1, Math.ceil(text.length / ESTIMATED_CHARS_PER_LINE));
}

export function withBulletCounts<T extends GeneratedBullet>(bullet: T): T {
  return {
    ...bullet,
    word_count: countWords(bullet.text),
    char_count: bullet.text.length,
    estimated_lines: estimateLines(bullet.text)
  };
}

export function getWorkBulletBudget(jobId: JobId): { minBullets: number; maxBullets: number } {
  return SECTION_BUDGETS.workExperience[jobId];
}

export { SECTION_BUDGETS };
