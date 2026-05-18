import { SECTION_BUDGETS } from "./constants";
import type { GeneratedResume } from "./schemas";

export type SkillCurationContext = {
  jobDescription?: string;
};

const DISALLOWED_STANDALONE_SKILLS = new Set([
  "es6+",
  "es6",
  "ci/cd",
  "iac",
  "infrastructure as code",
  "unit testing",
  "automated testing",
  "test automation",
  "automated tests",
  "testing",
  "solid",
  "oop",
  "object-oriented",
  "object oriented",
  "object-oriented design",
  "design pattern",
  "design patterns",
  "algorithms",
  "algorithm design",
  "agile",
  "scrum",
  "xp",
  "idempotency",
  "event-driven architecture",
  "document vector store",
  "cloud monitoring",
  "monitoring",
  "alerts",
  "metrics"
]);

const SKILL_LABEL_ALIASES: Record<string, string> = {
  restful: "REST APIs",
  "restful api": "REST APIs",
  "restful apis": "REST APIs",
  "rest api": "REST APIs",
  "rest apis": "REST APIs",
  "infrastructure as code": "Infrastructure as Code",
  iac: "Infrastructure as Code",
  "aws lambda": "AWS Lambda",
  "api gateway": "API Gateway",
  "cloudwatch logs": "CloudWatch Logs",
  "github actions": "GitHub Actions",
  "spring boot": "Spring Boot",
  javascript: "JavaScript",
  typescript: "TypeScript",
  playwright: "Playwright",
  docker: "Docker",
  jenkins: "Jenkins",
  monogame: "MonoGame",
  nlp: "NLP",
  boto3: "boto3",
  react: "React",
  aws: "AWS"
};

const CONDITIONAL_STANDALONE_SKILLS: Record<string, RegExp> = {
  nlp: /\b(?:nlp|natural language processing)\b/i,
  monogame: /\b(?:monogame|game development|gameplay|game engine)\b/i,
  boto3: /\bboto3\b/i
};

const SKILL_DISPLAY_PRIORITY: Record<string, number> = {
  aws: 95,
  javascript: 92,
  react: 90,
  java: 88,
  "rest apis": 86,
  docker: 84,
  jenkins: 82,
  playwright: 80,
  "spring boot": 78,
  "aws lambda": 76,
  "cloudwatch logs": 74,
  "github actions": 72,
  typescript: 70,
  python: 68,
  git: 66
};

const DEFAULT_COMPACT_SKILL_LIMIT = Math.min(28, SECTION_BUDGETS.skills.maxItems);

function normalizeSkill(value: string): string {
  return value.toLowerCase().replace(/[^\w#+/. -]/g, " ").replace(/\s+/g, " ").trim();
}

function skillLabel(value: string): string {
  const normalized = normalizeSkill(value);
  if (normalized === "es6" || normalized === "es6+") {
    return "JavaScript";
  }
  return SKILL_LABEL_ALIASES[normalized] ?? value.trim();
}

function containsSkillTerm(jobDescription: string, skill: string): boolean {
  const normalizedJob = normalizeSkill(jobDescription);
  const normalizedSkill = normalizeSkill(skill);
  if (!normalizedSkill) {
    return false;
  }
  if (normalizedJob.includes(normalizedSkill)) {
    return true;
  }
  if (normalizedSkill === "javascript" && /\bes6\+?\b/.test(normalizedJob)) {
    return true;
  }
  if (normalizedSkill === "rest apis" && /\brestful?\b|\bapis?\b/.test(normalizedJob)) {
    return true;
  }
  if (normalizedSkill === "docker" && /\bcontainer/.test(normalizedJob)) {
    return true;
  }
  return false;
}

function splitSkillItems(value: string): string[] {
  return value
    .split(/[,|;]/)
    .map((item) => item.replace(/^[A-Za-z /&+-]+:\s*/, "").trim())
    .filter(Boolean);
}

export function isDisallowedStandaloneSkill(value: string, context: SkillCurationContext = {}): boolean {
  const normalized = normalizeSkill(value);
  if (DISALLOWED_STANDALONE_SKILLS.has(normalized)) {
    return true;
  }

  const conditionalPattern = CONDITIONAL_STANDALONE_SKILLS[normalized];
  if (conditionalPattern && !conditionalPattern.test(context.jobDescription ?? "")) {
    return true;
  }

  return false;
}

export function curateSkills(
  skills: string[],
  maxItems = DEFAULT_COMPACT_SKILL_LIMIT,
  context: SkillCurationContext = {}
): string[] {
  const seen = new Set<string>();
  const collected: Array<{ label: string; index: number }> = [];

  for (const [index, rawSkill] of skills.entries()) {
    for (const rawItem of splitSkillItems(rawSkill)) {
      const label = skillLabel(rawItem);
      if (!label || isDisallowedStandaloneSkill(label, context)) {
        continue;
      }

      const key = normalizeSkill(label);
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      collected.push({ label, index });
    }
  }

  const jobDescription = context.jobDescription?.trim() ?? "";
  if (!jobDescription) {
    return collected.slice(0, maxItems).map((item) => item.label);
  }

  return collected
    .sort((left, right) => {
      const leftKey = normalizeSkill(left.label);
      const rightKey = normalizeSkill(right.label);
      const leftScore = (containsSkillTerm(jobDescription, left.label) ? 1000 : 0) + (SKILL_DISPLAY_PRIORITY[leftKey] ?? 0);
      const rightScore = (containsSkillTerm(jobDescription, right.label) ? 1000 : 0) + (SKILL_DISPLAY_PRIORITY[rightKey] ?? 0);
      return rightScore - leftScore || left.index - right.index;
    })
    .slice(0, maxItems)
    .map((item) => item.label);
}

export function curateGeneratedResumeSkills<T extends GeneratedResume>(resume: T, context: SkillCurationContext = {}): T {
  return {
    ...resume,
    skills: curateSkills(resume.skills, DEFAULT_COMPACT_SKILL_LIMIT, context)
  };
}
