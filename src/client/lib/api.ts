import type { GenerateResumeRequest, GenerateResumeResponse, GenerateCoverLetterRequest, GenerateCoverLetterResponse, ValidationIssue } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:3001";

export async function generateResume(request: GenerateResumeRequest): Promise<GenerateResumeResponse> {
  const response = await fetch(`${API_BASE_URL}/api/generate-resume`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      job_description: request.jobDescription,
      role_mode: request.roleMode,
      profile: request.staticProfile,
      evidence_cards: request.evidenceCards,
      allowed_project_ids: request.staticProfile.allowed_projects.map((project) => project.project_id)
    }),
  });

  const body = await response.json().catch(() => null);

  if (!response.ok || body?.ok === false) {
    const issues = normalizeIssues(body?.errors);
    const message = issues.length > 0
      ? issues.map((issue) => issue.path ? `${issue.path}: ${issue.message}` : issue.message).join("\n")
      : body?.error || body?.message || `Generation API returned ${response.status}.`;
    throw new Error(message);
  }

  if (!body?.resume) {
    throw new Error("Generation API returned an invalid response: missing resume.");
  }

  const validationIssues = normalizeIssues(body.validation_issues ?? body.validationIssues);
  if (body.mode === "mock") {
    validationIssues.push({
      severity: "warning",
      code: "mock_generation_mode",
      message: "Running in mock mode because LLM_API_KEY is not configured; generated resumes are deterministic test data."
    });
  }

  return {
    resume: body.resume,
    keywordReport: body.keyword_report ?? body.keywordReport,
    fitReport: body.fit_report ?? body.fitReport,
    mode: body.mode,
    validationIssues
  };
}

export async function generateCoverLetter(request: GenerateCoverLetterRequest): Promise<GenerateCoverLetterResponse> {
  const response = await fetch(`${API_BASE_URL}/api/generate-cover-letter`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      job_description: request.jobDescription,
      role_mode: request.roleMode,
      profile: request.staticProfile,
      evidence_cards: request.evidenceCards,
      resume_keyword_report: request.resumeKeywordReport,
      company_name: request.companyName,
      position_title: request.positionTitle
    }),
  });

  const body = await response.json().catch(() => null);

  if (!response.ok || body?.ok === false) {
    const issues = normalizeIssues(body?.errors);
    const message = issues.length > 0
      ? issues.map((issue) => issue.path ? `${issue.path}: ${issue.message}` : issue.message).join("\n")
      : body?.error || body?.message || `Cover letter API returned ${response.status}.`;
    throw new Error(message);
  }

  const coverLetter = body?.cover_letter ?? body?.coverLetter;
  if (!coverLetter) {
    throw new Error("Cover letter API returned an invalid response: missing cover_letter.");
  }

  const validationIssues = normalizeIssues(body.validation_issues ?? body.validationIssues);
  if (body.mode === "mock") {
    validationIssues.push({
      severity: "warning",
      code: "mock_generation_mode",
      message: "Running in mock mode because LLM_API_KEY is not configured; generated cover letters are deterministic test data."
    });
  }

  return {
    coverLetter,
    fitReport: body.fit_report ?? body.fitReport,
    mode: body.mode,
    validationIssues
  };
}

function normalizeIssues(value: unknown): ValidationIssue[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => {
    const issue = item as Partial<ValidationIssue>;
    return {
      severity: issue.severity ?? "error",
      code: issue.code,
      message: issue.message ?? "Validation failed.",
      path: issue.path
    };
  });
}
