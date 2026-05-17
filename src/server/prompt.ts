import { SECTION_BUDGETS, buildKeywordCoveragePlan, type EvidenceCard, type GenerateResumeRequest, type ResumeProfile, type ValidationIssue } from "../shared";

export function buildSystemPrompt(): string {
  return [
    "You generate ATS-safe resume JSON only.",
    "Use only facts present in evidence_cards or grounded synonym rules.",
    "Follow keyword_coverage_plan: prefer_bullet terms belong in bullets, skill_ok terms may appear in compact skills, omit and needs_source_update terms must not be claimed exactly.",
    "Do not rewrite static profile data, employers, titles, dates, locations, education, or certifications.",
    "Every generated bullet must include evidence_refs pointing to specific evidence card ids.",
    "Use distinct, specific evidence_refs when adding bullets; do not repeat one broad evidence card for an entire job.",
    "Unsupported job-description terms must be listed in unsupported_terms instead of claimed.",
    "The resume must target 90-95% of one page; sparse resumes are invalid.",
    "Fill available space with the strongest grounded work and project bullets before adding skills-only coverage.",
    "Keep skills compact and natural; do not list low-signal generic labels when specific tools or bullets carry the evidence.",
    "Do not add filler summaries; only compress or remove content when the hard one-page maximum is exceeded.",
    "Return only JSON matching the requested shape; no markdown or prose."
  ].join("\n");
}

export function buildUserPrompt(request: GenerateResumeRequest, profile: ResumeProfile): string {
  return JSON.stringify({
    task: "Generate a one-page tailored resume content object.",
    page_fit_contract: {
      target: "90-95% of one page",
      hard_rule: "Do not leave the page sparse. Prefer adding grounded work/project bullets before trimming.",
      work_density: "CapTech exactly 5 bullets, Publicis Sapient exactly 4 bullets, Sallie Mae exactly 3 bullets.",
      project_density: "Select 1-2 projects with 3-4 total project bullets.",
      compression_rule: "Only compress or remove content when the hard max is exceeded; never pad with unsupported claims."
    },
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
    keyword_coverage_plan: buildKeywordCoveragePlan(request.job_description, request.evidence_cards),
    skills_policy: {
      style: "compact original-resume-style skills, not a stuffed keyword dump",
      prefer_bullets_for: "important JD requirements with contextual evidence",
      avoid_standalone_skill_labels: ["ES6+", "unit testing", "automated testing", "test automation", "SOLID"],
      omit_exact_terms_without_exact_or_claimable_evidence: "Terms marked omit or needs_source_update in keyword_coverage_plan must not appear as exact resume claims."
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
    repair_rules: [
      "Do not return the same bullet counts when validation says the resume is underfilled.",
      "If resume_under_target_length, add grounded bullets from the same evidence cards before adding skills.",
      "If job_under_min_bullets, add bullets for that job using valid evidence_refs.",
      "If project_under_min_bullets, add project bullets or a second allowed project using valid evidence_refs.",
      "Required density after repair: CapTech 5 bullets, Publicis Sapient 4 bullets, Sallie Mae 3 bullets, projects 3-4 total bullets, at least 15 bullets overall.",
      "If resume_over_hard_max, compress bullets first, then remove project bullets before work bullets."
    ],
    previous_output: previousOutput,
    allowed_evidence_refs: evidenceCards.map((card) => card.id),
    budgets: SECTION_BUDGETS
  });
}
