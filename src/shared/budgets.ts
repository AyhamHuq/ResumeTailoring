import { SECTION_BUDGETS } from "./constants";
import type { GeneratedBullet, GeneratedResume, JobId, ResumeFitReport, ResumeProfile } from "./schemas";

const ESTIMATED_CHARS_PER_LINE = 92;

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

type FitBudget = {
  page?: {
    targetEstimatedLines?: number;
    targetMinFillPercent?: number;
    targetMaxFillPercent?: number;
    hardMaxEstimatedLines?: number;
    minTotalBullets?: number;
  };
};

function paragraphLines(text: string | undefined): number {
  return estimateLines(text ?? "");
}

function bulletLines(bullets: GeneratedBullet[]): number {
  return bullets.reduce((total, bullet) => {
    const estimated = Math.max(estimateLines(bullet.text), bullet.estimated_lines ?? 0);
    return total + estimated;
  }, 0);
}

export function calculateResumeFitReport(
  resume: GeneratedResume,
  profile?: Pick<ResumeProfile, "education" | "certifications" | "employers" | "allowed_projects">,
  budgets: FitBudget = SECTION_BUDGETS
): ResumeFitReport {
  const pageBudget = {
    targetEstimatedLines: budgets.page?.targetEstimatedLines ?? SECTION_BUDGETS.page.targetEstimatedLines,
    targetMinFillPercent: budgets.page?.targetMinFillPercent ?? SECTION_BUDGETS.page.targetMinFillPercent,
    targetMaxFillPercent: budgets.page?.targetMaxFillPercent ?? SECTION_BUDGETS.page.targetMaxFillPercent,
    hardMaxEstimatedLines: budgets.page?.hardMaxEstimatedLines ?? SECTION_BUDGETS.page.hardMaxEstimatedLines
  };
  const targetMinLines = Math.ceil(pageBudget.targetEstimatedLines * (pageBudget.targetMinFillPercent / 100));
  const targetMaxLines = Math.floor(pageBudget.targetEstimatedLines * (pageBudget.targetMaxFillPercent / 100));
  const educationLines = Math.max(1, (profile?.education.length ?? 1) * 3);
  const certificationLines = Math.max(1, profile?.certifications.length ?? 2);
  const workBullets = resume.work_experience.reduce((total, job) => total + job.bullets.length, 0);
  const projectBullets = resume.projects.reduce((total, project) => total + project.bullets.length, 0);

  let estimatedLines = 3; // name, contact, and compact header spacing.
  estimatedLines += 2 + educationLines;
  estimatedLines += 2 + resume.work_experience.reduce((total, job, index) => {
    const jobGap = index < resume.work_experience.length - 1 ? 1 : 0;
    return total + 2 + bulletLines(job.bullets) + jobGap;
  }, 0);
  estimatedLines += 2 + paragraphLines(resume.skills.join(" | "));
  estimatedLines += 2 + Math.max(1, resume.projects.reduce((total, project) => total + 1 + bulletLines(project.bullets), 0));
  estimatedLines += 2 + certificationLines;

  const estimatedFillPercent = Math.round((estimatedLines / pageBudget.targetEstimatedLines) * 100);
  const status = estimatedLines > pageBudget.hardMaxEstimatedLines
    ? "over_hard_max"
    : estimatedLines < targetMinLines
      ? "under_target"
      : estimatedLines <= targetMaxLines
        ? "target"
        : "over_target";

  return {
    estimated_lines: estimatedLines,
    target_min_lines: targetMinLines,
    target_max_lines: targetMaxLines,
    hard_max_lines: pageBudget.hardMaxEstimatedLines,
    estimated_fill_percent: estimatedFillPercent,
    total_bullets: workBullets + projectBullets,
    work_bullets: workBullets,
    project_bullets: projectBullets,
    status
  };
}

export { SECTION_BUDGETS };
