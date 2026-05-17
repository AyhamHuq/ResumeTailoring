import type { KeywordPlacementRecommendation } from "./schemas";

export type KeywordSynonymStrictness = "claimable" | "evidence_only";

export type KeywordTaxonomyEntry = {
  canonical: string;
  aliases?: string[];
  claimableAliases?: string[];
  evidenceOnlyAliases?: string[];
  placement: KeywordPlacementRecommendation;
  allowInSkills?: boolean;
  skillLabel?: string;
  skillPriority?: number;
};

export type KeywordAlternativeGroup = {
  id: string;
  canonical: string;
  members: string[];
  trigger: RegExp;
};

export const KEYWORD_TAXONOMY: KeywordTaxonomyEntry[] = [
  {
    canonical: "Object-Oriented",
    aliases: ["OOP", "Object Oriented"],
    claimableAliases: ["SOLID", "state machine", "command pattern", "factory pattern"],
    placement: "prefer_bullet",
    allowInSkills: false
  },
  {
    canonical: "CI/CD",
    claimableAliases: ["Jenkins", "GitHub Actions", "Vercel", "Azure DevOps", "TeamCity"],
    placement: "skill_ok",
    allowInSkills: true,
    skillLabel: "CI/CD"
  },
  {
    canonical: "cloud monitoring",
    claimableAliases: ["CloudWatch Logs", "CloudWatch Insights", "alarms", "logging", "tracing"],
    placement: "prefer_bullet",
    allowInSkills: false
  },
  {
    canonical: "vector search",
    claimableAliases: ["FAISS", "OpenSearch", "document vector store", "RAG"],
    placement: "prefer_bullet",
    allowInSkills: false
  },
  {
    canonical: "IaC",
    aliases: ["infrastructure as code"],
    claimableAliases: ["CloudFormation", "CDK", "Ansible"],
    placement: "skill_ok",
    allowInSkills: true,
    skillLabel: "Infrastructure as Code"
  },
  {
    canonical: "REST APIs",
    aliases: ["RESTful", "RESTful API", "RESTful APIs", "REST API"],
    claimableAliases: ["REST"],
    placement: "skill_ok",
    allowInSkills: true,
    skillLabel: "REST APIs"
  },
  {
    canonical: "ES6+",
    aliases: ["ES6"],
    evidenceOnlyAliases: ["JavaScript", "modern JavaScript"],
    placement: "omit",
    allowInSkills: false
  },
  {
    canonical: "Scrum",
    evidenceOnlyAliases: ["Agile", "Scaled Agile"],
    placement: "needs_source_update",
    allowInSkills: false
  },
  {
    canonical: "Agile",
    claimableAliases: ["Scaled Agile"],
    placement: "prefer_bullet",
    allowInSkills: false
  },
  {
    canonical: "automated testing",
    aliases: ["test automation", "automated tests"],
    claimableAliases: ["Playwright", "Cypress", "Selenium", "Karate", "Jest", "pytest", "JUnit", "API testing"],
    evidenceOnlyAliases: ["unit testing"],
    placement: "prefer_bullet",
    allowInSkills: false
  },
  {
    canonical: "Playwright",
    placement: "skill_ok",
    allowInSkills: true,
    skillLabel: "Playwright",
    skillPriority: 70
  },
  {
    canonical: "Cypress",
    placement: "skill_ok",
    allowInSkills: true,
    skillLabel: "Cypress",
    skillPriority: 60
  },
  {
    canonical: "Selenium",
    placement: "skill_ok",
    allowInSkills: true,
    skillLabel: "Selenium",
    skillPriority: 60
  },
  {
    canonical: "Karate",
    placement: "skill_ok",
    allowInSkills: true,
    skillLabel: "Karate",
    skillPriority: 60
  },
  {
    canonical: "XP",
    placement: "needs_source_update",
    allowInSkills: false
  },
  {
    canonical: "JavaScript",
    claimableAliases: ["ES6", "ES6+", "modern JavaScript"],
    placement: "skill_ok",
    allowInSkills: true,
    skillLabel: "JavaScript",
    skillPriority: 80
  },
  {
    canonical: "Docker",
    placement: "skill_ok",
    allowInSkills: true,
    skillLabel: "Docker",
    skillPriority: 75
  },
  {
    canonical: "Jenkins",
    placement: "skill_ok",
    allowInSkills: true,
    skillLabel: "Jenkins",
    skillPriority: 70
  },
  {
    canonical: "TeamCity",
    placement: "skill_ok",
    allowInSkills: true,
    skillLabel: "TeamCity",
    skillPriority: 60
  },
  {
    canonical: "React",
    placement: "skill_ok",
    allowInSkills: true,
    skillLabel: "React",
    skillPriority: 90
  },
  {
    canonical: "AWS",
    placement: "skill_ok",
    allowInSkills: true,
    skillLabel: "AWS",
    skillPriority: 95
  },
  {
    canonical: "SOLID",
    placement: "prefer_bullet",
    allowInSkills: false
  },
  {
    canonical: "unit testing",
    claimableAliases: ["Jest", "pytest", "JUnit"],
    placement: "prefer_bullet",
    allowInSkills: false
  }
];

export const KEYWORD_ALTERNATIVE_GROUPS: KeywordAlternativeGroup[] = [
  {
    id: "automated_testing_frameworks",
    canonical: "automated testing",
    members: ["Karate", "Playwright", "Cypress", "Selenium"],
    trigger: /automated\s+testing\s+frameworks?(?:\s+such\s+as|\s+including|[:,])?/i
  },
  {
    id: "agile_methodologies",
    canonical: "Agile",
    members: ["Scrum", "XP", "Agile", "Scaled Agile"],
    trigger: /(?:scrum\s*,?\s*xp\s*,?\s*or\s+other\s+agile\s+methodologies|agile\s+methodologies)/i
  }
];

export const TAXONOMY_KNOWN_TERMS = Array.from(new Set(
  KEYWORD_TAXONOMY.flatMap((entry) => [
    entry.canonical,
    ...(entry.aliases ?? []),
    ...(entry.claimableAliases ?? []),
    ...(entry.evidenceOnlyAliases ?? [])
  ])
));
