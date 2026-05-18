import { JOB_IDS, PROJECT_IDS, SECTION_BUDGETS } from "./constants";
import { calculateResumeFitReport, countWords, estimateLines } from "./budgets";
import { evidenceSupportsClaim, expandGroundedSynonyms, scoreKeywords, termsProhibitedAsClaims } from "./keywords";
import { isDisallowedStandaloneSkill } from "./skills";
import {
  GeneratedResumeSchema,
  type CoveragePlanEntry,
  type EvidenceCard,
  type GeneratedResume,
  type GeneratedBullet,
  type KeywordReportItem,
  type KeywordReport,
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
  jobDescription?: string;
  keywordReport?: KeywordReport;
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

function normalizeTerm(value: string): string {
  return value.toLowerCase().replace(/[^\w#+/. -]/g, " ").replace(/\s+/g, " ").trim();
}

function includesAnyTerm(text: string, terms: string[]): boolean {
  return terms.some((term) => includesTerm(text, term));
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
  const words = countWords(bullet.text);
  const chars = bullet.text.length;
  const lines = estimateLines(bullet.text);
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

function keywordReportForPlacement(
  resume: GeneratedResume,
  context: ValidationContext
): KeywordReport | undefined {
  if (context.keywordReport) {
    return context.keywordReport;
  }
  if (!context.jobDescription) {
    return undefined;
  }

  return scoreKeywords(context.jobDescription, resume, context.evidenceCards);
}

function validateBulletFirstKeywordPlacement(
  resume: GeneratedResume,
  context: ValidationContext,
  issues: ValidationIssue[]
): void {
  const report = keywordReportForPlacement(resume, context);
  if (!report?.details?.length) {
    return;
  }

  const seen = new Set<string>();
  for (const item of report.details) {
    if (
      item.placement_recommendation !== "prefer_bullet"
      || item.status === "covered_in_bullets"
      || !["contextual_evidence", "resume_skill"].includes(item.support_level)
    ) {
      continue;
    }

    const key = item.canonical.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    const refs = item.evidence_refs.length > 0 ? ` Candidate evidence refs: ${item.evidence_refs.join(", ")}.` : "";
    const suggestion = bulletFirstSuggestion(item, resume, context);
    issues.push(issue(
      "keyword_prefer_bullet_not_covered",
      "keyword_report.details",
      `Canonical '${item.canonical}' from JD term '${item.term}' is bullet-worthy but is not covered in a work/project bullet. Candidate section: ${suggestion.section}. Suggested bullet slot: ${suggestion.slot}. Rewrite an existing grounded bullet instead of relying on Skills.${refs}`
    ));
  }
}

type PlannedBullet = {
  bullet?: GeneratedBullet;
  path: string;
  section: "work_experience" | "projects";
};

function targetTerms(item: KeywordReportItem): string[] {
  return Array.from(new Set([
    item.term,
    item.canonical,
    ...item.matched_terms,
    ...expandGroundedSynonyms(item.canonical)
  ].filter(Boolean)));
}

function requiredBulletTargets(report: KeywordReport): KeywordReportItem[] {
  const targets = report.details.filter((item) => (
    item.placement_recommendation === "prefer_bullet"
    && item.support_level !== "unsupported"
    && item.support_level !== "alternative_satisfied"
  ));
  const seen = new Set<string>();
  return targets.filter((item) => {
    const key = normalizeTerm(item.canonical);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function planTargetsItem(entry: CoveragePlanEntry, item: KeywordReportItem): boolean {
  const entryTerms = [entry.target_term, entry.canonical ?? ""].map(normalizeTerm).filter(Boolean);
  const itemTerms = [item.term, item.canonical].map(normalizeTerm);
  return entryTerms.some((entryTerm) => itemTerms.includes(entryTerm));
}

function evidenceRefsForTargetInBullets(resume: GeneratedResume, item: KeywordReportItem): string[] {
  const terms = targetTerms(item);
  const refs: string[] = [];
  for (const bullet of [
    ...resume.work_experience.flatMap((job) => job.bullets),
    ...resume.projects.flatMap((project) => project.bullets)
  ]) {
    if (includesAnyTerm(bullet.text, terms)) {
      refs.push(...bullet.evidence_refs);
    }
  }
  return Array.from(new Set(refs));
}

function cardsForRefs(context: ValidationContext, refs: string[]): EvidenceCard[] {
  const byId = new Map(context.evidenceCards.map((card) => [card.id, card]));
  return refs.map((ref) => byId.get(ref)).filter((card): card is EvidenceCard => Boolean(card));
}

function bulletFirstSuggestion(
  item: KeywordReportItem,
  resume: GeneratedResume,
  context: ValidationContext
): { section: string; slot: string } {
  const refs = item.evidence_refs.length > 0 ? item.evidence_refs : evidenceRefsForTargetInBullets(resume, item);
  const cards = cardsForRefs(context, refs);
  const firstCard = cards[0];
  if (!firstCard) {
    return { section: "work_experience or projects", slot: "nearest existing grounded bullet" };
  }

  if (firstCard.parent_job_id) {
    const jobIndex = resume.work_experience.findIndex((job) => job.job_id === firstCard.parent_job_id);
    const job = jobIndex >= 0 ? resume.work_experience[jobIndex] : undefined;
    const bulletIndex = job?.bullets.findIndex((bullet) => bullet.evidence_refs.some((ref) => refs.includes(ref))) ?? -1;
    return {
      section: `work_experience job_id=${firstCard.parent_job_id}`,
      slot: `work_experience.${Math.max(jobIndex, 0)}.bullets.${bulletIndex >= 0 ? bulletIndex : 0}`
    };
  }

  if (firstCard.project_id) {
    const projectIndex = resume.projects.findIndex((project) => project.project_id === firstCard.project_id);
    const project = projectIndex >= 0 ? resume.projects[projectIndex] : undefined;
    const bulletIndex = project?.bullets.findIndex((bullet) => bullet.evidence_refs.some((ref) => refs.includes(ref))) ?? -1;
    return {
      section: `projects project_id=${firstCard.project_id}`,
      slot: `projects.${projectIndex >= 0 ? projectIndex : 0}.bullets.${bulletIndex >= 0 ? bulletIndex : 0}`
    };
  }

  return { section: "work_experience or projects", slot: "nearest existing grounded bullet" };
}

function findPlannedBullet(resume: GeneratedResume, entry: CoveragePlanEntry): PlannedBullet {
  if (entry.section === "work_experience") {
    if (!entry.job_id) {
      return { path: "coverage_plan.job_id", section: "work_experience" };
    }
    const jobIndex = resume.work_experience.findIndex((job) => job.job_id === entry.job_id);
    const bullet = jobIndex >= 0 ? resume.work_experience[jobIndex]?.bullets[entry.bullet_index] : undefined;
    return {
      bullet,
      path: jobIndex >= 0 ? `work_experience.${jobIndex}.bullets.${entry.bullet_index}` : `work_experience.${entry.job_id}.bullets.${entry.bullet_index}`,
      section: "work_experience"
    };
  }

  if (!entry.project_id) {
    return { path: "coverage_plan.project_id", section: "projects" };
  }
  const projectIndex = resume.projects.findIndex((project) => project.project_id === entry.project_id);
  const bullet = projectIndex >= 0 ? resume.projects[projectIndex]?.bullets[entry.bullet_index] : undefined;
  return {
    bullet,
    path: projectIndex >= 0 ? `projects.${projectIndex}.bullets.${entry.bullet_index}` : `projects.${entry.project_id}.bullets.${entry.bullet_index}`,
    section: "projects"
  };
}

function validateCoveragePlan(
  resume: GeneratedResume,
  context: ValidationContext,
  issues: ValidationIssue[]
): void {
  const report = keywordReportForPlacement(resume, context);
  if (!context.jobDescription || !report?.details?.length) {
    return;
  }

  const evidenceIds = new Set(context.evidenceCards.map((card) => card.id));
  const requiredTargets = requiredBulletTargets(report);
  if (requiredTargets.length === 0) {
    return;
  }

  for (const [entryIndex, entry] of resume.coverage_plan.entries()) {
    const planned = findPlannedBullet(resume, entry);
    if (entry.section === "work_experience" && !entry.job_id) {
      issues.push(issue("coverage_plan_missing_section_id", `coverage_plan.${entryIndex}.job_id`, `Coverage plan target '${entry.target_term}' must include job_id for work_experience.`));
    }
    if (entry.section === "projects" && !entry.project_id) {
      issues.push(issue("coverage_plan_missing_section_id", `coverage_plan.${entryIndex}.project_id`, `Coverage plan target '${entry.target_term}' must include project_id for projects.`));
    }
    for (const ref of entry.selected_evidence_refs) {
      if (!evidenceIds.has(ref)) {
        issues.push(issue("coverage_plan_invalid_evidence_ref", `coverage_plan.${entryIndex}.selected_evidence_refs`, `Coverage plan target '${entry.target_term}' references missing evidence ref '${ref}'.`));
      }
    }
    if (!planned.bullet) {
      issues.push(issue("coverage_plan_invalid_bullet", `coverage_plan.${entryIndex}`, `Coverage plan target '${entry.target_term}' points to missing bullet '${planned.path}'.`));
      continue;
    }
    const usesSelectedEvidence = entry.selected_evidence_refs.some((ref) => planned.bullet?.evidence_refs.includes(ref));
    if (!usesSelectedEvidence) {
      issues.push(issue("coverage_plan_unused_evidence", `coverage_plan.${entryIndex}.selected_evidence_refs`, `Coverage plan target '${entry.target_term}' selected evidence is not used by planned bullet '${planned.path}'.`));
    }
  }

  for (const target of requiredTargets) {
    const matchingEntries = resume.coverage_plan.filter((entry) => planTargetsItem(entry, target));
    const suggestion = bulletFirstSuggestion(target, resume, context);
    const candidateRefs = target.evidence_refs.length > 0
      ? target.evidence_refs
      : evidenceRefsForTargetInBullets(resume, target);
    if (matchingEntries.length === 0) {
      issues.push(issue(
        "coverage_plan_missing_target",
        "coverage_plan",
        `Coverage plan is missing canonical '${target.canonical}' for JD term '${target.term}'. Candidate evidence refs: ${candidateRefs.join(", ") || "none"}. Candidate section: ${suggestion.section}. Suggested bullet slot: ${suggestion.slot}.`
      ));
      continue;
    }

    const targetCoveredByPlan = matchingEntries.some((entry) => {
      const planned = findPlannedBullet(resume, entry);
      return Boolean(
        planned.bullet
        && includesAnyTerm(planned.bullet.text, targetTerms(target))
        && entry.selected_evidence_refs.some((ref) => planned.bullet?.evidence_refs.includes(ref))
      );
    });

    if (!targetCoveredByPlan) {
      issues.push(issue(
        "coverage_plan_unused_target",
        "coverage_plan",
        `Coverage plan target '${target.canonical}' is not actually covered by its planned bullet. Candidate evidence refs: ${candidateRefs.join(", ") || "none"}. Candidate section: ${suggestion.section}. Suggested bullet slot: ${suggestion.slot}.`
      ));
    }
  }
}

function requiresMarioProject(context: ValidationContext): boolean {
  if (!context.jobDescription) {
    return false;
  }
  if (!/\b(?:oop|object[-\s]?oriented|design patterns?|data structures?|algorithm(?:s| design)?)\b/i.test(context.jobDescription)) {
    return false;
  }
  return context.evidenceCards.some((card) => card.project_id === "mario_monogame");
}

function requiresTravelProject(context: ValidationContext): boolean {
  if (!context.jobDescription) {
    return false;
  }
  if (!/\b(?:android|kotlin|jetpack compose|mvvm|model[-\s]?view[-\s]?viewmodel|livedata|firebase|plaid|mobile app|mobile application|personal finance|expense tracking|receipt tracking|travel budgeting|financial api)\b/i.test(context.jobDescription)) {
    return false;
  }
  return context.evidenceCards.some((card) => card.project_id === "travel_budgeting_app");
}

function validateRequiredProjectSelection(
  resume: GeneratedResume,
  context: ValidationContext,
  issues: ValidationIssue[]
): void {
  if (requiresMarioProject(context) && !resume.projects.some((project) => project.project_id === "mario_monogame")) {
    const refs = context.evidenceCards
      .filter((card) => card.project_id === "mario_monogame")
      .map((card) => card.id);
    issues.push(issue(
      "required_project_missing",
      "projects",
      `JD asks for OOP/design patterns/data structures/algorithms and mario_monogame evidence exists, so select project_id 'mario_monogame'. Candidate evidence refs: ${refs.join(", ")}.`
    ));
  }

  if (requiresTravelProject(context) && !resume.projects.some((project) => project.project_id === "travel_budgeting_app")) {
    const refs = context.evidenceCards
      .filter((card) => card.project_id === "travel_budgeting_app")
      .map((card) => card.id);
    issues.push(issue(
      "required_project_missing",
      "projects",
      `JD asks for Android/Kotlin/MVVM/mobile app or financial API work and travel_budgeting_app evidence exists, so select project_id 'travel_budgeting_app'. Candidate evidence refs: ${refs.join(", ")}.`
    ));
  }
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
  const allowedProjects = new Set<ProjectId>([
    ...(context.allowedProjectIds ?? []),
    ...(context.profile?.allowed_projects.map((project) => project.project_id) ?? []),
    ...PROJECT_IDS
  ]);
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
  validateRequiredProjectSelection(resume, context, issues);

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
    if (isDisallowedStandaloneSkill(skill, { jobDescription: context.jobDescription })) {
      issues.push(issue("disallowed_generic_skill", `skills.${skillIndex}`, `Skill '${skill}' should be covered through specific tools or bullets instead of listed as a standalone skill.`));
    }
  });

  const claimText = [
    skillText,
    ...resume.work_experience.flatMap((job) => job.bullets.map((bullet) => bullet.text)),
    ...resume.projects.flatMap((project) => project.bullets.map((bullet) => bullet.text))
  ].join(" ").toLowerCase();

  const prohibitedTerms = Array.from(new Set([
    ...collectUnsupportedTerms(candidate, context),
    ...termsProhibitedAsClaims(keywordReportForPlacement(resume, context))
  ]));

  for (const term of prohibitedTerms) {
    if (term.length >= 3 && includesTerm(claimText, term)) {
      const supportText = evidenceSupportsClaim(term, context.evidenceCards) ? " or needs more specific source detail" : "";
      issues.push(issue("unsupported_claim", "resume", `Unsupported JD term '${term}' appears as a resume claim${supportText}.`));
    }
  }

  validateBulletFirstKeywordPlacement(resume, context, issues);
  validateCoveragePlan(resume, context, issues);

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
