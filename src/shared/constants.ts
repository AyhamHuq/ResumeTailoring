export const ROLE_MODES = ["auto", "backend", "cloud", "full_stack", "ai", "consulting"] as const;
export const JOB_IDS = ["captech", "publicis_sapient", "sallie_mae"] as const;
export const PROJECT_IDS = ["aep_ai_safety", "mario_monogame", "coffee_dashboard"] as const;

export const SECTION_BUDGETS = {
  workExperience: {
    captech: { minBullets: 5, maxBullets: 5 },
    publicis_sapient: { minBullets: 4, maxBullets: 4 },
    sallie_mae: { minBullets: 3, maxBullets: 3 }
  },
  projects: {
    minProjects: 1,
    maxProjects: 2,
    minTotalBullets: 3,
    maxTotalBullets: 4,
    bulletsPerProject: { minBullets: 1, maxBullets: 3 }
  },
  bullet: {
    maxWords: 32,
    maxCharacters: 240,
    maxEstimatedLines: 2
  },
  skills: {
    maxCharacters: 430,
    maxEstimatedLines: 4,
    maxItems: 34
  },
  page: {
    targetEstimatedLines: 60,
    targetMinFillPercent: 90,
    targetMaxFillPercent: 95,
    hardMaxEstimatedLines: 68,
    minTotalBullets: 15
  }
} as const;

export const GROUNDED_SYNONYMS: Record<string, string[]> = {
  oop: ["solid", "state machine", "command pattern", "factory pattern", "object-oriented", "object oriented"],
  "object-oriented": ["oop", "solid", "state machine", "command pattern", "factory pattern"],
  "object oriented": ["oop", "solid", "state machine", "command pattern", "factory pattern"],
  "ci/cd": ["jenkins", "github actions", "vercel", "azure devops", "teamcity"],
  "cloud monitoring": ["cloudwatch logs", "cloudwatch insights", "alarms", "logging", "tracing"],
  "vector search": ["faiss", "opensearch", "document vector store", "rag"],
  iac: ["cloudformation", "cdk", "ansible"],
  restful: ["rest", "rest api", "rest apis", "restful api", "restful apis"],
  "restful api": ["rest", "rest api", "rest apis"],
  "restful apis": ["rest", "rest api", "rest apis"],
  "es6+": ["es6", "javascript", "modern javascript"],
  es6: ["es6+", "javascript", "modern javascript"],
  scrum: ["agile", "scaled agile"],
  "automated testing": ["test automation", "playwright", "cypress", "selenium", "karate", "jest", "pytest", "unit testing"],
  "test automation": ["automated testing", "playwright", "cypress", "selenium", "karate", "jest", "pytest", "unit testing"]
};
