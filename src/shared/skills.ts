import { SECTION_BUDGETS } from "./constants";
import type { GeneratedResume } from "./schemas";

const DISALLOWED_STANDALONE_SKILLS = new Set([
  "es6+",
  "es6",
  "unit testing",
  "automated testing",
  "test automation",
  "automated tests",
  "solid"
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
  react: "React",
  aws: "AWS"
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

export function isDisallowedStandaloneSkill(value: string): boolean {
  return DISALLOWED_STANDALONE_SKILLS.has(normalizeSkill(value));
}

export function curateSkills(skills: string[], maxItems = DEFAULT_COMPACT_SKILL_LIMIT): string[] {
  const seen = new Set<string>();
  const curated: string[] = [];

  for (const rawSkill of skills) {
    const label = skillLabel(rawSkill);
    if (!label || isDisallowedStandaloneSkill(label)) {
      continue;
    }

    const key = normalizeSkill(label);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    curated.push(label);
    if (curated.length >= maxItems) {
      break;
    }
  }

  return curated;
}

export function curateGeneratedResumeSkills<T extends GeneratedResume>(resume: T): T {
  return {
    ...resume,
    skills: curateSkills(resume.skills)
  };
}
