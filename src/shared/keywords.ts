import { GROUNDED_SYNONYMS } from "./constants";
import type { EvidenceCard, GeneratedResume, KeywordReport } from "./schemas";

const STOP_WORDS = new Set([
  "and", "the", "with", "for", "from", "that", "this", "will", "you", "are", "our", "your",
  "to", "of", "in", "on", "as", "a", "an", "or", "be", "by", "is", "we", "at", "it",
  "need", "needs", "using", "experience", "team", "role", "preferred"
]);

const KNOWN_TERMS = [
  "AWS", "Lambda", "SQS", "SNS", "DynamoDB", "S3", "Kinesis", "Spring", "Java", "Python",
  "TypeScript", "JavaScript", "React", "React Native", "Flask", "Docker", "Jest", "REST",
  "RAG", "LangChain", "Bedrock", "FAISS", "OpenSearch", "vector search", "PyTorch", "NLP", "C#", "OOP",
  "SOLID", "state machine", "command pattern", "factory pattern", "CI/CD", "Jenkins",
  "GitHub Actions", "Vercel", "cloud monitoring", "CloudWatch Logs", "CloudWatch Insights",
  "alarms", "logging", "tracing", "IaC", "CloudFormation", "CDK", "Ansible", "accessibility",
  "serverless", "Agile", "microservices", "APIs", "SQL", "Kubernetes", "GraphQL"
];

type KeywordInput = {
  jobDescription?: string;
  generatedResume?: Partial<GeneratedResume> | null;
  resume?: Partial<GeneratedResume> | null;
  evidenceCards?: Array<Partial<EvidenceCard>>;
};

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^\w#+/. -]/g, " ").replace(/\s+/g, " ").trim();
}

function dedupePreserveCase(values: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const value of values.map((item) => item.trim()).filter(Boolean)) {
    const key = normalize(value);
    if (!seen.has(key)) {
      seen.add(key);
      output.push(value);
    }
  }
  return output;
}

export function extractKeywords(text: string): string[] {
  const normalized = normalize(text);
  const known = KNOWN_TERMS.filter((term) => normalized.includes(normalize(term)));
  const technicalTokens = text.match(/\b[A-Z][A-Za-z0-9+#/.]*(?:[A-Z][A-Za-z0-9+#/.]*)?\b/g) ?? [];
  const compactTerms = text
    .replace(/[^\w#+/. -]/g, " ")
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 2)
    .filter((term) => !STOP_WORDS.has(term.toLowerCase()))
    .filter((term) => /[#/+]|^[A-Z0-9]+$/.test(term));

  return dedupePreserveCase([...known, ...technicalTokens, ...compactTerms]).slice(0, 80);
}

export function expandGroundedSynonyms(term: string): string[] {
  const normalized = normalize(term);
  const direct = GROUNDED_SYNONYMS[normalized] ?? [];
  const inverse = Object.entries(GROUNDED_SYNONYMS)
    .filter(([, synonyms]) => synonyms.some((synonym) => normalize(synonym) === normalized))
    .map(([canonical]) => canonical);
  return dedupePreserveCase([term, normalized, ...direct, ...inverse]);
}

function textContainsAny(haystack: string, terms: string[]): boolean {
  const normalized = normalize(haystack);
  return terms.some((term) => normalized.includes(normalize(term)));
}

function cardText(card: Partial<EvidenceCard>): string {
  return [
    card.evidence_text,
    card.title,
    Array.isArray(card.skills) ? card.skills.join(" ") : "",
    Array.isArray(card.metrics) ? card.metrics.join(" ") : "",
    card.source_heading
  ].filter((value): value is string => typeof value === "string").join(" ");
}

function skillName(skill: unknown): string {
  if (typeof skill === "string") {
    return skill;
  }
  if (skill && typeof skill === "object" && "name" in skill && typeof (skill as { name: unknown }).name === "string") {
    return (skill as { name: string }).name;
  }
  return "";
}

function bulletsText(resume: Partial<GeneratedResume> | null | undefined): string {
  const workBullets = resume?.work_experience?.flatMap((job) => job.bullets?.map((bullet) => bullet.text) ?? []) ?? [];
  const projectBullets = resume?.projects?.flatMap((project) => project.bullets?.map((bullet) => bullet.text) ?? []) ?? [];
  return [...workBullets, ...projectBullets].join(" ");
}

function skillsText(resume: Partial<GeneratedResume> | null | undefined): string {
  return (resume?.skills ?? []).map(skillName).filter(Boolean).join(" ");
}

export function evidenceSupportsKeyword(keyword: string, evidenceCards: Array<Partial<EvidenceCard>>): boolean {
  const terms = expandGroundedSynonyms(keyword);
  return evidenceCards.some((card) => textContainsAny(cardText(card), terms));
}

export function scoreKeywords(
  jobDescriptionOrInput: string | KeywordInput,
  resume?: Partial<GeneratedResume> | null,
  evidenceCards: Array<Partial<EvidenceCard>> = []
): KeywordReport {
  const input = typeof jobDescriptionOrInput === "string"
    ? { jobDescription: jobDescriptionOrInput, generatedResume: resume, evidenceCards }
    : jobDescriptionOrInput;
  const jobDescription = input.jobDescription ?? "";
  const generatedResume = input.generatedResume ?? input.resume ?? null;
  const cards = input.evidenceCards ?? [];
  const keywords = extractKeywords(jobDescription);
  const bulletText = bulletsText(generatedResume);
  const skillText = skillsText(generatedResume);

  const report: KeywordReport = {
    covered_in_bullets: [],
    covered_in_skills_only: [],
    supported_but_omitted_for_space: [],
    unsupported: []
  };

  for (const keyword of keywords) {
    const terms = expandGroundedSynonyms(keyword);
    if (textContainsAny(bulletText, terms)) {
      report.covered_in_bullets.push(keyword);
    } else if (textContainsAny(skillText, terms)) {
      report.covered_in_skills_only.push(keyword);
    } else if (evidenceSupportsKeyword(keyword, cards)) {
      report.supported_but_omitted_for_space.push(keyword);
    } else {
      report.unsupported.push(keyword);
    }
  }

  return report;
}

export const classifyKeywords = scoreKeywords;
export const buildKeywordReport = scoreKeywords;
