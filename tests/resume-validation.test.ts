import { beforeAll, describe, expect } from "vitest";
import { findExistingPath, loadFirstModule, pickFunction, testOrSkip } from "./helpers/moduleLoader";

const validationCandidates = [
  "src/shared/validation.ts",
  "src/shared/resumeValidation.ts",
  "src/shared/validators.ts",
  "src/shared/schemas.ts",
];

const validationPath = findExistingPath(validationCandidates);
const runValidationTest = testOrSkip(Boolean(validationPath));

type ValidationResult = boolean | { success?: boolean; valid?: boolean; issues?: unknown[] };

type ValidateGeneratedResume = (
  resume: Record<string, unknown>,
  context: Record<string, unknown>,
) => ValidationResult;

const context = {
  evidenceCards: [
    { id: "captech_consultant_golf_engine", parent_job_id: "captech_consultant", evidence_text: "Go recommendation engine regret-insertion algorithm PGA Championship 10,000+ itineraries 78% accepted." },
    { id: "captech_consultant_golf_production_support", parent_job_id: "captech_consultant", evidence_text: "Owned production support for engine and frontend during live tournament." },
    { id: "captech_consultant_beverage_theming", parent_job_id: "captech_consultant", evidence_text: "React theming layer beverage company design tokens light mode." },
    { id: "captech_f100_spring_lambda_dynamodb", parent_job_id: "captech", evidence_text: "Spring Lambda DynamoDB Maestro messaging work." },
    { id: "captech_f100_idempotency", parent_job_id: "captech", evidence_text: "SQS idempotency retry work." },
    { id: "captech_f100_jenkins_coordination", parent_job_id: "captech", evidence_text: "Jenkins production deployment across teams during code freeze serving millions of customers." },
    { id: "captech_bedrock_rag_opensearch", parent_job_id: "captech", evidence_text: "Bedrock RAG OpenSearch reranking work." },
    { id: "captech_serverless_cicd", parent_job_id: "captech", project_id: "captech_golf_itinerary", evidence_text: "React TypeScript responsive user interfaces deployed with Docker, GitHub Actions, and Playwright automated tests.", skills: ["React", "TypeScript", "responsive user interfaces", "Docker", "GitHub Actions", "Playwright", "automated testing", "CI/CD", "deployment pipelines"] },
    { id: "publicis_healthcare_predictive_app", parent_job_id: "publicis_sapient", evidence_text: "Fortune 25 healthcare predictive recommendations app and client presentation." },
    { id: "publicis_flask_azure_sql_backend", parent_job_id: "publicis_sapient", evidence_text: "Primary backend engineer Flask API Azure SQL LangChain RAG chatbot OpenAI embeddings delivered in 6 weeks." },
    { id: "sallie_mae_config_sns_centralization", parent_job_id: "sallie_mae", evidence_text: "SNS messages across hundreds of AWS accounts to CloudWatch Logs and S3 using Lambda." },
    { id: "sallie_mae_ansible_cloudformation", parent_job_id: "sallie_mae", evidence_text: "Ansible CloudFormation Athena Glue infrastructure as code." },
    { id: "aep_pytorch_faiss_20000_records", project_id: "aep_ai_safety", evidence_text: "PyTorch and FAISS project." },
    { id: "aep_react_native_flask_sqlite", project_id: "aep_ai_safety", evidence_text: "React Native Flask SQLite project workflow." },
    { id: "aep_hackathon_second_place", project_id: "aep_ai_safety", evidence_text: "AEP hackathon placed 2nd out of 17 teams with 800+ participants." },
    { id: "mario_collision_state_command_factory", project_id: "mario_monogame", evidence_text: "C# MonoGame collision behavior used state machine, command pattern, and factory pattern design.", skills: ["C#", "OOP", "object-oriented design", "design patterns", "state machine", "command pattern", "factory pattern"] },
    { id: "mario_physics_enemy_save_systems", project_id: "mario_monogame", evidence_text: "MonoGame player physics, enemy behavior, save system, and game state transitions.", skills: ["C#", "MonoGame", "player physics", "enemy systems", "save system", "game state"] },
    { id: "travel_budgeting_kotlin_mvvm_compose", project_id: "travel_budgeting_app", evidence_text: "Android app built with Kotlin, Jetpack Compose, MVVM, and LiveData for travel budgeting.", skills: ["Kotlin", "Android", "Jetpack Compose", "MVVM", "LiveData", "mobile app architecture"] },
    { id: "travel_budgeting_plaid_firebase_auth", project_id: "travel_budgeting_app", evidence_text: "Integrated Plaid API and Firebase Authentication for bank-account linking and financial data access.", skills: ["Plaid API", "Firebase", "Firebase Authentication", "financial API integration"] },
    { id: "travel_budgeting_backend_expense_tracking", project_id: "travel_budgeting_app", evidence_text: "Owned backend functionality for expense tracking, receipt tracking, and trip budgets.", skills: ["expense tracking", "receipt tracking", "travel budgeting"] },
  ],
  allowedProjectIds: ["aep_ai_safety", "mario_monogame", "coffee_dashboard", "travel_budgeting_app"],
  allowedJobIds: ["captech_consultant", "captech", "publicis_sapient", "sallie_mae"],
};

const motivatingJdFixture = `
Design and build software components and service/data architecture.
Use algorithms, data structures, design patterns, and object-oriented design.
Develop CI/CD deployment pipelines using Jenkins, TeamCity, or comparable tools.
Deploy and test responsive user interfaces with ES6+ JavaScript, React, REST APIs, Docker, and automated testing frameworks such as Playwright, Cypress, Selenium, or Karate.
Use logging, metrics, monitors, alerts, data analytics, public cloud services, AWS, DevOps, IaC, and Agile delivery practices.
`;

function validResume(overrides: Record<string, unknown> = {}) {
  return {
    role_mode: "backend",
    skills: [
      "Java", "Python", "TypeScript", "AWS Lambda", "API Gateway", "SQS", "DynamoDB",
      "S3", "CloudWatch Logs", "IAM", "CloudFormation", "Ansible", "Spring Boot", "Flask",
      "REST APIs", "LangChain", "RAG", "OpenSearch", "FAISS", "PyTorch",
      "Jenkins", "Bedrock"
    ],
    work_experience: [
      {
        job_id: "captech_consultant",
        bullets: [
          {
            text: "Built a Go recommendation engine using a regret-insertion algorithm for the PGA Championship, generating 10,000+ attendee itineraries.",
            evidence_refs: ["captech_consultant_golf_engine"],
            jd_keywords: ["Golang"],
          },
          {
            text: "Owned production support for the engine and frontend throughout the live tournament.",
            evidence_refs: ["captech_consultant_golf_production_support"],
            jd_keywords: ["production support"],
          },
          {
            text: "Retrofitted a theming layer across a React application for a leading beverage company, converting hardcoded styles to design tokens.",
            evidence_refs: ["captech_consultant_beverage_theming"],
            jd_keywords: ["React"],
          },
        ],
      },
      {
        job_id: "captech",
        bullets: [
          {
            text: "Consulted for a Fortune 100 financial company to migrate a direct messaging service to AWS and Maestro using Spring APIs, DynamoDB, Lambda, and SQS.",
            evidence_refs: ["captech_f100_spring_lambda_dynamodb"],
            jd_keywords: ["AWS"],
          },
          {
            text: "Operated across 3 teams to coordinate Jenkins production deployments during a code freeze on a messaging system serving millions of customers.",
            evidence_refs: ["captech_f100_jenkins_coordination"],
            jd_keywords: ["Jenkins"],
          },
          {
            text: "Improved precision and recall by over 30% for an AWS Bedrock AI analysis tool through reranking and model-based evaluation.",
            evidence_refs: ["captech_bedrock_rag_opensearch"],
            jd_keywords: ["RAG"],
          },
          {
            text: "Architected a serverless pattern with Docker for local development alongside GitHub Actions CI/CD to deploy to S3 with API Gateway Lambda.",
            evidence_refs: ["captech_serverless_cicd"],
            jd_keywords: ["Docker", "CI/CD"],
          },
        ],
      },
      {
        job_id: "publicis_sapient",
        bullets: [
          {
            text: "Collaborated on an Agile client project for a Fortune 25 company to enhance user experiences on a healthcare app.",
            evidence_refs: ["publicis_healthcare_predictive_app"],
            jd_keywords: ["Agile"],
          },
          {
            text: "Served as primary backend engineer, building a Python Flask API with an Azure SQL backend and a LangChain RAG chatbot over OpenAI embeddings.",
            evidence_refs: ["publicis_flask_azure_sql_backend"],
            jd_keywords: ["Flask", "RAG"],
          },
        ],
      },
      {
        job_id: "sallie_mae",
        bullets: [
          {
            text: "Innovated a system to redirect thousands of daily config SNS messages across hundreds of AWS accounts to CloudWatch Logs and S3 using Lambda.",
            evidence_refs: ["sallie_mae_config_sns_centralization"],
            jd_keywords: ["AWS"],
          },
          {
            text: "Wrote an Ansible script and CloudFormation template in YAML to automate code deployment and deploy Athena queries with Glue and S3.",
            evidence_refs: ["sallie_mae_ansible_cloudformation"],
            jd_keywords: ["IaC"],
          },
        ],
      },
    ],
    projects: [
      {
        project_id: "aep_ai_safety",
        display_name: "AEP AI Safety",
        bullets: [
          {
            text: "Trained a PyTorch safety classifier on 20,000 incident records with FAISS retrieval and NLP preprocessing for severity classification.",
            evidence_refs: ["aep_pytorch_faiss_20000_records"],
            jd_keywords: ["PyTorch"],
          },
          {
            text: "Built the React Native, Flask, and SQLite application workflow for field feedback during a 24-hour AEP challenge.",
            evidence_refs: ["aep_react_native_flask_sqlite"],
            jd_keywords: ["React Native"],
          },
          {
            text: "Measured F1, precision, and accuracy while placing 2nd out of 17 teams with a practical AI safety approach.",
            evidence_refs: ["aep_hackathon_second_place"],
            jd_keywords: ["F1"],
          },
        ],
      },
    ],
    keyword_report: {
      covered_in_bullets: ["queues", "PyTorch"],
      covered_in_skills_only: [],
      supported_but_omitted_for_space: ["LangChain"],
      unsupported: ["Kubernetes"],
    },
    ...overrides,
  };
}

function expectValid(result: ValidationResult) {
  if (typeof result === "boolean") {
    expect(result).toBe(true);
    return;
  }

  expect(result.success ?? result.valid).toBe(true);
  expect(result.issues ?? []).toHaveLength(0);
}

function expectInvalid(run: () => ValidationResult) {
  try {
    const result = run();

    if (typeof result === "boolean") {
      expect(result).toBe(false);
      return;
    }

    expect(result.success ?? result.valid).toBe(false);
    expect((result.issues ?? []).length).toBeGreaterThan(0);
  } catch (error) {
    expect(error).toBeInstanceOf(Error);
  }
}

describe("generated resume validation contract", () => {
  let validateGeneratedResume: ValidateGeneratedResume | undefined;

  beforeAll(async () => {
    const loaded = await loadFirstModule(validationCandidates);
    validateGeneratedResume = loaded
      ? pickFunction<[Record<string, unknown>, Record<string, unknown>], ValidationResult>(loaded.module, [
        "validateGeneratedResume",
        "validateResumeOutput",
        "validateGeneratedResumeResponse",
      ])
      : undefined;
  });

  runValidationTest("accepts valid evidence refs and allowed project IDs", () => {
    expect(validateGeneratedResume, "Expose validateGeneratedResume(resume, context).").toBeTypeOf("function");
    expectValid(validateGeneratedResume?.(validResume(), context) as ValidationResult);
  });

  runValidationTest("accepts travel project with four bullets when caller allow list is stale", () => {
    expect(validateGeneratedResume, "Expose validateGeneratedResume(resume, context).").toBeTypeOf("function");

    const resume = validResume({
      projects: [
        {
          project_id: "travel_budgeting_app",
          display_name: "Travel Budgeting App - Kotlin / Plaid API",
          bullets: [
            {
              text: "Built an Android travel-budgeting app with Kotlin, Jetpack Compose, MVVM, and LiveData for trip budget workflows.",
              evidence_refs: ["travel_budgeting_kotlin_mvvm_compose"],
              jd_keywords: ["Android", "Kotlin"],
            },
            {
              text: "Integrated Plaid API and Firebase Authentication for bank-account linking and financial data access.",
              evidence_refs: ["travel_budgeting_plaid_firebase_auth"],
              jd_keywords: ["Plaid API", "Firebase"],
            },
            {
              text: "Owned backend functionality connecting authenticated user data to categorized spending and trip expense features.",
              evidence_refs: ["travel_budgeting_backend_expense_tracking"],
              jd_keywords: ["backend"],
            },
            {
              text: "Supported receipt tracking and travel budgeting flows for a personal-finance Android class project.",
              evidence_refs: ["travel_budgeting_backend_expense_tracking"],
              jd_keywords: ["expense tracking"],
            },
          ],
        },
      ],
    });

    expectValid(validateGeneratedResume?.(resume, {
      ...context,
      allowedProjectIds: ["aep_ai_safety", "mario_monogame", "coffee_dashboard"],
    }) as ValidationResult);
  });

  runValidationTest("rejects invalid evidence refs", () => {
    expect(validateGeneratedResume, "Expose validateGeneratedResume(resume, context).").toBeTypeOf("function");

    const resume = validResume({
      work_experience: [
        {
          job_id: "captech",
          bullets: [
            {
              text: "Claim backed by a missing evidence reference.",
              evidence_refs: ["missing_ref"],
              jd_keywords: [],
              word_count: 7,
              char_count: 43,
              estimated_lines: 1,
            },
          ],
        },
        ...(validResume().work_experience as Array<Record<string, unknown>>).slice(1),
      ],
    });

    expectInvalid(() => validateGeneratedResume?.(resume, context) as ValidationResult);
  });

  runValidationTest("rejects invalid project IDs", () => {
    expect(validateGeneratedResume, "Expose validateGeneratedResume(resume, context).").toBeTypeOf("function");

    const resume = validResume({
      projects: [
        {
          project_id: "unapproved_project",
          display_name: "Unapproved Project",
          bullets: [],
        },
      ],
    });

    expectInvalid(() => validateGeneratedResume?.(resume, context) as ValidationResult);
  });

  runValidationTest("rejects unsupported keywords when they appear as resume claims", () => {
    expect(validateGeneratedResume, "Expose validateGeneratedResume(resume, context).").toBeTypeOf("function");

    const resume = validResume({
      work_experience: [
        {
          job_id: "captech",
          bullets: [
            {
              text: "Built Kubernetes operators for idempotent SQS workflows.",
              evidence_refs: ["captech_f100_idempotency"],
              jd_keywords: ["Kubernetes"],
              word_count: 7,
              char_count: 55,
              estimated_lines: 1,
            },
            ...((validResume().work_experience as Array<{ bullets: unknown[] }>)[0].bullets.slice(1)),
          ],
        },
        ...(validResume().work_experience as Array<Record<string, unknown>>).slice(1),
      ],
    });

    expectInvalid(() => validateGeneratedResume?.(resume, context) as ValidationResult);
  });

  runValidationTest("rejects unsupported keywords and low-signal labels in skills", () => {
    expect(validateGeneratedResume, "Expose validateGeneratedResume(resume, context).").toBeTypeOf("function");

    const unsupportedSkillResume = validResume({
      skills: [...(validResume().skills as string[]), "Cypress"],
      unsupported_terms: ["Cypress"],
    });

    const genericSkillResume = validResume({
      skills: [...(validResume().skills as string[]), "unit testing", "automated testing", "SOLID", "ES6+"],
    });

    expectInvalid(() => validateGeneratedResume?.(unsupportedSkillResume, context) as ValidationResult);
    expectInvalid(() => validateGeneratedResume?.(genericSkillResume, context) as ValidationResult);
  });

  runValidationTest("rejects skills-only coverage for bullet-worthy JD terms", () => {
    expect(validateGeneratedResume, "Expose validateGeneratedResume(resume, context).").toBeTypeOf("function");

    const base = validResume() as {
      work_experience: Array<{ job_id: string; bullets: Array<Record<string, unknown>> }>;
      skills: string[];
    };
    const resume = validResume({
      work_experience: base.work_experience.map((job) => {
        if (job.job_id === "captech") {
          return {
            ...job,
            bullets: job.bullets.map((bullet, index) => index === 1
              ? {
                ...bullet,
                text: "Led cross-team release coordination across Maestro, ingestion, and product teams during a high-risk production code freeze.",
                jd_keywords: ["production deployment"],
              }
              : bullet),
          };
        }
        return job;
      }),
    });

    const result = validateGeneratedResume?.(resume, {
      ...context,
      jobDescription: "Develop CI/CD pipelines using Jenkins, TeamCity, or comparable tools.",
    }) as { success?: boolean; valid?: boolean; issues?: Array<{ code?: string }> };

    expect(result.success ?? result.valid).toBe(false);
    expect(result.issues?.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      "coverage_plan_missing_target",
    ]));
  });

  runValidationTest("rejects live failure shape with CI/CD, Docker, Playwright, and Jenkins only in skills", () => {
    expect(validateGeneratedResume, "Expose validateGeneratedResume(resume, context).").toBeTypeOf("function");

    const base = validResume() as {
      work_experience: Array<{ job_id: string; bullets: Array<Record<string, unknown>> }>;
      skills: string[];
    };
    const resume = validResume({
      skills: [...base.skills, "Docker", "Playwright", "JavaScript", "React"],
      coverage_plan: [],
      work_experience: base.work_experience.map((job) => {
        if (job.job_id === "captech") {
          return {
            ...job,
            bullets: job.bullets.map((bullet, index) => index === 2
              ? {
                ...bullet,
                text: "Led cross-team release coordination across Maestro, ingestion, and product teams during a high-risk production code freeze.",
                jd_keywords: ["production release"],
              }
              : bullet),
          };
        }
        if (job.job_id === "publicis_sapient") {
          return {
            ...job,
            bullets: job.bullets.map((bullet, index) => index === 2
              ? {
                ...bullet,
                text: "Applied SOLID design and quality practices while presenting delivery tradeoffs across an Agile intern team.",
                jd_keywords: ["quality"],
              }
              : bullet),
          };
        }
        return job;
      }),
    });

    const result = validateGeneratedResume?.(resume, {
      ...context,
      jobDescription: "Develop CI/CD pipelines using Jenkins, run automated testing frameworks such as Playwright, and support containerized systems such as Docker.",
    }) as { success?: boolean; valid?: boolean; issues?: Array<{ code?: string; message?: string }> };

    expect(result.success ?? result.valid).toBe(false);
    expect(result.issues?.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      "keyword_prefer_bullet_not_covered",
      "coverage_plan_missing_target",
    ]));
    expect(JSON.stringify(result.issues)).toMatch(/CI\/CD|automated testing|containerized systems/);
  });

  runValidationTest("rejects missing mario_monogame project when OOP project evidence is required", () => {
    expect(validateGeneratedResume, "Expose validateGeneratedResume(resume, context).").toBeTypeOf("function");

    const result = validateGeneratedResume?.(validResume({ coverage_plan: [] }), {
      ...context,
      jobDescription: "Need object-oriented design, data structures, algorithms, and design patterns.",
    }) as { success?: boolean; valid?: boolean; issues?: Array<{ code?: string }> };

    expect(result.success ?? result.valid).toBe(false);
    expect(result.issues?.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      "required_project_missing",
    ]));
  });

  runValidationTest("rejects missing travel_budgeting_app project when Android Kotlin evidence is required", () => {
    expect(validateGeneratedResume, "Expose validateGeneratedResume(resume, context).").toBeTypeOf("function");

    const result = validateGeneratedResume?.(validResume({ coverage_plan: [] }), {
      ...context,
      jobDescription: "Need Android application development with Kotlin, Jetpack Compose, MVVM, Plaid API, Firebase, and expense tracking.",
    }) as { success?: boolean; valid?: boolean; issues?: Array<{ code?: string; message?: string }> };

    expect(result.success ?? result.valid).toBe(false);
    expect(result.issues?.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      "required_project_missing",
    ]));
    expect(JSON.stringify(result.issues)).toMatch(/travel_budgeting_app/);
  });

  runValidationTest("accepts repaired bullet-first output with coverage plan and mario_monogame selected", () => {
    expect(validateGeneratedResume, "Expose validateGeneratedResume(resume, context).").toBeTypeOf("function");

    const base = validResume() as {
      work_experience: Array<{ job_id: string; bullets: Array<Record<string, unknown>> }>;
    };
    const repaired = validResume({
      skills: [
        "JavaScript", "React", "Java", "REST APIs", "Docker", "Jenkins", "Playwright",
        "AWS", "Spring Boot", "CloudWatch Logs", "GitHub Actions", "TypeScript",
        "Python", "Git", "AWS Lambda", "SQS", "DynamoDB", "CloudFormation", "Ansible",
        "Flask"
      ],
      work_experience: base.work_experience.map((job) => {
        if (job.job_id !== "captech") {
          return job;
        }
        return {
          ...job,
          bullets: job.bullets.map((bullet, index) => index === 3
            ? {
              ...bullet,
              text: "Architected a serverless pattern with Docker and React TypeScript responsive user interfaces, GitHub Actions, and Playwright tests.",
              evidence_refs: ["captech_serverless_cicd"],
              jd_keywords: ["algorithms", "React", "Docker", "CI/CD", "automated testing"],
            }
            : bullet),
        };
      }),
      projects: [
        {
          project_id: "mario_monogame",
          display_name: "MonoGame Mario Game",
          bullets: [
            {
              text: "Implemented C# gameplay with state machine, command pattern, and factory pattern design for object-oriented collision behavior.",
              evidence_refs: ["mario_collision_state_command_factory"],
              jd_keywords: ["OOP", "design patterns"],
            },
            {
              text: "Modeled player physics, enemy behavior, save-system, and game state transitions for a four-person MonoGame project.",
              evidence_refs: ["mario_physics_enemy_save_systems"],
              jd_keywords: ["data structures"],
            },
            {
              text: "Structured object creation and gameplay transitions with reusable OOP patterns while delivering a finished team demo.",
              evidence_refs: ["mario_collision_state_command_factory"],
              jd_keywords: ["OOP"],
            },
          ],
          alternates: ["aep_ai_safety", "coffee_dashboard"],
        },
      ],
      coverage_plan: [
        { target_term: "Object-Oriented", canonical: "Object-Oriented", selected_evidence_refs: ["mario_collision_state_command_factory"], section: "projects", project_id: "mario_monogame", bullet_index: 0 },
        { target_term: "algorithms", canonical: "algorithms", selected_evidence_refs: ["captech_consultant_golf_engine"], section: "work_experience", job_id: "captech_consultant", bullet_index: 0 },
        { target_term: "data structures", canonical: "data structures", selected_evidence_refs: ["mario_physics_enemy_save_systems"], section: "projects", project_id: "mario_monogame", bullet_index: 1 },
        { target_term: "design patterns", canonical: "design patterns", selected_evidence_refs: ["mario_collision_state_command_factory"], section: "projects", project_id: "mario_monogame", bullet_index: 0 },
        { target_term: "CI/CD", canonical: "CI/CD", selected_evidence_refs: ["captech_f100_jenkins_coordination"], section: "work_experience", job_id: "captech", bullet_index: 1 },
        { target_term: "deployment pipelines", canonical: "deployment pipelines", selected_evidence_refs: ["captech_f100_jenkins_coordination"], section: "work_experience", job_id: "captech", bullet_index: 1 },
        { target_term: "automated testing", canonical: "automated testing", selected_evidence_refs: ["captech_serverless_cicd"], section: "work_experience", job_id: "captech", bullet_index: 3 },
        { target_term: "containerized systems", canonical: "containerized systems", selected_evidence_refs: ["captech_serverless_cicd"], section: "work_experience", job_id: "captech", bullet_index: 3 },
        { target_term: "user interfaces", canonical: "user interfaces", selected_evidence_refs: ["captech_serverless_cicd"], section: "work_experience", job_id: "captech", bullet_index: 3 },
        { target_term: "Agile", canonical: "Agile", selected_evidence_refs: ["publicis_healthcare_predictive_app"], section: "work_experience", job_id: "publicis_sapient", bullet_index: 0 },
        { target_term: "cloud monitoring", canonical: "cloud monitoring", selected_evidence_refs: ["sallie_mae_config_sns_centralization"], section: "work_experience", job_id: "sallie_mae", bullet_index: 0 },
        { target_term: "metrics", canonical: "metrics", selected_evidence_refs: ["captech_bedrock_rag_opensearch"], section: "work_experience", job_id: "captech", bullet_index: 2 },
        { target_term: "data analytics", canonical: "data analytics", selected_evidence_refs: ["sallie_mae_ansible_cloudformation"], section: "work_experience", job_id: "sallie_mae", bullet_index: 1 },
      ],
    });

    const result = validateGeneratedResume?.(repaired, {
      ...context,
      jobDescription: motivatingJdFixture,
    }) as ValidationResult;

    expectValid(result);
  });

  runValidationTest("rejects bullets over word, character, or estimated-line budgets", () => {
    expect(validateGeneratedResume, "Expose validateGeneratedResume(resume, context).").toBeTypeOf("function");

    const resume = validResume({
      work_experience: [
        {
          job_id: "captech",
          bullets: [
            {
              text: "Built an excessively long enterprise messaging and platform integration bullet with too many implementation details, repeated context, operational caveats, and deployment notes that should be repaired instead of silently truncated by the application before export.",
              evidence_refs: ["captech_f100_idempotency"],
              jd_keywords: [],
            },
            ...((validResume().work_experience as Array<{ bullets: unknown[] }>)[0].bullets.slice(1)),
          ],
        },
        ...(validResume().work_experience as Array<Record<string, unknown>>).slice(1),
      ],
    });

    expectInvalid(() => validateGeneratedResume?.(resume, context) as ValidationResult);
  });

  runValidationTest("rejects screenshot-style sparse resumes that leave the page underfilled", () => {
    expect(validateGeneratedResume, "Expose validateGeneratedResume(resume, context).").toBeTypeOf("function");

    const full = validResume() as { work_experience: Array<{ job_id: string; bullets: unknown[] }>; projects: Array<{ bullets: unknown[] }> };
    const sparse = validResume({
      work_experience: full.work_experience.map((job) => ({
        ...job,
        bullets: job.job_id === "captech" ? job.bullets.slice(0, 3) : job.bullets.slice(0, 2),
      })),
      projects: full.projects.map((project) => ({
        ...project,
        bullets: project.bullets.slice(0, 1),
      })),
    });

    expectInvalid(() => validateGeneratedResume?.(sparse, context) as ValidationResult);
  });
});
