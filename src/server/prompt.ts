import { SECTION_BUDGETS, type EvidenceCard, type GenerateResumeRequest, type ResumeProfile, type ValidationIssue } from "../shared";

export function buildSystemPrompt(): string {
  return [
    "You generate ATS-safe resume JSON only.",
    "Use only facts present in evidence_cards or grounded synonym rules.",
    "Do not rewrite static profile data, employers, titles, dates, locations, education, or certifications.",
    "Every generated bullet must include evidence_refs pointing to specific evidence card ids.",
    "Unsupported job-description terms must be listed in unsupported_terms instead of claimed.",
    "Return only JSON matching the requested shape; no markdown or prose."
  ].join("\n");
}

export function buildUserPrompt(request: GenerateResumeRequest, profile: ResumeProfile): string {
  return JSON.stringify({
    task: "Generate a one-page tailored resume content object.",
    output_shape: {
      role_mode: request.role_mode,
      skills: ["ordered source-grounded skill strings"],
      work_experience: [
        { job_id: "captech", bullets: [{ text: "string", evidence_refs: ["evidence_id"], jd_keywords: ["keyword"] }] },
        { job_id: "publicis_sapient", bullets: [{ text: "string", evidence_refs: ["evidence_id"], jd_keywords: ["keyword"] }] },
        { job_id: "sallie_mae", bullets: [{ text: "string", evidence_refs: ["evidence_id"], jd_keywords: ["keyword"] }] }
      ],
      projects: [{ project_id: "allowed project id", display_name: "static display name", bullets: [{ text: "string", evidence_refs: ["evidence_id"], jd_keywords: ["keyword"] }], alternates: ["allowed project id"] }],
      unsupported_terms: ["JD terms that evidence does not support"]
    },
    budgets: SECTION_BUDGETS,
    static_profile: profile,
    job_description: request.job_description,
    role_mode: request.role_mode,
    allowed_project_ids: request.allowed_project_ids ?? profile.allowed_projects.map((project) => project.project_id),
    evidence_cards: request.evidence_cards
  });
}

export function buildRepairPrompt(previousOutput: unknown, issues: ValidationIssue[], evidenceCards: EvidenceCard[]): string {
  return JSON.stringify({
    task: "Repair the previous resume JSON. Return only valid JSON.",
    validation_issues: issues,
    previous_output: previousOutput,
    allowed_evidence_refs: evidenceCards.map((card) => card.id),
    budgets: SECTION_BUDGETS
  });
}
