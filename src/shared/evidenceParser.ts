import { EvidenceCardSchema, type EvidenceCard, type JobId, type RoleMode } from "./schemas";

const REQUIRED_SECTIONS = ["CapTech Ventures", "Publicis Sapient", "Sallie Mae", "Additional Projects"] as const;

type KnownFact = {
  id: string;
  type: EvidenceCard["type"];
  title: string;
  section: string;
  required: RegExp[];
  parent_job_id?: JobId;
  project_id?: string;
  skills: string[];
  metrics?: string[];
  role_tags: Exclude<RoleMode, "auto">[];
};

const KNOWN_FACTS: KnownFact[] = [
  {
    id: "captech_f100_idempotency",
    type: "work_project_fact",
    title: "Idempotent direct messaging migration",
    section: "CapTech Ventures",
    parent_job_id: "captech",
    project_id: "captech_f100_messaging",
    required: [/idempot/i, /sqs|queue|messag/i],
    skills: ["SQS", "idempotency", "event-driven architecture"],
    role_tags: ["backend", "cloud", "consulting"]
  },
  {
    id: "captech_bedrock_precision_recall",
    type: "work_project_fact",
    title: "Bedrock AI evaluation with precision and recall",
    section: "CapTech Ventures",
    parent_job_id: "captech",
    project_id: "captech_bedrock_ai",
    required: [/bedrock/i, /precision|recall/i],
    skills: ["Amazon Bedrock", "precision", "recall", "AI evaluation"],
    role_tags: ["ai", "cloud", "consulting"]
  },
  {
    id: "captech_golf_10000_itineraries",
    type: "work_project_fact",
    title: "Golf itinerary generation at 10,000 record scale",
    section: "CapTech Ventures",
    parent_job_id: "captech",
    project_id: "captech_golf_itinerary",
    required: [/golf/i, /10,?000|itinerar/i],
    skills: ["itinerary generation", "automation", "data processing"],
    metrics: ["10,000 itineraries"],
    role_tags: ["backend", "consulting"]
  },
  {
    id: "publicis_langchain_rag",
    type: "work_project_fact",
    title: "LangChain RAG internship project",
    section: "Publicis Sapient",
    parent_job_id: "publicis_sapient",
    project_id: "publicis_rag",
    required: [/langchain/i, /\brag\b|retrieval/i],
    skills: ["LangChain", "RAG", "retrieval", "LLM"],
    role_tags: ["ai", "backend", "consulting"]
  },
  {
    id: "sallie_mae_200_accounts",
    type: "work_project_fact",
    title: "Cloud work across nearly 200 accounts",
    section: "Sallie Mae",
    parent_job_id: "sallie_mae",
    project_id: "sallie_mae_cloud",
    required: [/200|two hundred|account/i, /cloud|aws|account/i],
    skills: ["AWS", "cloud accounts", "IAM"],
    metrics: ["~200 accounts"],
    role_tags: ["cloud", "consulting"]
  },
  {
    id: "aep_pytorch_faiss_20000_records",
    type: "project_fact",
    title: "AEP AI safety classifier with FAISS retrieval",
    section: "Additional Projects",
    project_id: "aep_ai_safety",
    required: [/aep|safety/i, /pytorch/i, /faiss/i, /20,?000|records/i],
    skills: ["PyTorch", "FAISS", "NLP", "classification", "React Native", "Flask"],
    metrics: ["20,000 records"],
    role_tags: ["ai", "full_stack"]
  },
  {
    id: "mario_collision_state_command_factory",
    type: "project_fact",
    title: "MonoGame Mario collision and design pattern architecture",
    section: "Additional Projects",
    project_id: "mario_monogame",
    required: [/mario|monogame/i, /collision/i, /state/i, /command|factory/i],
    skills: ["C#", "MonoGame", "collision", "state machine", "command pattern", "factory pattern"],
    role_tags: ["backend", "full_stack"]
  }
];

function normalizeText(text: string): string {
  return text.replace(/\r/g, "").replace(/\u00a0/g, " ").replace(/[ \t]+/g, " ").trim();
}

function sectionPattern(section: string): RegExp {
  return new RegExp(`(^|\\n)\\s*(?:#+\\s*)?${section.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b.*($|\\n)`, "i");
}

function assertRequiredSections(text: string): void {
  const missing = REQUIRED_SECTIONS.filter((section) => !sectionPattern(section).test(text));
  if (missing.length > 0) {
    throw new Error(`Braindump is missing required section(s): ${missing.join(", ")}.`);
  }
}

function getSectionText(text: string, section: string): string {
  const startMatch = sectionPattern(section).exec(text);
  if (!startMatch || startMatch.index === undefined) {
    return "";
  }
  const start = startMatch.index + startMatch[0].length;
  const nextStarts = REQUIRED_SECTIONS
    .filter((candidate) => candidate !== section)
    .map((candidate) => sectionPattern(candidate).exec(text.slice(start))?.index)
    .filter((index): index is number => typeof index === "number" && index >= 0);
  const end = nextStarts.length > 0 ? start + Math.min(...nextStarts) : text.length;
  return text.slice(start, end).trim();
}

function sentenceAround(sectionText: string, fact: KnownFact): string {
  const sentences = sectionText.split(/(?<=[.!?])\s+|\n+/).map((part) => part.trim()).filter(Boolean);
  const match = sentences.find((sentence) => fact.required.some((pattern) => pattern.test(sentence)));
  return match ?? sectionText.slice(0, 500);
}

function genericCardsForSection(section: string, sectionText: string): EvidenceCard[] {
  const parent_job_id = section === "CapTech Ventures"
    ? "captech"
    : section === "Publicis Sapient"
      ? "publicis_sapient"
      : section === "Sallie Mae"
        ? "sallie_mae"
        : undefined;
  const prefix = parent_job_id ?? "additional_projects";
  return sectionText
    .split(/\n+/)
    .map((line) => line.replace(/^[-*\u2022]\s*/, "").trim())
    .filter((line) => line.length >= 40)
    .slice(0, 12)
    .map((line, index) => EvidenceCardSchema.parse({
      id: `${prefix}_fact_${index + 1}`,
      type: parent_job_id ? "work_project_fact" : "project_fact",
      parent_job_id,
      title: line.slice(0, 80),
      evidence_text: line,
      skills: extractSkills(line),
      metrics: extractMetrics(line),
      role_tags: inferRoleTags(line),
      source_heading: section
    }));
}

function extractSkills(text: string): string[] {
  const skills = ["AWS", "Lambda", "SQS", "DynamoDB", "Spring", "Java", "Python", "TypeScript", "React", "LangChain", "RAG", "FAISS", "PyTorch", "C#", "CloudFormation", "CDK", "Ansible", "Jenkins", "GitHub Actions", "Vercel", "CloudWatch"];
  const lower = text.toLowerCase();
  return skills.filter((skill) => lower.includes(skill.toLowerCase()));
}

function extractMetrics(text: string): string[] {
  return text.match(/\b(?:~?\d{2,}(?:,\d{3})?|\d+%)\s*[A-Za-z%]*/g) ?? [];
}

function inferRoleTags(text: string): Exclude<RoleMode, "auto">[] {
  const lower = text.toLowerCase();
  const tags = new Set<Exclude<RoleMode, "auto">>();
  if (/aws|cloud|lambda|sqs|dynamodb|cloudformation|cdk|cloudwatch/.test(lower)) tags.add("cloud");
  if (/api|spring|java|python|backend|database|queue/.test(lower)) tags.add("backend");
  if (/react|frontend|full.?stack|typescript/.test(lower)) tags.add("full_stack");
  if (/ai|llm|rag|pytorch|faiss|nlp|bedrock/.test(lower)) tags.add("ai");
  if (/client|stakeholder|consult|delivery|presentation/.test(lower)) tags.add("consulting");
  return [...tags];
}

export function parseEvidenceCards(rawText: string): EvidenceCard[] {
  const text = normalizeText(rawText);
  assertRequiredSections(text);
  const cards: EvidenceCard[] = [];

  for (const fact of KNOWN_FACTS) {
    const sectionText = getSectionText(text, fact.section);
    if (fact.required.every((pattern) => pattern.test(sectionText))) {
      cards.push(EvidenceCardSchema.parse({
        id: fact.id,
        type: fact.type,
        parent_job_id: fact.parent_job_id,
        project_id: fact.project_id,
        title: fact.title,
        evidence_text: sentenceAround(sectionText, fact),
        skills: fact.skills,
        metrics: fact.metrics ?? extractMetrics(sectionText),
        role_tags: fact.role_tags,
        source_heading: fact.section
      }));
    }
  }

  for (const section of REQUIRED_SECTIONS) {
    cards.push(...genericCardsForSection(section, getSectionText(text, section)));
  }

  const byId = new Map<string, EvidenceCard>();
  for (const card of cards) byId.set(card.id, card);
  return [...byId.values()];
}

export const parseBraindumpText = parseEvidenceCards;
export const textToEvidenceCards = parseEvidenceCards;
export const buildEvidenceCards = parseEvidenceCards;
