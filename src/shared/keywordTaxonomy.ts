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
    aliases: ["source control", "version control", "Git/GitHub", "Git / GitHub", "GitHub"],
    claimableAliases: ["Git", "GitHub Actions", "Azure DevOps"],
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
    aliases: ["infrastructure as code", "infrastructure-as-code"],
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
    canonical: "mobile app architecture",
    aliases: ["mobile application architecture", "mobile app development", "mobile application development", "mobile development", "Android application", "Android app", "personal finance app"],
    claimableAliases: ["Android", "Kotlin", "Jetpack Compose", "MVVM", "Model-View-ViewModel", "LiveData", "React Native", "cross-platform app development"],
    placement: "prefer_bullet",
    allowInSkills: false
  },
  {
    canonical: "MVVM",
    aliases: ["Model-View-ViewModel", "Model View ViewModel"],
    claimableAliases: ["Jetpack Compose", "LiveData"],
    placement: "prefer_bullet",
    allowInSkills: false
  },
  {
    canonical: "financial API integration",
    aliases: ["bank-account linking", "bank account linking", "financial data access", "bank-account connectivity"],
    claimableAliases: ["Plaid API", "Plaid", "Firebase"],
    placement: "prefer_bullet",
    allowInSkills: false
  },
  {
    canonical: "expense tracking",
    aliases: ["receipt tracking", "travel budgeting", "trip budgets", "categorized spending", "categorize spending"],
    claimableAliases: ["Plaid API", "Firebase", "personal finance app"],
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
    canonical: "TypeScript",
    aliases: ["JavaScript/TypeScript", "JavaScript / TypeScript", "JS/TS"],
    claimableAliases: ["JavaScript"],
    placement: "skill_ok",
    allowInSkills: true,
    skillLabel: "TypeScript",
    skillPriority: 82
  },
  {
    canonical: "HTML",
    aliases: ["HTML5"],
    placement: "skill_ok",
    allowInSkills: true,
    skillLabel: "HTML",
    skillPriority: 62
  },
  {
    canonical: "CSS",
    aliases: ["CSS3"],
    placement: "skill_ok",
    allowInSkills: true,
    skillLabel: "CSS",
    skillPriority: 62
  },
  {
    canonical: "Node.js",
    aliases: ["NodeJS", "Node"],
    placement: "skill_ok",
    allowInSkills: true,
    skillLabel: "Node.js",
    skillPriority: 76
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
    canonical: "Kotlin",
    placement: "skill_ok",
    allowInSkills: true,
    skillLabel: "Kotlin",
    skillPriority: 88
  },
  {
    canonical: "Android",
    placement: "skill_ok",
    allowInSkills: true,
    skillLabel: "Android",
    skillPriority: 86
  },
  {
    canonical: "Jetpack Compose",
    placement: "skill_ok",
    allowInSkills: true,
    skillLabel: "Jetpack Compose",
    skillPriority: 82
  },
  {
    canonical: "Firebase",
    aliases: ["Firebase Authentication", "Firebase Auth"],
    placement: "skill_ok",
    allowInSkills: true,
    skillLabel: "Firebase",
    skillPriority: 74
  },
  {
    canonical: "LiveData",
    placement: "skill_ok",
    allowInSkills: true,
    skillLabel: "LiveData",
    skillPriority: 70
  },
  {
    canonical: "Plaid API",
    aliases: ["Plaid"],
    placement: "skill_ok",
    allowInSkills: true,
    skillLabel: "Plaid API",
    skillPriority: 70
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
  },
  {
    canonical: "Go",
    aliases: ["Golang"],
    placement: "skill_ok",
    allowInSkills: true,
    skillLabel: "Go",
    skillPriority: 85
  },
  {
    canonical: "message queues",
    aliases: ["message queue", "messaging queues", "message brokers", "message broker"],
    claimableAliases: ["SQS", "SNS", "event-driven"],
    placement: "prefer_bullet",
    allowInSkills: false
  },
  {
    canonical: "distributed systems",
    aliases: ["distributed system", "distributed computing", "large-scale distributed systems"],
    claimableAliases: ["event-driven architecture", "event-driven", "SQS", "Kinesis", "serverless", "Lambda"],
    placement: "prefer_bullet",
    allowInSkills: false
  },
  {
    canonical: "NoSQL",
    aliases: ["NoSQL databases", "NoSQL database"],
    claimableAliases: ["DynamoDB"],
    placement: "skill_ok",
    allowInSkills: true,
    skillLabel: "DynamoDB"
  },
  {
    canonical: "relational databases",
    aliases: ["relational database", "RDBMS"],
    claimableAliases: ["SQL", "Azure SQL", "SQLite", "Athena"],
    placement: "skill_ok",
    allowInSkills: true,
    skillLabel: "SQL"
  },
  {
    canonical: "observability",
    claimableAliases: ["CloudWatch Logs", "CloudWatch Insights", "CloudWatch alarms", "alarms", "logging", "tracing"],
    placement: "prefer_bullet",
    allowInSkills: false
  },
  {
    canonical: "authentication",
    aliases: ["authorization"],
    claimableAliases: ["JWT", "Firebase Authentication", "IAM", "least-privilege IAM", "OAuth"],
    placement: "prefer_bullet",
    allowInSkills: false
  },
  {
    canonical: "Azure",
    claimableAliases: ["Azure SQL", "Azure DevOps"],
    placement: "skill_ok",
    allowInSkills: true,
    skillLabel: "Azure SQL"
  },
  {
    canonical: "DevOps",
    claimableAliases: ["CI/CD", "Jenkins", "GitHub Actions", "Azure DevOps", "production deployment"],
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
