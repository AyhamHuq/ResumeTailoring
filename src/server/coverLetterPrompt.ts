import {
  COVER_LETTER_BUDGETS,
  buildKeywordCoveragePlan,
  type EvidenceCard,
  type GenerateCoverLetterRequest,
  type KeywordReport,
  type ResumeProfile,
  type ValidationIssue
} from "../shared";
import { compactEvidenceCard } from "./prompt";

export function buildCoverLetterSystemPrompt(): string {
  return [
    "You generate a tailored cover letter as JSON only.",
    "Use only facts present in evidence_cards. Every claim must trace to evidence_refs.",
    "The cover letter complements the resume; do not repeat resume bullet text verbatim. Expand on achievements narratively.",
    "Write in first person. Use a professional, confident tone. Avoid cliches like 'passionate about', 'excited to', 'I believe', or 'thrilled'.",
    "Reference the company name and position title naturally in the opening when provided.",
    "Each body paragraph should weave 1-3 JD keywords naturally into a narrative about a specific achievement or skill area.",
    "Include quantified outcomes from evidence cards when available (percentages, counts, time saved).",
    "The closing paragraph should express interest and include a forward-looking call to action.",
    "Target 250-400 words total. Opening: 40-80 words. Each body paragraph: 50-120 words. Closing: 30-60 words.",
    "Do not fabricate experiences, metrics, or company names not present in the evidence.",
    "Return only JSON matching the requested shape; no markdown or prose outside the JSON."
  ].join("\n");
}

export function buildCoverLetterUserPrompt(
  request: GenerateCoverLetterRequest,
  profile: ResumeProfile
): string {
  const keywordPlan = buildKeywordCoveragePlan(request.job_description, request.evidence_cards);

  const resumeCoveredKeywords = request.resume_keyword_report
    ? [
      ...request.resume_keyword_report.covered_in_bullets,
      ...request.resume_keyword_report.covered_in_skills_only
    ]
    : [];

  return JSON.stringify({
    task: "Generate a tailored cover letter as a JSON object.",
    letter_structure: {
      opening: "Hook the reader with a concise statement of fit for this role. Reference the company and position if provided. Purpose: 'hook'.",
      body_paragraph_1: "Highlight a key technical achievement relevant to the JD. Use specific evidence with metrics. Purpose: 'technical_depth'.",
      body_paragraph_2: "Show leadership, collaboration, or delivery impact relevant to the role. Purpose: 'leadership_impact'.",
      body_paragraph_3_optional: "If needed, address cultural fit, cross-functional work, or a distinctive qualification. Purpose: 'cultural_fit'.",
      closing: "Restate interest, summarize value, and include a call to action. Purpose: 'closing'."
    },
    complement_strategy: {
      rule: "The cover letter should expand on achievements narratively rather than restating resume bullets. Use the resume_covered_keywords to identify terms already covered; the cover letter should provide the 'story behind the bullet'.",
      resume_covered_keywords: resumeCoveredKeywords,
      high_value_narrative_targets: keywordPlan.prefer_bullet.map((item) => ({
        term: item.term,
        canonical: item.canonical,
        evidence_refs: item.evidence_refs
      }))
    },
    output_shape: {
      role_mode: request.role_mode,
      salutation: "Dear Hiring Manager,",
      opening: {
        text: "paragraph text",
        evidence_refs: [],
        jd_keywords: ["keyword"],
        purpose: "hook"
      },
      body_paragraphs: [
        {
          text: "paragraph text with specific achievement",
          evidence_refs: ["evidence_card_id"],
          jd_keywords: ["keyword"],
          purpose: "technical_depth"
        }
      ],
      closing: {
        text: "closing paragraph",
        evidence_refs: [],
        jd_keywords: [],
        purpose: "closing"
      },
      sign_off: "Sincerely,",
      complementary_keywords: ["keywords covered narratively in the letter"]
    },
    budgets: COVER_LETTER_BUDGETS,
    static_profile: {
      name: profile.name,
      contact: profile.contact
    },
    job_description: request.job_description,
    role_mode: request.role_mode,
    company_name: request.company_name ?? null,
    position_title: request.position_title ?? null,
    evidence_cards: request.evidence_cards.map(compactEvidenceCard)
  });
}

export function buildCoverLetterRepairPrompt(
  previousOutput: unknown,
  issues: ValidationIssue[],
  evidenceCards: EvidenceCard[]
): string {
  return JSON.stringify({
    task: "Repair the previous cover letter JSON. Return only valid JSON.",
    validation_issues: issues,
    repair_rules: [
      "If under_target_length, expand body paragraphs with more specific evidence and metrics.",
      "If over_target_length, trim without removing evidence references or key achievements.",
      "If missing_evidence_refs, add specific evidence card references to body paragraphs.",
      "If unsupported_claim, remove the ungrounded claim and replace with evidence-backed content.",
      "If insufficient_keywords, weave additional JD keywords naturally into existing paragraphs.",
      "Preserve the overall structure: opening, 2-3 body paragraphs, closing.",
      "Every body paragraph must reference at least one evidence card.",
      "Do not fabricate experiences or metrics."
    ],
    previous_output: previousOutput,
    allowed_evidence_refs: evidenceCards.map((card) => card.id),
    candidate_evidence_cards: evidenceCards.map(compactEvidenceCard),
    budgets: COVER_LETTER_BUDGETS
  });
}
