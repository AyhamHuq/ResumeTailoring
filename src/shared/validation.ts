import { JOB_IDS, PROJECT_IDS, SECTION_BUDGETS } from "./constants";
import { calculateResumeFitReport, countWords, estimateLines } from "./budgets";
import { evidenceSupportsClaim } from "./keywords";
import { isDisallowedStandaloneSkill } from "./skills";
import {
  GeneratedResumeSchema,
  type EvidenceCard,
  type GeneratedResume,
  type ResumeFitReport,
  type ResumeProfile,
  type ValidationIssue
} from "./schemas";
import type { JobId, ProjectId } from "./schemas";

type BudgetContext = {
  bullet?: {
    maxWords?: number;
    maxCharacters?: number;
    maxEstimatedLines?: number;
  };
  workExperience?: Partial<Record<JobId, number | { minBullets?: number; maxBullets?: number }>>;
  projects?: {
    min?: number;
    max?: number;
    minProjects?: number;
    maxProjects?: number;
    minTotalBullets?: number;
    maxTotalBullets?: number;
    bulletsPerProject?: { minBullets?: number; maxBullets?: number };
  };
  skills?: {
    maxCharacters?: number;
    maxEstimatedLines?: number;
    maxItems?: number;
  };
  page?: {
    targetEstimatedLines?: number;
    targetMinFillPercent?: number;
    targetMaxFillPercent?: number;
    hardMaxEstimatedLines?: number;
    minTotalBullets?: number;
  };
};

type ValidationContext = {
  evidenceCards: EvidenceCard[];
  profile?: ResumeProfile;
  allowedProjectIds?: ProjectId[];
  allowedJobIds?: JobId[];
  budgets?: BudgetContext;
  unsupportedTerms?: string[];
};

export type GeneratedResumeValidationResult = {
  success: boolean;
  valid: boolean;
  resume?: GeneratedResume;
  fit_report?: ResumeFitReport;
  issues: ValidationIssue[];
};

function issue(code: string, path: string, message: string): ValidationIssue {
  return { code, path, message, severity: "error" };
}

function includesTerm(text: string, term: string): boolean {
  const escaped = term.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9+#])${escaped}([^a-z0-9+#]|$)`, "i").test(text);
}

function normalizeContext(
  evidenceCardsOrContext: EvidenceCard[] | ValidationContext,
  profile?: ResumeProfile,
  unsupportedTerms: string[] = [],
  allowedProjectIds?: ProjectId[]
): ValidationContext {
  if (Array.isArray(evidenceCardsOrContext)) {
    return {
      evidenceCards: evidenceCardsOrContext,
      profile,
      unsupportedTerms,
      allowedProjectIds
    };
  }

  return evidenceCardsOrContext;
}

function getBulletBudget(context: ValidationContext) {
  return {
    maxWords: context.budgets?.bullet?.maxWords ?? SECTION_BUDGETS.bullet.maxWords,
    maxCharacters: context.budgets?.bullet?.maxCharacters ?? SECTION_BUDGETS.bullet.maxCharacters,
    maxEstimatedLines: context.budgets?.bullet?.maxEstimatedLines ?? SECTION_BUDGETS.bullet.maxEstimatedLines
  };
}

function getWorkBudget(jobId: JobId, context: ValidationContext): { minBullets: number; maxBullets: number } {
  const override = context.budgets?.workExperience?.[jobId];
  if (typeof override === "number") {
    return { minBullets: 1, maxBullets: override };
  }
  if (override) {
    return {
      minBullets: override.minBullets ?? SECTION_BUDGETS.workExperience[jobId].minBullets,
      maxBullets: override.maxBullets ?? SECTION_BUDGETS.workExperience[jobId].maxBullets
    };
  }
  return SECTION_BUDGETS.workExperience[jobId];
}

function getProjectBudget(context: ValidationContext) {
  return {
    minProjects: context.budgets?.projects?.minProjects ?? context.budgets?.projects?.min ?? SECTION_BUDGETS.projects.minProjects,
    maxProjects: context.budgets?.projects?.maxProjects ?? context.budgets?.projects?.max ?? SECTION_BUDGETS.projects.maxProjects,
    minTotalBullets: context.budgets?.projects?.minTotalBullets ?? SECTION_BUDGETS.projects.minTotalBullets,
    maxTotalBullets: context.budgets?.projects?.maxTotalBullets ?? SECTION_BUDGETS.projects.maxTotalBullets,
    bulletsPerProject: {
      minBullets: context.budgets?.projects?.bulletsPerProject?.minBullets ?? SECTION_BUDGETS.projects.bulletsPerProject.minBullets,
      maxBullets: context.budgets?.projects?.bulletsPerProject?.maxBullets ?? SECTION_BUDGETS.projects.bulletsPerProject.maxBullets
    }
  };
}

function getPageBudget(context: ValidationContext) {
  return {
    targetEstimatedLines: context.budgets?.page?.targetEstimatedLines ?? SECTION_BUDGETS.page.targetEstimatedLines,
    targetMinFillPercent: context.budgets?.page?.targetMinFillPercent ?? SECTION_BUDGETS.page.targetMinFillPercent,
    targetMaxFillPercent: context.budgets?.page?.targetMaxFillPercent ?? SECTION_BUDGETS.page.targetMaxFillPercent,
    hardMaxEstimatedLines: context.budgets?.page?.hardMaxEstimatedLines ?? SECTION_BUDGETS.page.hardMaxEstimatedLines,
    minTotalBullets: context.budgets?.page?.minTotalBullets ?? SECTION_BUDGETS.page.minTotalBullets
  };
}

function validateBullet(
  bullet: { text: string; evidence_refs: string[]; word_count?: number; char_count?: number; estimated_lines?: number },
  path: string,
  evidenceIds: Set<string>,
  issues: ValidationIssue[],
  context: ValidationContext
): void {
  for (const ref of bullet.evidence_refs) {
    if (!evidenceIds.has(ref)) {
      issues.push(issue("invalid_evidence_ref", `${path}.evidence_refs`, `Evidence ref '${ref}' does not exist.`));
    }
  }

  const budget = getBulletBudget(context);
  const words = Math.max(countWords(bullet.text), bullet.word_count ?? 0);
  const chars = Math.max(bullet.text.length, bullet.char_count ?? 0);
  const lines = Math.max(estimateLines(bullet.text), bullet.estimated_lines ?? 0);
  if (words > budget.maxWords) {
    issues.push(issue("bullet_over_word_budget", path, `Bullet has ${words} words; max is ${budget.maxWords}.`));
  }
  if (chars > budget.maxCharacters) {
    issues.push(issue("bullet_over_character_budget", path, `Bullet has ${chars} characters; max is ${budget.maxCharacters}.`));
  }
  if (lines > budget.maxEstimatedLines) {
    issues.push(issue("bullet_over_line_budget", path, `Bullet estimates to ${lines} lines; max is ${budget.maxEstimatedLines}.`));
  }
}

function collectUnsupportedTerms(candidate: unknown, context: ValidationContext): string[] {
  const fromContext = context.unsupportedTerms ?? [];
  if (!candidate || typeof candidate !== "object") {
    return fromContext;
  }

  const record = candidate as {
    unsupported_terms?: unknown;
    keyword_report?: { unsupported?: unknown };
  };

  const fromResume = Array.isArray(record.unsupported_terms) ? record.unsupported_terms : [];
  const fromReport = Array.isArray(record.keyword_report?.unsupported) ? record.keyword_report?.unsupported : [];
  return [...new Set([...fromContext, ...fromResume, ...fromReport].filter((term): term is string => typeof term === "string"))];
}

export function validateGeneratedResume(
  candidate: unknown,
  evidenceCardsOrContext: EvidenceCard[] | ValidationContext,
  profile?: ResumeProfile,
  unsupportedTerms: string[] = [],
  allowedProjectIds?: ProjectId[]
): GeneratedResumeValidationResult {
  const context = normalizeContext(evidenceCardsOrContext, profile, unsupportedTerms, allowedProjectIds);
  const parsed = GeneratedResumeSchema.safeParse(candidate);
  const issues: ValidationIssue[] = [];
  if (!parsed.success) {
    for (const zodIssue of parsed.error.issues) {
      issues.push(issue("schema_error", zodIssue.path.join(".") || "$", zodIssue.message));
    }
    return { success: false, valid: false, issues };
  }

  const resume = parsed.data;
  const evidenceIds = new Set(context.evidenceCards.map((card) => card.id));
  const allowedJobs = new Set<JobId>(context.allowedJobIds ?? context.profile?.employers.map((employer) => employer.job_id) ?? JOB_IDS);
  const allowedProjects = new Set<ProjectId>(
    context.allowedProjectIds ?? context.profile?.allowed_projects.map((project) => project.project_id) ?? PROJECT_IDS
  );
  const jobsById = new Map(resume.work_experience.map((job) => [job.job_id, job]));

  for (const jobId of allowedJobs) {
    if (!jobsById.has(jobId)) {
      issues.push(issue("missing_work_experience", "work_experience", `Missing required work experience '${jobId}'.`));
    }
  }

  resume.work_experience.forEach((job, jobIndex) => {
    if (!allowedJobs.has(job.job_id)) {
      issues.push(issue("invalid_job_id", `work_experience.${jobIndex}.job_id`, `Invalid job id '${job.job_id}'.`));
      return;
    }
    const budget = getWorkBudget(job.job_id, context);
    if (job.bullets.length < budget.minBullets) {
      issues.push(issue("job_under_min_bullets", `work_experience.${jobIndex}.bullets`, `${job.job_id} needs at least ${budget.minBullets} bullets to fill the page.`));
    }
    if (job.bullets.length > budget.maxBullets) {
      issues.push(issue("job_over_max_bullets", `work_experience.${jobIndex}.bullets`, `${job.job_id} allows at most ${budget.maxBullets} bullets.`));
    }
    job.bullets.forEach((bullet, bulletIndex) => validateBullet(bullet, `work_experience.${jobIndex}.bullets.${bulletIndex}`, evidenceIds, issues, context));
  });

  const projectBudget = getProjectBudget(context);
  if (resume.projects.length < projectBudget.minProjects) {
    issues.push(issue("project_count", "projects", `Projects section requires at least ${projectBudget.minProjects} project.`));
  }
  if (resume.projects.length > projectBudget.maxProjects) {
    issues.push(issue("project_count", "projects", `Projects section allows at most ${projectBudget.maxProjects} projects.`));
  }

  const totalProjectBullets = resume.projects.reduce((total, project) => total + project.bullets.length, 0);
  if (totalProjectBullets < projectBudget.minTotalBullets) {
    issues.push(issue("project_under_min_bullets", "projects", `Projects need at least ${projectBudget.minTotalBullets} total bullets to use the page well.`));
  }
  if (totalProjectBullets > projectBudget.maxTotalBullets) {
    issues.push(issue("project_over_max_bullets", "projects", `Projects allow at most ${projectBudget.maxTotalBullets} total bullets.`));
  }

  resume.projects.forEach((project, projectIndex) => {
    if (!allowedProjects.has(project.project_id)) {
      issues.push(issue("invalid_project_id", `projects.${projectIndex}.project_id`, `Invalid project id '${project.project_id}'.`));
    }
    if (project.bullets.length < projectBudget.bulletsPerProject.minBullets) {
      issues.push(issue("project_under_min_bullets", `projects.${projectIndex}.bullets`, `Each selected project needs at least ${projectBudget.bulletsPerProject.minBullets} bullet.`));
    }
    if (project.bullets.length > projectBudget.bulletsPerProject.maxBullets) {
      issues.push(issue("project_over_max_bullets", `projects.${projectIndex}.bullets`, `Each selected project allows at most ${projectBudget.bulletsPerProject.maxBullets} bullets.`));
    }
    project.bullets.forEach((bullet, bulletIndex) => validateBullet(bullet, `projects.${projectIndex}.bullets.${bulletIndex}`, evidenceIds, issues, context));
    project.alternates.forEach((alternate, alternateIndex) => {
      if (!allowedProjects.has(alternate)) {
        issues.push(issue("invalid_alternate_project_id", `projects.${projectIndex}.alternates.${alternateIndex}`, `Invalid alternate project id '${alternate}'.`));
      }
    });
  });

  const skillText = resume.skills.join(", ");
  const skillsBudget = {
    maxCharacters: context.budgets?.skills?.maxCharacters ?? SECTION_BUDGETS.skills.maxCharacters,
    maxEstimatedLines: context.budgets?.skills?.maxEstimatedLines ?? SECTION_BUDGETS.skills.maxEstimatedLines,
    maxItems: context.budgets?.skills?.maxItems ?? SECTION_BUDGETS.skills.maxItems
  };
  if (skillText.length > skillsBudget.maxCharacters) {
    issues.push(issue("skills_over_character_budget", "skills", `Skills section has ${skillText.length} characters; max is ${skillsBudget.maxCharacters}.`));
  }
  if (estimateLines(skillText) > skillsBudget.maxEstimatedLines) {
    issues.push(issue("skills_over_line_budget", "skills", `Skills section exceeds ${skillsBudget.maxEstimatedLines} estimated lines.`));
  }
  if (resume.skills.length > skillsBudget.maxItems) {
    issues.push(issue("skills_over_item_budget", "skills", `Skills section has ${resume.skills.length} items; max is ${skillsBudget.maxItems}.`));
  }
  resume.skills.forEach((skill, skillIndex) => {
    if (isDisallowedStandaloneSkill(skill)) {
      issues.push(issue("disallowed_generic_skill", `skills.${skillIndex}`, `Skill '${skill}' should be covered through specific tools or bullets instead of listed as a standalone skill.`));
    }
  });

  const claimText = [
    skillText,
    ...resume.work_experience.flatMap((job) => job.bullets.map((bullet) => bullet.text)),
    ...resume.projects.flatMap((project) => project.bullets.map((bullet) => bullet.text))
  ].join(" ").toLowerCase();

  for (const term of collectUnsupportedTerms(candidate, context)) {
    if (term.length >= 3 && includesTerm(claimText, term) && !evidenceSupportsClaim(term, context.evidenceCards)) {
      issues.push(issue("unsupported_claim", "resume", `Unsupported JD term '${term}' appears as a resume claim.`));
    }
  }

  const fitReport = calculateResumeFitReport(resume, context.profile, { page: getPageBudget(context) });
  const pageBudget = getPageBudget(context);
  if (fitReport.total_bullets < pageBudget.minTotalBullets) {
    issues.push(issue("resume_under_target_length", "resume", `Resume has ${fitReport.total_bullets} bullets; target density requires at least ${pageBudget.minTotalBullets}.`));
  }
  if (fitReport.status === "under_target") {
    issues.push(issue("resume_under_target_length", "resume", `Resume estimates to ${fitReport.estimated_lines} lines (${fitReport.estimated_fill_percent}% of target); minimum target is ${fitReport.target_min_lines} lines.`));
  }
  if (fitReport.status === "over_hard_max") {
    issues.push(issue("resume_over_hard_max", "resume", `Resume estimates to ${fitReport.estimated_lines} lines; hard one-page maximum is ${fitReport.hard_max_lines}.`));
  }

  return { success: issues.length === 0, valid: issues.length === 0, resume, fit_report: fitReport, issues };
}
