import { z } from "zod";
import { JOB_IDS, PROJECT_IDS, ROLE_MODES } from "./constants";

export const RoleModeSchema = z.enum(ROLE_MODES);
export type RoleMode = z.infer<typeof RoleModeSchema>;

export const JobIdSchema = z.enum(JOB_IDS);
export type JobId = z.infer<typeof JobIdSchema>;

export const ProjectIdSchema = z.enum(PROJECT_IDS);
export type ProjectId = z.infer<typeof ProjectIdSchema>;

export const ResumeProfileSchema = z.object({
  name: z.string().min(1),
  contact: z.object({
    email: z.string().email(),
    location: z.string().min(1),
    phone: z.string().min(1),
    linkedin: z.string().min(1),
    website: z.string().min(1)
  }),
  education: z.array(z.object({
    school: z.string().min(1),
    location: z.string().optional(),
    degree: z.string().min(1),
    graduation: z.string().min(1),
    gpa: z.string().optional()
  })).min(1),
  certifications: z.array(z.string().min(1)),
  role_modes: z.array(RoleModeSchema).min(1),
  employers: z.array(z.object({
    job_id: JobIdSchema,
    employer: z.string().min(1),
    title: z.string().min(1),
    location: z.string().min(1),
    dates: z.string().min(1)
  })).min(3),
  allowed_projects: z.array(z.object({
    project_id: ProjectIdSchema,
    display_name: z.string().min(1)
  })).min(3)
});
export type ResumeProfile = z.infer<typeof ResumeProfileSchema>;

export const EvidenceCardSchema = z.object({
  id: z.string().min(1).regex(/^[a-z0-9_]+$/),
  type: z.enum(["work_project_fact", "project_fact", "skill_fact", "metric", "known_unknown"]),
  parent_job_id: JobIdSchema.optional(),
  project_id: z.string().min(1).optional(),
  title: z.string().min(1),
  evidence_text: z.string().min(1),
  skills: z.array(z.string().min(1)).default([]),
  metrics: z.array(z.string().min(1)).default([]),
  role_tags: z.array(RoleModeSchema.exclude(["auto"])).default([]),
  source_heading: z.string().min(1)
});
export type EvidenceCard = z.infer<typeof EvidenceCardSchema>;

export const GeneratedBulletSchema = z.object({
  text: z.string().min(1),
  evidence_refs: z.array(z.string().min(1)).min(1),
  jd_keywords: z.array(z.string().min(1)).default([]),
  word_count: z.number().int().nonnegative().optional(),
  char_count: z.number().int().nonnegative().optional(),
  estimated_lines: z.number().int().nonnegative().optional()
});
export type GeneratedBullet = z.infer<typeof GeneratedBulletSchema>;

export const KeywordSupportLevelSchema = z.enum([
  "bullet",
  "resume_skill",
  "contextual_evidence",
  "skill_list_only",
  "synonym_only",
  "alternative_satisfied",
  "unsupported"
]);
export type KeywordSupportLevel = z.infer<typeof KeywordSupportLevelSchema>;

export const KeywordPlacementRecommendationSchema = z.enum([
  "prefer_bullet",
  "skill_ok",
  "omit",
  "needs_source_update"
]);
export type KeywordPlacementRecommendation = z.infer<typeof KeywordPlacementRecommendationSchema>;

export const KeywordStatusSchema = z.enum([
  "covered_in_bullets",
  "covered_in_skills_only",
  "supported_but_omitted_for_space",
  "alternative_satisfied",
  "unsupported"
]);
export type KeywordStatus = z.infer<typeof KeywordStatusSchema>;

export const KeywordReportItemSchema = z.object({
  term: z.string().min(1),
  canonical: z.string().min(1),
  status: KeywordStatusSchema,
  support_level: KeywordSupportLevelSchema,
  evidence_refs: z.array(z.string().min(1)).default([]),
  matched_terms: z.array(z.string().min(1)).default([]),
  placement_recommendation: KeywordPlacementRecommendationSchema
});
export type KeywordReportItem = z.infer<typeof KeywordReportItemSchema>;

export const KeywordReportSchema = z.object({
  covered_in_bullets: z.array(z.string()),
  covered_in_skills_only: z.array(z.string()),
  supported_but_omitted_for_space: z.array(z.string()),
  unsupported: z.array(z.string()),
  details: z.array(KeywordReportItemSchema).default([])
});
export type KeywordReport = z.infer<typeof KeywordReportSchema>;

export const ResumeFitReportSchema = z.object({
  estimated_lines: z.number().int().nonnegative(),
  target_min_lines: z.number().int().nonnegative(),
  target_max_lines: z.number().int().nonnegative(),
  hard_max_lines: z.number().int().nonnegative(),
  estimated_fill_percent: z.number().nonnegative(),
  total_bullets: z.number().int().nonnegative(),
  work_bullets: z.number().int().nonnegative(),
  project_bullets: z.number().int().nonnegative(),
  status: z.enum(["under_target", "target", "over_target", "over_hard_max"])
});
export type ResumeFitReport = z.infer<typeof ResumeFitReportSchema>;

const GeneratedSkillSchema = z.union([
  z.string().min(1),
  z.object({
    name: z.string().min(1)
  }).passthrough()
]).transform((value) => typeof value === "string" ? value : value.name);

const GeneratedProjectSchema = z.object({
  project_id: ProjectIdSchema,
  display_name: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  bullets: z.array(GeneratedBulletSchema).min(1),
  alternates: z.array(ProjectIdSchema).default([]),
  alternate_project_ids: z.array(ProjectIdSchema).optional()
}).transform((project) => ({
  project_id: project.project_id,
  display_name: project.display_name ?? project.name ?? project.project_id,
  bullets: project.bullets,
  alternates: project.alternates.length > 0 ? project.alternates : project.alternate_project_ids ?? []
}));

export const GeneratedResumeSchema = z.object({
  role_mode: RoleModeSchema,
  summary: z.string().optional(),
  skills: z.array(GeneratedSkillSchema).min(1),
  work_experience: z.array(z.object({
    job_id: JobIdSchema,
    bullets: z.array(GeneratedBulletSchema).min(1)
  })).min(1),
  projects: z.array(GeneratedProjectSchema).default([]),
  unsupported_terms: z.array(z.string().min(1)).default([]),
  keyword_report: KeywordReportSchema.optional()
});
export type GeneratedResume = z.infer<typeof GeneratedResumeSchema>;

const RawGenerateResumeRequestSchema = z.object({
  job_description: z.string().min(20),
  role_mode: RoleModeSchema.default("auto"),
  profile: ResumeProfileSchema.optional(),
  evidence_cards: z.array(EvidenceCardSchema).min(1),
  allowed_project_ids: z.array(ProjectIdSchema).optional(),
  section_budgets: z.unknown().optional()
});

export const GenerateResumeRequestSchema = z.preprocess((value) => {
  if (!value || typeof value !== "object") {
    return value;
  }

  const input = value as Record<string, unknown>;
  return {
    ...input,
    job_description: input.job_description ?? input.jobDescription,
    role_mode: input.role_mode ?? input.roleMode,
    profile: input.profile ?? input.staticProfile,
    evidence_cards: input.evidence_cards ?? input.evidenceCards,
    allowed_project_ids: input.allowed_project_ids ?? input.allowedProjectIds,
    section_budgets: input.section_budgets ?? input.sectionBudgets
  };
}, RawGenerateResumeRequestSchema);
export type GenerateResumeRequest = z.infer<typeof GenerateResumeRequestSchema>;

export const ValidationIssueSchema = z.object({
  code: z.string().min(1),
  path: z.string().min(1),
  message: z.string().min(1),
  severity: z.enum(["error", "warning"]).default("error")
});
export type ValidationIssue = z.infer<typeof ValidationIssueSchema>;

export const GenerateResumeResponseSchema = z.discriminatedUnion("ok", [
  z.object({
    ok: z.literal(true),
    resume: GeneratedResumeSchema,
    keyword_report: KeywordReportSchema,
    fit_report: ResumeFitReportSchema.optional(),
    validation_issues: z.array(ValidationIssueSchema).default([]),
    mode: z.enum(["mock", "llm"])
  }),
  z.object({
    ok: z.literal(false),
    errors: z.array(ValidationIssueSchema),
    keyword_report: KeywordReportSchema.optional(),
    raw_model_output: z.unknown().optional()
  })
]);
export type GenerateResumeResponse = z.infer<typeof GenerateResumeResponseSchema>;
