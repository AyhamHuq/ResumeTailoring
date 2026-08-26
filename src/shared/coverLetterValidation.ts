import { COVER_LETTER_BUDGETS } from "./constants";
import { countWords } from "./budgets";
import {
  GeneratedCoverLetterSchema,
  type CoverLetterFitReport,
  type EvidenceCard,
  type GeneratedCoverLetter,
  type KeywordReport,
  type ValidationIssue
} from "./schemas";

type CoverLetterValidationContext = {
  evidenceCards: EvidenceCard[];
  jobDescription?: string;
  keywordReport?: KeywordReport;
};

export type CoverLetterValidationResult = {
  success: boolean;
  valid: boolean;
  coverLetter?: GeneratedCoverLetter;
  fit_report?: CoverLetterFitReport;
  issues: ValidationIssue[];
};

function issue(code: string, path: string, message: string): ValidationIssue {
  return { code, path, message, severity: "error" };
}

function allParagraphs(cl: GeneratedCoverLetter) {
  return [cl.opening, ...cl.body_paragraphs, cl.closing];
}

function calculateFitReport(cl: GeneratedCoverLetter): CoverLetterFitReport {
  const paragraphs = allParagraphs(cl);
  const totalWords = paragraphs.reduce((sum, p) => sum + countWords(p.text), 0);
  const evidenceRefs = new Set(paragraphs.flatMap((p) => p.evidence_refs));
  const paragraphCount = paragraphs.length;

  const status = totalWords < COVER_LETTER_BUDGETS.totalWords.min
    ? "under_target" as const
    : totalWords > COVER_LETTER_BUDGETS.totalWords.hardMax
      ? "over_target" as const
      : "target" as const;

  return {
    total_words: totalWords,
    target_min_words: COVER_LETTER_BUDGETS.totalWords.min,
    target_max_words: COVER_LETTER_BUDGETS.totalWords.max,
    paragraph_count: paragraphCount,
    evidence_ref_count: evidenceRefs.size,
    status
  };
}

export function validateGeneratedCoverLetter(
  candidate: unknown,
  context: CoverLetterValidationContext
): CoverLetterValidationResult {
  const parsed = GeneratedCoverLetterSchema.safeParse(candidate);
  const issues: ValidationIssue[] = [];

  if (!parsed.success) {
    for (const zodIssue of parsed.error.issues) {
      issues.push(issue("schema_error", zodIssue.path.join(".") || "$", zodIssue.message));
    }
    return { success: false, valid: false, issues };
  }

  const cl = parsed.data;
  const evidenceIds = new Set(context.evidenceCards.map((card) => card.id));
  const paragraphs = allParagraphs(cl);

  // Word count validation
  const totalWords = paragraphs.reduce((sum, p) => sum + countWords(p.text), 0);
  if (totalWords < COVER_LETTER_BUDGETS.totalWords.min) {
    issues.push(issue(
      "under_target_length",
      "cover_letter",
      `Cover letter has ${totalWords} words; minimum is ${COVER_LETTER_BUDGETS.totalWords.min}.`
    ));
  }
  if (totalWords > COVER_LETTER_BUDGETS.totalWords.hardMax) {
    issues.push(issue(
      "over_target_length",
      "cover_letter",
      `Cover letter has ${totalWords} words; hard max is ${COVER_LETTER_BUDGETS.totalWords.hardMax}.`
    ));
  }

  // Opening word count
  const openingWords = countWords(cl.opening.text);
  if (openingWords < COVER_LETTER_BUDGETS.openingWords.min) {
    issues.push(issue("opening_too_short", "opening", `Opening has ${openingWords} words; minimum is ${COVER_LETTER_BUDGETS.openingWords.min}.`));
  }
  if (openingWords > COVER_LETTER_BUDGETS.openingWords.max) {
    issues.push(issue("opening_too_long", "opening", `Opening has ${openingWords} words; max is ${COVER_LETTER_BUDGETS.openingWords.max}.`));
  }

  // Body paragraph word counts
  cl.body_paragraphs.forEach((p, i) => {
    const words = countWords(p.text);
    if (words < COVER_LETTER_BUDGETS.bodyParagraphWords.min) {
      issues.push(issue("body_paragraph_too_short", `body_paragraphs.${i}`, `Body paragraph ${i} has ${words} words; minimum is ${COVER_LETTER_BUDGETS.bodyParagraphWords.min}.`));
    }
    if (words > COVER_LETTER_BUDGETS.bodyParagraphWords.max) {
      issues.push(issue("body_paragraph_too_long", `body_paragraphs.${i}`, `Body paragraph ${i} has ${words} words; max is ${COVER_LETTER_BUDGETS.bodyParagraphWords.max}.`));
    }
  });

  // Closing word count
  const closingWords = countWords(cl.closing.text);
  if (closingWords < COVER_LETTER_BUDGETS.closingWords.min) {
    issues.push(issue("closing_too_short", "closing", `Closing has ${closingWords} words; minimum is ${COVER_LETTER_BUDGETS.closingWords.min}.`));
  }
  if (closingWords > COVER_LETTER_BUDGETS.closingWords.max) {
    issues.push(issue("closing_too_long", "closing", `Closing has ${closingWords} words; max is ${COVER_LETTER_BUDGETS.closingWords.max}.`));
  }

  // Paragraph count (opening + body + closing)
  const paragraphCount = paragraphs.length;
  if (paragraphCount < COVER_LETTER_BUDGETS.paragraphs.min) {
    issues.push(issue("too_few_paragraphs", "cover_letter", `Cover letter has ${paragraphCount} paragraphs; minimum is ${COVER_LETTER_BUDGETS.paragraphs.min}.`));
  }
  if (paragraphCount > COVER_LETTER_BUDGETS.paragraphs.max) {
    issues.push(issue("too_many_paragraphs", "cover_letter", `Cover letter has ${paragraphCount} paragraphs; max is ${COVER_LETTER_BUDGETS.paragraphs.max}.`));
  }

  // Evidence ref validation
  const allRefs = new Set<string>();
  for (const p of paragraphs) {
    for (const ref of p.evidence_refs) {
      allRefs.add(ref);
      if (!evidenceIds.has(ref)) {
        issues.push(issue("invalid_evidence_ref", "evidence_refs", `Evidence ref '${ref}' does not exist.`));
      }
    }
  }

  // Body paragraphs must each have at least 1 evidence ref
  cl.body_paragraphs.forEach((p, i) => {
    if (p.evidence_refs.length === 0) {
      issues.push(issue("missing_evidence_refs", `body_paragraphs.${i}.evidence_refs`, `Body paragraph ${i} must reference at least one evidence card.`));
    }
  });

  // Total distinct evidence refs
  if (allRefs.size < COVER_LETTER_BUDGETS.minEvidenceRefs) {
    issues.push(issue(
      "insufficient_evidence_refs",
      "cover_letter",
      `Cover letter references ${allRefs.size} distinct evidence cards; minimum is ${COVER_LETTER_BUDGETS.minEvidenceRefs}.`
    ));
  }

  // Keyword coverage
  const allKeywords = new Set(paragraphs.flatMap((p) => p.jd_keywords));
  if (allKeywords.size < COVER_LETTER_BUDGETS.minKeywordsCovered) {
    issues.push(issue(
      "insufficient_keywords",
      "cover_letter",
      `Cover letter covers ${allKeywords.size} JD keywords; minimum is ${COVER_LETTER_BUDGETS.minKeywordsCovered}.`
    ));
  }

  const fitReport = calculateFitReport(cl);

  return {
    success: issues.length === 0,
    valid: issues.length === 0,
    coverLetter: cl,
    fit_report: fitReport,
    issues
  };
}
