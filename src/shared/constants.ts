export const ROLE_MODES = ["auto", "backend", "cloud", "full_stack", "ai", "consulting"] as const;
export const JOB_IDS = ["captech", "publicis_sapient", "sallie_mae"] as const;
export const PROJECT_IDS = ["aep_ai_safety", "mario_monogame", "coffee_dashboard"] as const;

export const SECTION_BUDGETS = {
  workExperience: {
    captech: { minBullets: 3, maxBullets: 3 },
    publicis_sapient: { minBullets: 2, maxBullets: 3 },
    sallie_mae: { minBullets: 2, maxBullets: 3 }
  },
  projects: {
    minProjects: 1,
    maxProjects: 2,
    bulletsPerProject: { minBullets: 1, maxBullets: 2 }
  },
  bullet: {
    maxWords: 28,
    maxCharacters: 210,
    maxEstimatedLines: 2
  },
  skills: {
    maxCharacters: 430,
    maxEstimatedLines: 4,
    maxItems: 34
  }
} as const;

export const GROUNDED_SYNONYMS: Record<string, string[]> = {
  oop: ["solid", "state machine", "command pattern", "factory pattern"],
  "ci/cd": ["jenkins", "github actions", "vercel"],
  "cloud monitoring": ["cloudwatch logs", "cloudwatch insights", "alarms", "logging", "tracing"],
  "vector search": ["faiss", "opensearch", "document vector store", "rag"],
  iac: ["cloudformation", "cdk", "ansible"]
};
