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
    claimableAliases: ["Jenkins", "GitHub Actions", "Vercel", "Azure DevOps", "TeamCity", "production deployment"],
    placement: "prefer_bullet",
    allowInSkills: false
  },
  {
    canonical: "deployment pipelines",
    aliases: ["deployment pipeline", "build processes", "build process", "configuration and deployment management", "deployment management"],
    claimableAliases: ["Jenkins", "GitHub Actions", "Vercel", "Azure DevOps", "CI/CD", "production deployment", "code freeze"],
    placement: "prefer_bullet",
    allowInSkills: false
  },
  {
    canonical: "source control management",
    aliases: ["source control", "version control"],
    claimableAliases: ["Git", "GitHub Actions"],
    placement: "skill_ok",
    allowInSkills: true,
    skillLabel: "Git"
  },
  {
    canonical: "cloud monitoring",
    aliases: ["monitoring", "monitors", "instrumentation", "alerts", "operational excellence"],
    claimableAliases: ["CloudWatch Logs", "CloudWatch Insights", "CloudWatch alarms", "alarms", "logging", "tracing", "low-stock alerts"],
    placement: "prefer_bullet",
    allowInSkills: false
  },
  {
    canonical: "metrics",
    aliases: ["metric"],
    claimableAliases: ["precision", "recall", "F1", "accuracy", "KPIs", "CloudWatch Insights", "CloudWatch alarms"],
    placement: "prefer_bullet",
    allowInSkills: false
  },
  {
    canonical: "data analytics",
    aliases: ["analytics", "performing data analytics"],
    claimableAliases: ["Athena", "Glue", "CloudWatch Insights", "KPI dashboard", "linear regression", "forecasting", "Pandas", "NumPy"],
    placement: "prefer_bullet",
    allowInSkills: false
  },
  {
    canonical: "public cloud services",
    aliases: ["public cloud", "cloud services"],
    claimableAliases: ["AWS", "AWS Lambda", "S3", "DynamoDB", "CloudWatch Logs", "CloudFormation"],
    placement: "skill_ok",
    allowInSkills: true,
    skillLabel: "AWS"
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
    placement: "prefer_bullet",
    allowInSkills: false
  },
  {
    canonical: "Agile",
    claimableAliases: ["Scaled Agile"],
    placement: "prefer_bullet",
    allowInSkills: false
  },
  {
    canonical: "algorithms",
    aliases: ["algorithm", "algorithm design", "Algorithms"],
    claimableAliases: ["regret insertion", "regret-insertion", "route optimization", "recommendation algorithm"],
    placement: "prefer_bullet",
    allowInSkills: false
  },
  {
    canonical: "data structures",
    aliases: ["data structure"],
    claimableAliases: ["game state", "state machine", "collision", "save system"],
    placement: "prefer_bullet",
    allowInSkills: false
  },
  {
    canonical: "design patterns",
    aliases: ["design pattern"],
    claimableAliases: [
      "state machine",
      "state pattern",
      "command pattern",
      "command patterns",
      "factory pattern",
      "factory patterns",
      "reusable OOP patterns",
      "OOP patterns"
    ],
    placement: "prefer_bullet",
    allowInSkills: false
  },
  {
    canonical: "user interfaces",
    aliases: ["user interface", "responsive user interfaces", "responsive UI", "UI", "frontend", "front-end"],
    claimableAliases: ["React", "React Native", "TypeScript", "JavaScript", "WCAG 2.2", "accessibility"],
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
    canonical: "containerized systems",
    aliases: ["containers", "containerized"],
    claimableAliases: ["Docker"],
    placement: "prefer_bullet",
    allowInSkills: false
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
