import {
  SECTION_BUDGETS,
  buildKeywordCoveragePlan,
  expandGroundedSynonyms,
  type EvidenceCard,
  type GenerateResumeRequest,
  type ResumeProfile,
  type ValidationIssue
} from "../shared";

function compactEvidenceCard(card: EvidenceCard) {
  return {
    id: card.id,
    type: card.type,
    parent_job_id: card.parent_job_id,
    project_id: card.project_id,
    title: card.title,
    skills: card.skills,
    evidence_text: card.evidence_text.slice(0, 260)
  };
}

function hasProjectEvidence(evidenceCards: EvidenceCard[], projectId: string): boolean {
  return evidenceCards.some((card) => card.project_id === projectId);
}

function projectSelectionRules(jobDescription: string, evidenceCards: EvidenceCard[]) {
  const requiresMario = /\b(?:oop|object[-\s]?oriented|design patterns?|data structures?|algorithm(?:s| design)?)\b/i.test(jobDescription)
    && hasProjectEvidence(evidenceCards, "mario_monogame");
  const requiresTravel = /\b(?:android|kotlin|jetpack compose|mvvm|model[-\s]?view[-\s]?viewmodel|livedata|firebase|plaid|mobile app|mobile application|personal finance|expense tracking|receipt tracking|travel budgeting|financial api)\b/i.test(jobDescription)
    && hasProjectEvidence(evidenceCards, "travel_budgeting_app");
  const requiredProjects = [
    requiresTravel ? "travel_budgeting_app" : null,
    requiresMario ? "mario_monogame" : null
  ].filter((projectId): projectId is string => Boolean(projectId));

  return {
    required_project: requiredProjects[0] ?? null,
    required_projects: requiredProjects,
    hard_rules: [
      "If required_projects has entries, include those project IDs in projects and cover their evidence in project bullets.",
      "If OOP, design patterns, data structures, or algorithms appear in the JD and mario_monogame evidence exists, select mario_monogame.",
      "If Android, Kotlin, MVVM, Jetpack Compose, LiveData, Firebase, Plaid, mobile app architecture, financial API integration, or personal finance app terms appear in the JD and travel_budgeting_app evidence exists, select travel_budgeting_app.",
      "If React, responsive UI, cloud, metrics, or analytics dominate and no required_projects are set, coffee_dashboard is a strong project choice.",
      "If AI, ML, NLP, PyTorch, FAISS, or safety classification dominate and no required_projects are set, aep_ai_safety is a strong project choice."
    ],
    mario_evidence_refs: evidenceCards
      .filter((card) => card.project_id === "mario_monogame")
      .map((card) => card.id),
    travel_evidence_refs: evidenceCards
      .filter((card) => card.project_id === "travel_budgeting_app")
      .map((card) => card.id)
  };
}

function bulletTargetInstruction(canonical: string): string {
  const normalized = canonical.toLowerCase();
  if (normalized === "containerized systems") {
    return "Must be covered in a work/project bullet by mentioning Docker or containerized deployment/testing work. Use captech_serverless_cicd when available; Docker in Skills does not count.";
  }
  if (normalized === "automated testing" || normalized === "unit testing") {
    return "Must be covered in a bullet by mentioning supported test work such as Playwright, Jest, pytest, JUnit, or API testing. Testing tools in Skills do not count.";
  }
  if (normalized === "ci/cd" || normalized === "deployment pipelines") {
    return "Must be covered in a bullet by mentioning supported deployment work such as Jenkins, GitHub Actions, Vercel, production deployment, or code-freeze release coordination.";
  }
  if (normalized === "object-oriented" || normalized === "design patterns" || normalized === "data structures") {
    return "Must be covered in a bullet using mario_monogame evidence when available, with OOP/design-pattern language such as state machine, command pattern, factory pattern, game state, or save system.";
  }
  if (normalized === "algorithms") {
    return "Must be covered in a bullet using algorithm evidence such as regret-insertion route optimization or recommendation algorithms.";
  }
  if (normalized === "cloud monitoring") {
    return "Must be covered in a bullet using CloudWatch Logs, CloudWatch Insights, alarms, logging, monitoring, or alerts evidence.";
  }
  if (normalized === "metrics" || normalized === "data analytics") {
    return "Must be covered in a bullet using supported metric, analytics, Athena, Glue, forecasting, KPI, precision, recall, F1, or dashboard evidence.";
  }
  if (normalized === "user interfaces") {
    return "Must be covered in a bullet using React, TypeScript, React Native, responsive UI, accessibility, or interface delivery evidence.";
  }
  if (normalized === "mobile app architecture" || normalized === "mvvm") {
    return "Must be covered in a project bullet using mobile architecture evidence such as Android, Kotlin, Jetpack Compose, MVVM, Model-View-ViewModel, or LiveData; use travel_budgeting_app when available.";
  }
  if (normalized === "financial api integration") {
    return "Must be covered in a project bullet using Plaid API, bank-account linking, Firebase, or financial-data access evidence; use travel_budgeting_app when available.";
  }
  if (normalized === "expense tracking") {
    return "Must be covered in a project bullet using travel budgeting, trip budgets, categorized spending, expense tracking, or receipt tracking evidence.";
  }
  if (normalized === "agile") {
    return "Must be covered in a delivery bullet using Agile-supported evidence; do not claim Scrum unless exact Scrum evidence exists.";
  }
  return "Must be covered naturally in a grounded work/project bullet, not only in Skills.";
}

function candidateEvidenceFromIssue(issue: ValidationIssue, evidenceCards: EvidenceCard[]) {
  return evidenceCards
    .filter((card) => issue.message.includes(card.id))
    .map(compactEvidenceCard);
}

function targetedInstructionForIssue(issue: ValidationIssue): string {
  const message = issue.message.toLowerCase();
  if (message.includes("containerized systems")) {
    return "Rewrite the suggested bullet to mention Docker/containerized work using captech_serverless_cicd. Example shape: Built React TypeScript responsive UI with Docker, GitHub Actions, and Playwright tests. Keep it grounded and update coverage_plan to that bullet.";
  }
  if (message.includes("automated testing")) {
    return "Rewrite the suggested bullet to mention the supported testing tool in the candidate evidence, such as Playwright, Jest, or pytest. Update coverage_plan to that bullet.";
  }
  if (message.includes("ci/cd") || message.includes("deployment pipelines")) {
    return "Rewrite the suggested bullet to mention Jenkins, GitHub Actions, Vercel, production deployment, or deployment pipelines from the candidate evidence. Update coverage_plan to that bullet.";
  }
  if (message.includes("object-oriented") || message.includes("design patterns") || message.includes("data structures")) {
    return "Add or rewrite a mario_monogame project bullet using state machine, command pattern, factory pattern, game state, or save-system evidence. Update coverage_plan to the project bullet.";
  }
  if (message.includes("android") || message.includes("kotlin") || message.includes("mvvm") || message.includes("travel_budgeting_app") || message.includes("financial api")) {
    return "Add or rewrite a travel_budgeting_app project bullet using Android, Kotlin, Jetpack Compose, MVVM, LiveData, Firebase, or Plaid API evidence. Update coverage_plan to the project bullet.";
  }
  return "Modify the existing planned bullet slot when possible; otherwise add the required project/bullet and update coverage_plan to point at the new slot.";
}

export function buildSystemPrompt(): string {
  return [
    "You generate ATS-safe resume JSON only.",
    "Use only facts present in evidence_cards or grounded synonym rules.",
    "Select and rewrite evidence-backed bullets before choosing skills.",
    "Return a coverage_plan that maps each prefer_bullet target to the exact work/project bullet that covers it.",
    "Follow keyword_coverage_plan: prefer_bullet terms must be covered naturally in work/project bullets, skill_ok terms may appear in compact skills, omit and needs_source_update terms must not be claimed exactly.",
    "Skills never satisfy prefer_bullet targets, even when a matching tool appears in Skills.",
    "Skills is not a dumping ground for uncovered job-description keywords.",
    "Use bullet examples like CI/CD/deployment pipelines through Jenkins or GitHub Actions deployment work, containerized systems through Docker in a bullet, OOP/design patterns through SOLID or MonoGame pattern work, UI through React/TypeScript interface work, testing through Playwright/Jest/pytest work, monitoring/alerts through CloudWatch work, and analytics through Athena/Glue or dashboard evidence.",
    "Do not rewrite static profile data, employers, titles, dates, locations, education, or certifications.",
    "work_experience must contain exactly one entry per job_id in the profile; never merge multiple roles at the same employer into a single entry.",
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
  const keywordCoveragePlan = buildKeywordCoveragePlan(request.job_description, request.evidence_cards);

  return JSON.stringify({
    task: "Generate a one-page tailored resume content object.",
    bullet_first_contract: {
      rule: "Cover important JD terms through grounded work/project bullets before adding or ordering skills.",
      invalid_coverage: "A prefer_bullet term covered only in skills is invalid and will be repaired; skills receive no credit for prefer_bullet targets.",
      project_rule: "If a high-priority JD term is best supported by a project_fact, select that project and write project bullets from that evidence.",
      coverage_plan_rule: "For every high_priority_bullet_target, add one coverage_plan entry with target_term, canonical, selected_evidence_refs, section, bullet_index, and job_id or project_id. The planned bullet must use at least one selected_evidence_ref and naturally contain the target or a claimable synonym.",
      high_priority_bullet_targets: keywordCoveragePlan.prefer_bullet.map((item) => ({
        term: item.term,
        canonical: item.canonical,
        evidence_refs: item.evidence_refs,
        matched_terms: item.matched_terms,
        claimable_terms: expandGroundedSynonyms(item.canonical),
        required_bullet_instruction: bulletTargetInstruction(item.canonical)
      })),
      project_candidates: request.evidence_cards
        .filter((card) => card.project_id && (card.type === "project_fact" || !card.parent_job_id))
        .map(compactEvidenceCard)
    },
    project_selection_rules: projectSelectionRules(request.job_description, request.evidence_cards),
    page_fit_contract: {
      target: "90-95% of one page",
      hard_rule: "Do not leave the page sparse. Prefer adding grounded work/project bullets before trimming.",
      work_density: "work_experience must have exactly 4 entries: captech_consultant (Software Consultant, 3 bullets), captech (Associate Software Consultant, 4 bullets), publicis_sapient (2 bullets), sallie_mae (2 bullets). Never merge captech_consultant and captech into one entry.",
      project_density: "Select 1-2 projects with 2-4 total project bullets.",
      compression_rule: "Only compress or remove content when the hard max is exceeded; never pad with unsupported claims."
    },
    output_shape: {
      role_mode: request.role_mode,
      coverage_plan: [
        {
          target_term: "CI/CD",
          canonical: "CI/CD",
          selected_evidence_refs: ["captech_f100_jenkins_coordination"],
          section: "work_experience",
          job_id: "captech",
          bullet_index: 1
        },
        {
          target_term: "design patterns",
          canonical: "design patterns",
          selected_evidence_refs: ["mario_collision_state_command_factory"],
          section: "projects",
          project_id: "mario_monogame",
          bullet_index: 0
        }
      ],
      skills: ["ordered source-grounded skill strings"],
      work_experience: [
        { job_id: "captech_consultant", bullets: [{ text: "string", evidence_refs: ["evidence_id"], jd_keywords: ["keyword"] }] },
        { job_id: "captech", bullets: [{ text: "string", evidence_refs: ["evidence_id"], jd_keywords: ["keyword"] }] },
        { job_id: "publicis_sapient", bullets: [{ text: "string", evidence_refs: ["evidence_id"], jd_keywords: ["keyword"] }] },
        { job_id: "sallie_mae", bullets: [{ text: "string", evidence_refs: ["evidence_id"], jd_keywords: ["keyword"] }] }
      ],
      projects: [{ project_id: "allowed project id", display_name: "static display name", bullets: [{ text: "string", evidence_refs: ["evidence_id"], jd_keywords: ["keyword"] }], alternates: ["allowed project id"] }],
      unsupported_terms: ["JD terms that evidence does not support"]
    },
    keyword_coverage_plan: keywordCoveragePlan,
    skills_policy: {
      style: "compact original-resume-style skills, not a stuffed keyword dump",
      prefer_bullets_for: "important JD requirements with contextual evidence",
      avoid_standalone_skill_labels: [
        "ES6+", "CI/CD", "unit testing", "automated testing", "test automation", "SOLID",
        "OOP", "Agile", "Scrum", "design patterns", "idempotency", "event-driven architecture",
        "document vector store", "boto3", "MonoGame", "NLP"
      ],
      prefer_concrete_skill_labels: ["JavaScript", "React", "Spring Boot", "AWS", "Docker", "Git", "Jenkins", "Playwright"],
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
  const targetedRepairs = issues
    .filter((issue) => [
      "keyword_prefer_bullet_not_covered",
      "coverage_plan_missing_target",
      "coverage_plan_unused_target",
      "coverage_plan_unused_evidence",
      "required_project_missing"
    ].includes(issue.code))
    .map((issue) => ({
      code: issue.code,
      path: issue.path,
      issue_message: issue.message,
      instruction: targetedInstructionForIssue(issue),
      candidate_evidence_cards: candidateEvidenceFromIssue(issue, evidenceCards)
    }));

  return JSON.stringify({
    task: "Repair the previous resume JSON. Return only valid JSON.",
    validation_issues: issues,
    targeted_repairs: targetedRepairs,
    repair_rules: [
      "Do not return the same bullet counts when validation says the resume is underfilled.",
      "Preserve strong existing bullets; make targeted edits to the bullets named in validation_issues and targeted_repairs when possible.",
      "If resume_under_target_length, add grounded bullets from the same evidence cards before adding skills.",
      "If missing_work_experience, add a separate work_experience entry for that job_id with the correct bullet count; never merge two roles at the same employer into one entry.",
      "If job_under_min_bullets, add bullets for that job using valid evidence_refs.",
      "If project_count or project_under_min_bullets, return a projects array with 1-2 allowed projects and 3-4 total project bullets.",
      "For OOP, object-oriented design, data structures, algorithms, or design patterns, prefer the mario_monogame project when its evidence refs are available.",
      "If keyword_prefer_bullet_not_covered, rewrite a relevant work/project bullet using the candidate evidence refs; do not add the term only to skills.",
      "If keyword_prefer_bullet_not_covered mentions containerized systems, the repaired bullet text must explicitly include Docker or containerized work and use the candidate evidence ref.",
      "If coverage_plan_missing_target or coverage_plan_unused_target, update coverage_plan and the named bullet so selected_evidence_refs are actually used by that bullet.",
      "For Android, Kotlin, MVVM, mobile app architecture, financial API integration, Plaid, Firebase, or expense tracking, prefer travel_budgeting_app when its evidence refs are available.",
      "If required_project_missing, add the project_id named in the validation issue with bullets using that project's evidence refs.",
      "Required density after repair: CapTech Software Consultant 3 bullets, CapTech Associate 4 bullets, Publicis Sapient 2 bullets, Sallie Mae 2 bullets, projects 2-4 total bullets, at least 13 bullets overall.",
      "If resume_over_hard_max, compress bullets first, then remove project bullets before work bullets."
    ],
    previous_output: previousOutput,
    allowed_evidence_refs: evidenceCards.map((card) => card.id),
    project_repair_candidates: evidenceCards
      .filter((card) => card.project_id && (card.type === "project_fact" || !card.parent_job_id))
      .map(compactEvidenceCard),
    work_repair_candidates: evidenceCards
      .filter((card) => card.parent_job_id)
      .map(compactEvidenceCard),
    budgets: SECTION_BUDGETS
  });
}
