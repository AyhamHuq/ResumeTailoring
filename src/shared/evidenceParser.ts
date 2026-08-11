import { EvidenceCardSchema, type EvidenceCard, type JobId, type RoleMode } from "./schemas";

const REQUIRED_SECTIONS = ["CapTech Ventures", "Publicis Sapient", "Sallie Mae", "Additional Projects"] as const;
const SKILL_SECTION = "Consolidated Skills and Keywords";
const SKILL_TERMS = [
  "AWS", "Lambda", "API Gateway", "SQS", "SNS", "DynamoDB", "Kinesis", "Spring", "Spring Boot",
  "Java", "Kotlin", "Golang", "Python", "TypeScript", "JavaScript", "ES6+", "ES6", "React", "React Native",
  "HTML", "CSS", "Node.js",
  "Android", "Jetpack Compose", "MVVM", "Model-View-ViewModel", "LiveData", "Firebase",
  "Firebase Authentication", "Plaid API",
  "Bedrock", "LangChain", "RAG", "OpenSearch", "FAISS", "PyTorch", "NLP", "C#", "Flask", "Tailwind CSS",
  "Tailwind", "AG Grid", "Amplitude", "RESTful APIs",
  "RESTful API", "REST APIs", "REST API", "RESTful", "Azure SQL", "SQLite", "CloudFormation",
  "CDK", "Ansible", "Jenkins", "GitHub Actions", "TeamCity", "Azure DevOps", "Vercel", "Docker", "Git",
  "CloudWatch", "CloudWatch Logs", "CloudWatch Insights", "CloudWatch alarms", "Athena", "Glue", "IAM", "Jest",
  "pytest", "JUnit", "Playwright", "Cypress", "Selenium", "Karate", "Postman", "Scrum", "Agile", "Scaled Agile",
  "CI/CD", "test automation", "automated testing", "unit testing", "OOP", "SOLID", "WCAG 2.2"
];

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
  // --- CapTech Ventures: Software Consultant (07/2026 – Present) ---
  {
    id: "captech_consultant_golf_engine",
    type: "work_project_fact",
    title: "Go recommendation engine for PGA Championship itineraries",
    section: "CapTech Ventures",
    parent_job_id: "captech_consultant",
    project_id: "captech_golf_itinerary",
    required: [/golang|go\b/i, /regret.?insertion|recommendation/i, /10,?000|itinerar/i],
    skills: ["Golang", "algorithms", "algorithm design", "recommendation systems", "route optimization", "regret insertion heuristic"],
    metrics: ["10,000+ itineraries", "78% accepted without regeneration"],
    role_tags: ["backend", "consulting"]
  },
  {
    id: "captech_consultant_golf_production_support",
    type: "work_project_fact",
    title: "9-day production support for engine and frontend during live PGA tournament",
    section: "CapTech Ventures",
    parent_job_id: "captech_consultant",
    project_id: "captech_golf_itinerary",
    required: [/production support|live tournament/i, /engine|frontend/i],
    skills: ["production support", "React", "TypeScript", "Golang", "incident response", "Amplitude"],
    metrics: ["9 days including weekends"],
    role_tags: ["backend", "full_stack", "consulting"]
  },
  {
    id: "captech_consultant_beverage_theming",
    type: "work_project_fact",
    title: "Enterprise React theming layer for leading beverage company",
    section: "CapTech Ventures",
    parent_job_id: "captech_consultant",
    project_id: "captech_beverage_theming",
    required: [/theming|design tokens/i, /beverage|light mode/i],
    skills: ["React", "TypeScript", "CSS", "Tailwind CSS", "AG Grid", "design tokens", "theming", "responsive user interfaces"],
    metrics: ["70+ files", "1,000+ lines of theming"],
    role_tags: ["full_stack", "consulting"]
  },
  // --- CapTech Ventures: Associate Software Consultant (07/2025 – 07/2026) ---
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
    id: "captech_f100_spring_lambda_dynamodb",
    type: "work_project_fact",
    title: "Spring, Lambda, DynamoDB, and Maestro messaging integration",
    section: "CapTech Ventures",
    parent_job_id: "captech",
    project_id: "captech_f100_messaging",
    required: [/spring/i, /lambda/i, /dynamodb/i, /maestro/i],
    skills: ["Java", "Spring Boot", "AWS Lambda", "DynamoDB", "Maestro API", "API integration"],
    role_tags: ["backend", "cloud", "consulting"]
  },
  {
    id: "captech_f100_jenkins_coordination",
    type: "work_project_fact",
    title: "Cross-team Jenkins production deployment during code freeze",
    section: "CapTech Ventures",
    parent_job_id: "captech",
    project_id: "captech_f100_messaging",
    required: [/jenkins/i, /production deployment|production release|code freeze/i, /3 teams|three teams|cross-functional/i],
    skills: ["Jenkins", "CI/CD", "production deployment", "cross-functional coordination", "change management"],
    metrics: ["millions of customers"],
    role_tags: ["consulting", "backend", "cloud"]
  },
  {
    id: "captech_bedrock_precision_recall",
    type: "work_project_fact",
    title: "Bedrock AI evaluation with precision and recall",
    section: "CapTech Ventures",
    parent_job_id: "captech",
    project_id: "captech_bedrock_ai",
    required: [/bedrock/i, /precision|recall/i],
    skills: ["Amazon Bedrock", "precision", "recall", "metrics", "AI evaluation"],
    role_tags: ["ai", "cloud", "consulting"]
  },
  {
    id: "captech_bedrock_rag_opensearch",
    type: "work_project_fact",
    title: "Bedrock RAG tool with OpenSearch retrieval and reranking",
    section: "CapTech Ventures",
    parent_job_id: "captech",
    project_id: "captech_bedrock_ai",
    required: [/bedrock/i, /rag|retrieval/i, /opensearch|vector/i, /rerank/i],
    skills: ["Amazon Bedrock", "RAG", "OpenSearch", "vector search", "reranking"],
    role_tags: ["ai", "cloud", "backend"]
  },
  {
    id: "captech_bedrock_multi_agent_eval",
    type: "work_project_fact",
    title: "Multi-agent Bedrock evaluation architecture",
    section: "CapTech Ventures",
    parent_job_id: "captech",
    project_id: "captech_bedrock_ai",
    required: [/multi-agent|supervisor agent|subagents/i, /bedrock evals|evaluator/i],
    skills: ["multi-agent architecture", "AWS Bedrock Evals", "semantic similarity", "LLM evaluation"],
    role_tags: ["ai", "cloud", "consulting"]
  },
  {
    id: "captech_serverless_cicd",
    type: "work_project_fact",
    title: "Serverless architecture with Docker and GitHub Actions CI/CD",
    section: "CapTech Ventures",
    parent_job_id: "captech",
    project_id: "captech_golf_itinerary",
    required: [/api gateway/i, /lambda/i, /github actions/i, /s3/i],
    skills: ["React", "TypeScript", "JavaScript", "HTML", "CSS", "responsive user interfaces", "AWS Lambda", "API Gateway", "S3", "Docker", "Git", "GitHub Actions", "CI/CD", "deployment pipelines", "Playwright", "automated testing"],
    role_tags: ["full_stack", "cloud", "backend"]
  },
  {
    id: "captech_coffee_dashboard_accessibility",
    type: "project_fact",
    title: "Coffee shop analytics dashboard with accessibility and forecasting",
    section: "CapTech Ventures",
    project_id: "coffee_dashboard",
    required: [/coffee shop|cafe/i, /react/i, /lambda|api gateway/i, /wcag|linear regression|forecasting/i],
    skills: ["React", "JavaScript", "HTML", "CSS", "responsive user interfaces", "Python", "AWS Lambda", "API Gateway", "S3", "CDK", "SQLite", "linear regression", "WCAG 2.2"],
    role_tags: ["full_stack", "cloud", "backend"]
  },
  {
    id: "captech_coffee_dashboard_kpis",
    type: "project_fact",
    title: "Coffee shop KPI, inventory, and forecasting dashboard",
    section: "CapTech Ventures",
    project_id: "coffee_dashboard",
    required: [/daily revenue|profit margins|inventory/i, /low stock|sales tracking/i, /forecasting|linear regression/i],
    skills: ["React", "Python", "SQLite", "data analytics", "linear regression", "analytics dashboard", "inventory tracking", "metrics", "alerts"],
    role_tags: ["full_stack", "backend", "cloud"]
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
    id: "publicis_healthcare_predictive_app",
    type: "work_project_fact",
    title: "Healthcare plan recommendation app for Fortune 25 client",
    section: "Publicis Sapient",
    parent_job_id: "publicis_sapient",
    project_id: "publicis_healthcare_app",
    required: [/fortune 25|healthcare/i, /recommendations|predictive|savings/i],
    skills: ["healthcare analytics", "predictive recommendations", "client presentation", "Agile", "user interfaces"],
    role_tags: ["consulting", "full_stack"]
  },
  {
    id: "publicis_flask_azure_sql_backend",
    type: "work_project_fact",
    title: "Primary backend engineer: Flask API with Azure SQL and LangChain RAG chatbot",
    section: "Publicis Sapient",
    parent_job_id: "publicis_sapient",
    project_id: "publicis_healthcare_app",
    required: [/flask/i, /azure sql|backend/i, /langchain|rag|openai embeddings/i],
    skills: ["Python", "Flask", "REST APIs", "Azure SQL", "LangChain", "RAG", "OpenAI embeddings", "React Native"],
    metrics: ["delivered in 6 weeks"],
    role_tags: ["backend", "ai", "full_stack"]
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
    id: "sallie_mae_config_sns_centralization",
    type: "work_project_fact",
    title: "AWS Config SNS centralization across hundreds of accounts",
    section: "Sallie Mae",
    parent_job_id: "sallie_mae",
    project_id: "sallie_mae_cloud",
    required: [/sns/i, /s3|cloudwatch logs/i, /lambda/i],
    skills: ["AWS Lambda", "SNS", "S3", "CloudWatch Logs", "Python", "boto3", "logging", "cloud monitoring"],
    metrics: ["thousands of daily messages", "hundreds of AWS accounts"],
    role_tags: ["cloud", "backend"]
  },
  {
    id: "sallie_mae_cross_account_iam",
    type: "work_project_fact",
    title: "Cross-account IAM trust and least-privilege logging writes",
    section: "Sallie Mae",
    parent_job_id: "sallie_mae",
    project_id: "sallie_mae_cloud",
    required: [/cross-account/i, /iam/i, /least-privilege/i],
    skills: ["IAM", "cross-account trust policies", "least-privilege IAM", "security"],
    role_tags: ["cloud", "consulting"]
  },
  {
    id: "sallie_mae_ansible_cloudformation",
    type: "work_project_fact",
    title: "Ansible and CloudFormation production infrastructure automation",
    section: "Sallie Mae",
    parent_job_id: "sallie_mae",
    project_id: "sallie_mae_cloud",
    required: [/ansible/i, /cloudformation/i, /athena|glue/i],
    skills: ["Ansible", "CloudFormation", "YAML", "Athena", "Glue", "data analytics", "infrastructure as code"],
    role_tags: ["cloud", "backend"]
  },
  {
    id: "sallie_mae_production_servicenow",
    type: "work_project_fact",
    title: "ServiceNow production deployment and adoption",
    section: "Sallie Mae",
    parent_job_id: "sallie_mae",
    project_id: "sallie_mae_cloud",
    required: [/servicenow/i, /production deployment|deployed to production/i, /adopted/i],
    skills: ["ServiceNow", "production deployment", "Azure DevOps", "Scaled Agile"],
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
    id: "aep_hackathon_second_place",
    type: "project_fact",
    title: "AEP hackathon second-place AI safety solution",
    section: "Additional Projects",
    project_id: "aep_ai_safety",
    required: [/aep/i, /2nd|second/i, /17 teams|800\+|800 participants/i],
    skills: ["hackathon", "AI safety classification", "demo execution", "team project"],
    metrics: ["2nd place", "17 teams", "800+ participants"],
    role_tags: ["ai", "consulting", "full_stack"]
  },
  {
    id: "aep_react_native_flask_sqlite",
    type: "project_fact",
    title: "AEP React Native, Flask, and SQLite application workflow",
    section: "Additional Projects",
    project_id: "aep_ai_safety",
    required: [/react native/i, /flask/i, /sqlite/i],
    skills: ["React Native", "Flask", "SQLite", "cross-platform app development"],
    role_tags: ["full_stack", "ai", "backend"]
  },
  {
    id: "mario_collision_state_command_factory",
    type: "project_fact",
    title: "MonoGame Mario collision and design pattern architecture",
    section: "Additional Projects",
    project_id: "mario_monogame",
    required: [/mario|monogame/i, /collision/i, /state/i, /command|factory/i],
    skills: ["C#", "MonoGame", "OOP", "object-oriented design", "design patterns", "collision", "state machine", "command pattern", "factory pattern"],
    role_tags: ["backend", "full_stack"]
  },
  {
    id: "mario_physics_enemy_save_systems",
    type: "project_fact",
    title: "MonoGame player physics, enemies, save system, and game state behavior",
    section: "Additional Projects",
    project_id: "mario_monogame",
    required: [/mario|monogame/i, /player physics|physics/i, /enemy|save system|game state/i],
    skills: ["C#", "MonoGame", "player physics", "enemy systems", "save system", "game state"],
    role_tags: ["backend", "full_stack"]
  },
  {
    id: "travel_budgeting_kotlin_mvvm_compose",
    type: "project_fact",
    title: "Android travel budgeting app with Kotlin, Jetpack Compose, MVVM, and LiveData",
    section: "Additional Projects",
    project_id: "travel_budgeting_app",
    required: [/travel budgeting|trip budgets|expenses|receipts/i, /kotlin/i, /jetpack compose/i, /mvvm|model[- ]view[- ]viewmodel/i, /livedata/i],
    skills: ["Kotlin", "Android", "Jetpack Compose", "MVVM", "Model-View-ViewModel", "LiveData", "mobile app architecture", "travel budgeting", "expense tracking", "receipt tracking"],
    role_tags: ["full_stack", "backend"]
  },
  {
    id: "travel_budgeting_plaid_firebase_auth",
    type: "project_fact",
    title: "Plaid API and Firebase Authentication for bank-linked budgeting",
    section: "Additional Projects",
    project_id: "travel_budgeting_app",
    required: [/plaid/i, /firebase/i, /authentication|user access|user information/i, /bank[- ]account|financial data/i],
    skills: ["Plaid API", "Firebase", "Firebase Authentication", "financial API integration", "bank-account linking", "authentication"],
    role_tags: ["backend", "full_stack"]
  },
  {
    id: "travel_budgeting_backend_expense_tracking",
    type: "project_fact",
    title: "Backend-owned expense, receipt, and trip budget tracking",
    section: "Additional Projects",
    project_id: "travel_budgeting_app",
    required: [/personally owned backend|owned backend/i, /categorize spending|track expenses|receipts|trip budgets/i],
    skills: ["backend functionality", "expense tracking", "receipt tracking", "travel budgeting", "personal finance app", "Firebase"],
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
    ? "captech_consultant"
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

function dedupePreserveCase(values: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const value of values) {
    const key = value.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      output.push(value);
    }
  }
  return output;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function textContainsSkill(text: string, skill: string): boolean {
  const pattern = escapeRegex(skill.toLowerCase()).replace(/\s+/g, "\\s+");
  return new RegExp(`(^|[^a-z0-9])${pattern}(?=$|[^a-z0-9])`, "i").test(text.toLowerCase());
}

function consolidatedSkillCards(text: string): EvidenceCard[] {
  const sectionText = getSectionText(text, SKILL_SECTION);
  if (!sectionText) {
    return [];
  }

  return [
    EvidenceCardSchema.parse({
      id: "consolidated_skills_keywords",
      type: "skill_fact",
      title: "Consolidated skills and keywords",
      evidence_text: sectionText.slice(0, 1200),
      skills: extractSkills(sectionText),
      metrics: extractMetrics(sectionText),
      role_tags: inferRoleTags(sectionText),
      source_heading: SKILL_SECTION
    })
  ];
}

function extractSkills(text: string): string[] {
  return dedupePreserveCase(SKILL_TERMS.filter((skill) => textContainsSkill(text, skill)));
}

function extractMetrics(text: string): string[] {
  return text.match(/\b(?:~?\d{2,}(?:,\d{3})?|\d+%)\s*[A-Za-z%]*/g) ?? [];
}

function inferRoleTags(text: string): Exclude<RoleMode, "auto">[] {
  const lower = text.toLowerCase();
  const tags = new Set<Exclude<RoleMode, "auto">>();
  if (/aws|cloud|lambda|sqs|dynamodb|cloudformation|cdk|cloudwatch/.test(lower)) tags.add("cloud");
  if (/api|spring|java|kotlin|firebase|plaid|python|backend|database|queue/.test(lower)) tags.add("backend");
  if (/react|android|jetpack|mobile|frontend|full.?stack|typescript/.test(lower)) tags.add("full_stack");
  if (/ai|llm|rag|pytorch|faiss|nlp|bedrock/.test(lower)) tags.add("ai");
  if (/client|stakeholder|consult|delivery|presentation/.test(lower)) tags.add("consulting");
  return [...tags];
}

export function parseEvidenceCards(rawText: string): EvidenceCard[] {
  const text = normalizeText(rawText);
  assertRequiredSections(text);
  const cards: EvidenceCard[] = [];

  cards.push(...consolidatedSkillCards(text));

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
