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
    { id: "captech_f100_spring_lambda_dynamodb", parent_job_id: "captech", evidence_text: "Spring Lambda DynamoDB Maestro messaging work." },
    { id: "captech_f100_idempotency", parent_job_id: "captech", evidence_text: "SQS idempotency retry work." },
    { id: "captech_f100_jenkins_coordination", parent_job_id: "captech", evidence_text: "Jenkins production deployment across teams." },
    { id: "captech_bedrock_rag_opensearch", parent_job_id: "captech", evidence_text: "Bedrock RAG OpenSearch reranking work." },
    { id: "captech_golf_algorithm_golang", parent_job_id: "captech", evidence_text: "Golang regret insertion route optimization algorithm generated 10,000 itineraries." },
    { id: "publicis_langchain_rag", parent_job_id: "publicis_sapient", evidence_text: "LangChain RAG healthcare chatbot work." },
    { id: "publicis_flask_azure_sql_backend", parent_job_id: "publicis_sapient", evidence_text: "Flask REST backend with Azure SQL." },
    { id: "publicis_solid_testing_cicd", parent_job_id: "publicis_sapient", evidence_text: "SOLID Jest pytest Vercel CI/CD work." },
    { id: "publicis_healthcare_predictive_app", parent_job_id: "publicis_sapient", evidence_text: "Fortune 25 healthcare predictive recommendations app and client presentation." },
    { id: "sallie_mae_config_sns_centralization", parent_job_id: "sallie_mae", evidence_text: "AWS Config SNS alerts to S3 and CloudWatch Logs across almost 200 accounts." },
    { id: "sallie_mae_cross_account_iam", parent_job_id: "sallie_mae", evidence_text: "Cross-account IAM least-privilege trust policies." },
    { id: "sallie_mae_ansible_cloudformation", parent_job_id: "sallie_mae", evidence_text: "Ansible CloudFormation Athena Glue infrastructure as code." },
    { id: "aep_pytorch_faiss_20000_records", project_id: "aep_ai_safety", evidence_text: "PyTorch and FAISS project." },
    { id: "aep_react_native_flask_sqlite", project_id: "aep_ai_safety", evidence_text: "React Native Flask SQLite project workflow." },
    { id: "aep_hackathon_second_place", project_id: "aep_ai_safety", evidence_text: "AEP hackathon placed 2nd out of 17 teams with 800+ participants." },
  ],
  allowedProjectIds: ["aep_ai_safety", "mario_monogame", "coffee_dashboard"],
  allowedJobIds: ["captech", "publicis_sapient", "sallie_mae"],
};

function validResume(overrides: Record<string, unknown> = {}) {
  return {
    role_mode: "backend",
    skills: [
      "Java", "Python", "TypeScript", "AWS Lambda", "API Gateway", "SQS", "SNS", "DynamoDB",
      "S3", "CloudWatch Logs", "IAM", "CloudFormation", "Ansible", "Spring Boot", "Flask",
      "REST APIs", "React Native", "LangChain", "RAG", "OpenSearch", "FAISS", "PyTorch",
      "Jest", "pytest", "Jenkins", "Vercel"
    ],
    work_experience: [
      {
        job_id: "captech",
        bullets: [
          {
            text: "Extended Spring APIs, Lambda enrichment, DynamoDB metadata, and SQS FIFO queues to migrate real-time customer messaging into Maestro.",
            evidence_refs: ["captech_f100_spring_lambda_dynamodb"],
            jd_keywords: ["AWS"],
          },
          {
            text: "Implemented idempotent retry and reprocessing behavior so SQS-backed messages could recover cleanly without duplicate customer notifications.",
            evidence_refs: ["captech_f100_idempotency"],
            jd_keywords: ["queues"],
          },
          {
            text: "Led cross-team Jenkins release coordination across Maestro, ingestion, and product teams during a high-risk production code freeze.",
            evidence_refs: ["captech_f100_jenkins_coordination"],
            jd_keywords: ["Jenkins"],
          },
          {
            text: "Improved Bedrock RAG precision and recall using OpenSearch retrieval, reranking, multi-agent design, and evaluator-model scoring.",
            evidence_refs: ["captech_bedrock_rag_opensearch"],
            jd_keywords: ["RAG"],
          },
          {
            text: "Built a Golang regret-insertion itinerary algorithm and React iframe that generated 10,000+ live tournament itineraries.",
            evidence_refs: ["captech_golf_algorithm_golang"],
            jd_keywords: ["Golang"],
          },
        ],
      },
      {
        job_id: "publicis_sapient",
        bullets: [
          {
            text: "Built a personalized LangChain RAG chatbot using OpenAI embeddings and user healthcare data to answer plan and cost questions.",
            evidence_refs: ["publicis_langchain_rag"],
            jd_keywords: ["RAG"],
          },
          {
            text: "Owned most Flask REST backend work, including Azure SQL schema integration for a React Native healthcare recommendation app.",
            evidence_refs: ["publicis_flask_azure_sql_backend"],
            jd_keywords: ["Flask"],
          },
          {
            text: "Applied SOLID design, Jest and pytest coverage, Vercel CI/CD, and client presentation practices across an Agile intern team.",
            evidence_refs: ["publicis_solid_testing_cicd"],
            jd_keywords: ["testing"],
          },
          {
            text: "Partnered on an 8-person Fortune 25 healthcare engagement, translating predictive savings requirements into a working consumer app.",
            evidence_refs: ["publicis_healthcare_predictive_app"],
            jd_keywords: ["Agile"],
          },
        ],
      },
      {
        job_id: "sallie_mae",
        bullets: [
          {
            text: "Centralized AWS Config SNS alerts from nearly 200 accounts into S3 and CloudWatch Logs, reducing daily emails to zero.",
            evidence_refs: ["sallie_mae_config_sns_centralization"],
            jd_keywords: ["AWS"],
          },
          {
            text: "Implemented cross-account IAM trust and least-privilege permissions so spoke-account Lambdas could write to centralized logging resources.",
            evidence_refs: ["sallie_mae_cross_account_iam"],
            jd_keywords: ["IAM"],
          },
          {
            text: "Automated production infrastructure with Ansible and CloudFormation for Lambda, S3, CloudWatch Logs, Athena, and Glue deployments.",
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

  runValidationTest("rejects bullets over word, character, or estimated-line budgets", () => {
    expect(validateGeneratedResume, "Expose validateGeneratedResume(resume, context).").toBeTypeOf("function");

    const resume = validResume({
      work_experience: [
        {
          job_id: "captech",
          bullets: [
            {
              text: "Built an excessively long bullet that should be repaired instead of silently truncated by the application before export.",
              evidence_refs: ["captech_f100_idempotency"],
              jd_keywords: [],
              word_count: 40,
              char_count: 260,
              estimated_lines: 4,
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
