import { GROUNDED_SYNONYMS } from "./constants";
import {
  KEYWORD_ALTERNATIVE_GROUPS,
  KEYWORD_TAXONOMY,
  TAXONOMY_KNOWN_TERMS,
  type KeywordAlternativeGroup,
  type KeywordTaxonomyEntry
} from "./keywordTaxonomy";
import type {
  EvidenceCard,
  GeneratedResume,
  KeywordPlacementRecommendation,
  KeywordReport,
  KeywordReportItem,
  KeywordStatus,
  KeywordSupportLevel
} from "./schemas";

const STOP_WORDS = new Set([
  "and", "the", "with", "for", "from", "that", "this", "will", "you", "are", "our", "your",
  "to", "of", "in", "on", "as", "a", "an", "or", "be", "by", "is", "we", "at", "it",
  "need", "needs", "using", "experience", "team", "role", "preferred", "job", "description",
  "what", "utilize", "execute", "troubleshoot", "contribute", "participate", "minimum",
  "requirements", "requirement", "bachelor", "master", "education", "professional",
  "computer", "science", "systems", "software", "developers", "developer", "designing",
  "writing", "performing", "position", "occupation", "object", "responsibilities", "required"
]);

const BASE_KNOWN_TERMS = [
  "React Native", "GitHub Actions", "RESTful APIs", "RESTful API", "REST APIs", "REST API",
  "CloudWatch Logs", "CloudWatch Insights", "API Gateway", "Azure DevOps", "Azure SQL",
  "AWS", "Lambda", "SQS", "SNS", "DynamoDB", "S3", "Kinesis", "Spring", "Spring Boot",
  "JavaScript", "TypeScript", "Java", "Python", "Golang", "React", "Flask", "Docker",
  "Jest", "pytest", "JUnit", "RESTful", "REST", "RAG", "LangChain", "Bedrock", "FAISS", "OpenSearch",
  "vector search", "PyTorch", "NLP", "C#", "OOP", "Object-Oriented", "Object Oriented",
  "SOLID", "state machine", "command pattern", "factory pattern", "CI/CD", "Jenkins", "TeamCity", "Vercel", "Scrum",
  "Agile", "Scaled Agile", "Playwright", "Cypress", "Selenium", "Karate", "XP", "ES6+", "ES6",
  "automated testing", "test automation", "automated tests", "unit testing", "cloud monitoring", "alarms",
  "logging", "tracing", "IaC", "infrastructure as code", "CloudFormation", "CDK", "Ansible", "accessibility",
  "serverless", "microservices", "APIs", "SQL", "SQLite", "Kubernetes", "GraphQL", "Git",
  "source control", "source control management", "deployment pipelines", "build processes",
  "configuration and deployment management", "deployment management", "public cloud services",
  "containerized systems", "data analytics", "analytics", "metrics", "monitors", "monitoring",
  "alerts", "instrumentation", "operational excellence", "CloudWatch alarms", "Athena", "Glue",
  "Pandas", "NumPy", "linear regression", "forecasting", "KPI dashboard", "code reviews",
  "coding standards", "root cause", "production issues", "debugging", "data structures"
];

const KNOWN_TERMS = dedupePreserveCase([...BASE_KNOWN_TERMS, ...TAXONOMY_KNOWN_TERMS]);

type KeywordInput = {
  jobDescription?: string;
  generatedResume?: Partial<GeneratedResume> | null;
  resume?: Partial<GeneratedResume> | null;
  evidenceCards?: Array<Partial<EvidenceCard>>;
};

type TermSet = {
  canonical: string;
  claimableTerms: string[];
  evidenceOnlyTerms: string[];
  allSupportTerms: string[];
  placement: KeywordPlacementRecommendation;
};

type MatchResult = {
  refs: string[];
  matchedTerms: string[];
};

type AlternativeGroupState = {
  group: KeywordAlternativeGroup;
  active: boolean;
  satisfied: boolean;
  satisfiedBy: string[];
};

export type KeywordCoveragePlan = {
  prefer_bullet: KeywordReportItem[];
  skill_ok: KeywordReportItem[];
  omit: KeywordReportItem[];
  needs_source_update: KeywordReportItem[];
};

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^\w#+/. -]/g, " ").replace(/\s+/g, " ").trim();
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsTerm(haystack: string, term: string): boolean {
  const normalizedTerm = normalize(term);
  if (!normalizedTerm) {
    return false;
  }

  const pattern = escapeRegex(normalizedTerm).replace(/\s+/g, "\\s+");
  return new RegExp(`(^|[^a-z0-9#+/-])${pattern}(?=$|[^a-z0-9#+/-])`, "i").test(normalize(haystack));
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

function technicalFallbackTokens(text: string): string[] {
  const tokens: string[] = [];
  const patterns = [
    /(^|[^A-Za-z0-9#+/-])([A-Z][A-Z0-9]{1,}\+?)(?=$|[^A-Za-z0-9#+/-])/g,
    /(^|[^A-Za-z0-9#+/-])([A-Z][A-Za-z0-9]*(?:[#/+.-][A-Za-z0-9]+)+\+?)(?=$|[^A-Za-z0-9#+/-])/g
  ];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      tokens.push(match[2]);
    }
  }

  return tokens.filter((term) => !STOP_WORDS.has(term.toLowerCase()));
}

export function extractKeywords(text: string): string[] {
  const known = KNOWN_TERMS.filter((term) => containsTerm(text, term));
  return dedupePreserveCase([...known, ...technicalFallbackTokens(text)]).slice(0, 80);
}

function taxonomyEntryFor(term: string): KeywordTaxonomyEntry | undefined {
  const key = normalize(term);
  const canonicalOrAlias = KEYWORD_TAXONOMY.find((entry) => {
    const terms = [
      entry.canonical,
      ...(entry.aliases ?? [])
    ];
    return terms.some((candidate) => normalize(candidate) === key);
  });
  if (canonicalOrAlias) {
    return canonicalOrAlias;
  }

  return KEYWORD_TAXONOMY.find((entry) => {
    const terms = [
      ...(entry.claimableAliases ?? []),
      ...(entry.evidenceOnlyAliases ?? [])
    ];
    return terms.some((candidate) => normalize(candidate) === key);
  });
}

function termsForKeyword(term: string): TermSet {
  const entry = taxonomyEntryFor(term);
  if (!entry) {
    const legacy = GROUNDED_SYNONYMS[normalize(term)] ?? [];
    const canonical = term;
    const claimableTerms = dedupePreserveCase([term, canonical, ...legacy]);
    return {
      canonical,
      claimableTerms,
      evidenceOnlyTerms: [],
      allSupportTerms: claimableTerms,
      placement: "skill_ok"
    };
  }

  const canonical = entry.canonical;
  const claimableTerms = dedupePreserveCase([
    term,
    canonical,
    ...(entry.aliases ?? []),
    ...(entry.claimableAliases ?? [])
  ]);
  const evidenceOnlyTerms = dedupePreserveCase(entry.evidenceOnlyAliases ?? []);

  return {
    canonical,
    claimableTerms,
    evidenceOnlyTerms,
    allSupportTerms: dedupePreserveCase([...claimableTerms, ...evidenceOnlyTerms]),
    placement: entry.placement
  };
}

export function expandGroundedSynonyms(term: string): string[] {
  return termsForKeyword(term).allSupportTerms;
}

function textContainsAny(haystack: string, terms: string[]): string[] {
  return terms.filter((term) => containsTerm(haystack, term));
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

function matchCards(
  cards: Array<Partial<EvidenceCard>>,
  terms: string[],
  predicate: (card: Partial<EvidenceCard>) => boolean
): MatchResult {
  const refs: string[] = [];
  const matchedTerms: string[] = [];

  for (const card of cards) {
    if (!predicate(card)) {
      continue;
    }
    const matches = textContainsAny(cardText(card), terms);
    if (matches.length > 0) {
      if (typeof card.id === "string") {
        refs.push(card.id);
      }
      matchedTerms.push(...matches);
    }
  }

  return {
    refs: dedupePreserveCase(refs),
    matchedTerms: dedupePreserveCase(matchedTerms)
  };
}

function contextualCards(cards: Array<Partial<EvidenceCard>>): Array<Partial<EvidenceCard>> {
  return cards.filter((card) => card.type !== "skill_fact");
}

function skillListCards(cards: Array<Partial<EvidenceCard>>): Array<Partial<EvidenceCard>> {
  return cards.filter((card) => card.type === "skill_fact");
}

function evidenceMatchFor(keyword: string, cards: Array<Partial<EvidenceCard>>) {
  const terms = termsForKeyword(keyword);
  const contextual = contextualCards(cards);
  const skillList = skillListCards(cards);

  const contextualClaimable = matchCards(contextual, terms.claimableTerms, () => true);
  const skillListClaimable = matchCards(skillList, terms.claimableTerms, () => true);
  const contextualEvidenceOnly = matchCards(contextual, terms.evidenceOnlyTerms, () => true);
  const skillListEvidenceOnly = matchCards(skillList, terms.evidenceOnlyTerms, () => true);

  return {
    terms,
    contextualClaimable,
    skillListClaimable,
    contextualEvidenceOnly,
    skillListEvidenceOnly
  };
}

export function evidenceSupportsKeyword(keyword: string, evidenceCards: Array<Partial<EvidenceCard>>): boolean {
  const match = evidenceMatchFor(keyword, evidenceCards);
  return [
    match.contextualClaimable,
    match.skillListClaimable,
    match.contextualEvidenceOnly,
    match.skillListEvidenceOnly
  ].some((result) => result.refs.length > 0);
}

export function evidenceSupportsClaim(keyword: string, evidenceCards: Array<Partial<EvidenceCard>>): boolean {
  const match = evidenceMatchFor(keyword, evidenceCards);
  return match.contextualClaimable.refs.length > 0 || match.skillListClaimable.refs.length > 0;
}

function statusForSupportLevel(supportLevel: KeywordSupportLevel): KeywordStatus {
  switch (supportLevel) {
    case "bullet":
      return "covered_in_bullets";
    case "resume_skill":
      return "covered_in_skills_only";
    case "contextual_evidence":
    case "skill_list_only":
    case "synonym_only":
      return "supported_but_omitted_for_space";
    case "alternative_satisfied":
      return "alternative_satisfied";
    case "unsupported":
      return "unsupported";
  }
}

function placementForSupport(keyword: string, supportLevel: KeywordSupportLevel): KeywordPlacementRecommendation {
  const terms = termsForKeyword(keyword);
  if (supportLevel === "unsupported" || supportLevel === "alternative_satisfied") {
    return "omit";
  }
  if (supportLevel === "skill_list_only") {
    return terms.placement === "prefer_bullet" ? "needs_source_update" : terms.placement;
  }
  if (supportLevel === "synonym_only") {
    return terms.placement === "omit" ? "omit" : "needs_source_update";
  }
  return terms.placement;
}

function classifyWithoutAlternatives(
  keyword: string,
  generatedResume: Partial<GeneratedResume> | null,
  evidenceCards: Array<Partial<EvidenceCard>>
): KeywordReportItem {
  const terms = termsForKeyword(keyword);
  const bulletMatches = textContainsAny(bulletsText(generatedResume), terms.claimableTerms);
  const skillMatches = textContainsAny(skillsText(generatedResume), terms.claimableTerms);
  let supportLevel: KeywordSupportLevel = "unsupported";
  let evidenceRefs: string[] = [];
  let matchedTerms: string[] = [];

  if (bulletMatches.length > 0) {
    supportLevel = "bullet";
    matchedTerms = bulletMatches;
  } else if (skillMatches.length > 0 && terms.placement !== "prefer_bullet") {
    supportLevel = "resume_skill";
    matchedTerms = skillMatches;
  } else {
    const evidenceMatch = evidenceMatchFor(keyword, evidenceCards);
    if (evidenceMatch.contextualClaimable.refs.length > 0) {
      supportLevel = "contextual_evidence";
      evidenceRefs = evidenceMatch.contextualClaimable.refs;
      matchedTerms = evidenceMatch.contextualClaimable.matchedTerms;
    } else if (evidenceMatch.skillListClaimable.refs.length > 0) {
      supportLevel = "skill_list_only";
      evidenceRefs = evidenceMatch.skillListClaimable.refs;
      matchedTerms = evidenceMatch.skillListClaimable.matchedTerms;
    } else if (evidenceMatch.contextualEvidenceOnly.refs.length > 0) {
      supportLevel = "synonym_only";
      evidenceRefs = evidenceMatch.contextualEvidenceOnly.refs;
      matchedTerms = evidenceMatch.contextualEvidenceOnly.matchedTerms;
    } else if (evidenceMatch.skillListEvidenceOnly.refs.length > 0) {
      supportLevel = "synonym_only";
      evidenceRefs = evidenceMatch.skillListEvidenceOnly.refs;
      matchedTerms = evidenceMatch.skillListEvidenceOnly.matchedTerms;
    }
  }

  const status = statusForSupportLevel(supportLevel);
  return {
    term: keyword,
    canonical: terms.canonical,
    status,
    support_level: supportLevel,
    evidence_refs: evidenceRefs,
    matched_terms: dedupePreserveCase(matchedTerms),
    placement_recommendation: placementForSupport(keyword, supportLevel)
  };
}

function activeAlternativeGroups(
  jobDescription: string,
  keywords: string[],
  generatedResume: Partial<GeneratedResume> | null,
  evidenceCards: Array<Partial<EvidenceCard>>
): AlternativeGroupState[] {
  const keywordSet = new Set(keywords.map(normalize));
  return KEYWORD_ALTERNATIVE_GROUPS.map((group) => {
    const active = group.trigger.test(jobDescription) && group.members.some((member) => keywordSet.has(normalize(member)));
    const memberItems = group.members.map((member) => classifyWithoutAlternatives(member, generatedResume, evidenceCards));
    const canonicalItem = classifyWithoutAlternatives(group.canonical, generatedResume, evidenceCards);
    const satisfiedItems = [canonicalItem, ...memberItems].filter((item) => item.support_level !== "unsupported");

    return {
      group,
      active,
      satisfied: active && satisfiedItems.length > 0,
      satisfiedBy: dedupePreserveCase(satisfiedItems.flatMap((item) => item.matched_terms.length > 0 ? item.matched_terms : [item.term]))
    };
  });
}

function alternativeGroupFor(keyword: string, groups: AlternativeGroupState[]): AlternativeGroupState | undefined {
  const key = normalize(keyword);
  return groups.find((state) => state.active && state.satisfied && state.group.members.some((member) => normalize(member) === key));
}

function classifyKeyword(
  keyword: string,
  generatedResume: Partial<GeneratedResume> | null,
  evidenceCards: Array<Partial<EvidenceCard>>,
  alternativeGroups: AlternativeGroupState[]
): KeywordReportItem {
  const item = classifyWithoutAlternatives(keyword, generatedResume, evidenceCards);
  if (item.support_level !== "unsupported") {
    return item;
  }

  const alternativeGroup = alternativeGroupFor(keyword, alternativeGroups);
  if (!alternativeGroup) {
    return item;
  }

  return {
    ...item,
    status: "alternative_satisfied",
    support_level: "alternative_satisfied",
    matched_terms: alternativeGroup.satisfiedBy,
    placement_recommendation: "omit"
  };
}

function pushLegacyBucket(report: KeywordReport, item: KeywordReportItem): void {
  if (item.status === "covered_in_bullets") {
    report.covered_in_bullets.push(item.term);
  } else if (item.status === "covered_in_skills_only") {
    report.covered_in_skills_only.push(item.term);
  } else if (item.status === "supported_but_omitted_for_space") {
    report.supported_but_omitted_for_space.push(item.term);
  } else if (item.status === "unsupported") {
    report.unsupported.push(item.term);
  }
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
  const alternativeGroups = activeAlternativeGroups(jobDescription, keywords, generatedResume, cards);

  const report: KeywordReport = {
    covered_in_bullets: [],
    covered_in_skills_only: [],
    supported_but_omitted_for_space: [],
    unsupported: [],
    details: []
  };

  for (const keyword of keywords) {
    const item = classifyKeyword(keyword, generatedResume, cards, alternativeGroups);
    report.details.push(item);
    pushLegacyBucket(report, item);
  }

  report.covered_in_bullets = dedupePreserveCase(report.covered_in_bullets);
  report.covered_in_skills_only = dedupePreserveCase(report.covered_in_skills_only);
  report.supported_but_omitted_for_space = dedupePreserveCase(report.supported_but_omitted_for_space);
  report.unsupported = dedupePreserveCase(report.unsupported);
  report.details = report.details.filter((item, index, items) => (
    items.findIndex((candidate) => normalize(candidate.term) === normalize(item.term)) === index
  ));

  return report;
}

export function buildKeywordCoveragePlan(
  jobDescription: string,
  evidenceCards: Array<Partial<EvidenceCard>>
): KeywordCoveragePlan {
  const report = scoreKeywords({ jobDescription, evidenceCards });
  return {
    prefer_bullet: report.details.filter((item) => item.placement_recommendation === "prefer_bullet"),
    skill_ok: report.details.filter((item) => item.placement_recommendation === "skill_ok"),
    omit: report.details.filter((item) => item.placement_recommendation === "omit"),
    needs_source_update: report.details.filter((item) => item.placement_recommendation === "needs_source_update")
  };
}

export function termsProhibitedAsClaims(report: KeywordReport | undefined): string[] {
  if (!report) {
    return [];
  }

  const fromDetails = (report.details ?? [])
    .filter((item) => (
      item.status === "unsupported"
      || item.support_level === "alternative_satisfied"
      || item.placement_recommendation === "omit"
      || item.placement_recommendation === "needs_source_update"
    ))
    .map((item) => item.term);

  return dedupePreserveCase([...(report.unsupported ?? []), ...fromDetails]);
}

export const classifyKeywords = scoreKeywords;
export const buildKeywordReport = scoreKeywords;
