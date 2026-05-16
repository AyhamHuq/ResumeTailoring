import { JOB_IDS, PROJECT_IDS, SECTION_BUDGETS } from "./constants";
import { countWords, estimateLines } from "./budgets";
import { evidenceSupportsKeyword } from "./keywords";
import {
  GeneratedResumeSchema,
  type EvidenceCard,
  type GeneratedResume,
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
    bulletsPerProject?: { minBullets?: number; maxBullets?: number };
  };
  skills?: {
    maxCharacters?: number;
    maxEstimatedLines?: number;
    maxItems?: number;
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
    bulletsPerProject: {
      minBullets: context.budgets?.projects?.bulletsPerProject?.minBullets ?? SECTION_BUDGETS.projects.bulletsPerProject.minBullets,
      maxBullets: context.budgets?.projects?.bulletsPerProject?.maxBullets ?? SECTION_BUDGETS.projects.bulletsPerProject.maxBullets
    }
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

  resume.work_experience.forEach((job, jobIndex) => {
    if (!allowedJobs.has(job.job_id)) {
      issues.push(issue("invalid_job_id", `work_experience.${jobIndex}.job_id`, `Invalid job id '${job.job_id}'.`));
      return;
    }
    const budget = getWorkBudget(job.job_id, context);
    if (job.bullets.length < budget.minBullets || job.bullets.length > budget.maxBullets) {
      issues.push(issue("job_bullet_count", `work_experience.${jobIndex}.bullets`, `${job.job_id} requires ${budget.minBullets}-${budget.maxBullets} bullets.`));
    }
    job.bullets.forEach((bullet, bulletIndex) => validateBullet(bullet, `work_experience.${jobIndex}.bullets.${bulletIndex}`, evidenceIds, issues, context));
  });

  const projectBudget = getProjectBudget(context);
  if (resume.projects.length < projectBudget.minProjects || resume.projects.length > projectBudget.maxProjects) {
    issues.push(issue("project_count", "projects", `Projects section requires ${projectBudget.minProjects}-${projectBudget.maxProjects} projects.`));
  }

  resume.projects.forEach((project, projectIndex) => {
    if (!allowedProjects.has(project.project_id)) {
      issues.push(issue("invalid_project_id", `projects.${projectIndex}.project_id`, `Invalid project id '${project.project_id}'.`));
    }
    if (project.bullets.length < projectBudget.bulletsPerProject.minBullets || project.bullets.length > projectBudget.bulletsPerProject.maxBullets) {
      issues.push(issue("project_bullet_count", `projects.${projectIndex}.bullets`, `Each project requires ${projectBudget.bulletsPerProject.minBullets}-${projectBudget.bulletsPerProject.maxBullets} bullets.`));
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

  const claimText = [
    skillText,
    ...resume.work_experience.flatMap((job) => job.bullets.map((bullet) => bullet.text)),
    ...resume.projects.flatMap((project) => project.bullets.map((bullet) => bullet.text))
  ].join(" ").toLowerCase();

  for (const term of collectUnsupportedTerms(candidate, context)) {
    if (term.length >= 3 && includesTerm(claimText, term) && !evidenceSupportsKeyword(term, context.evidenceCards)) {
      issues.push(issue("unsupported_claim", "resume", `Unsupported JD term '${term}' appears as a resume claim.`));
    }
  }

  return { success: issues.length === 0, valid: issues.length === 0, resume, issues };
}
