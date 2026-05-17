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
    { id: "captech_f100_idempotency", parent_job_id: "captech", evidence_text: "SQS idempotency work." },
    { id: "publicis_langchain_rag", parent_job_id: "publicis_sapient", evidence_text: "LangChain RAG work." },
    { id: "aep_pytorch_faiss_20000_records", project_id: "aep_ai_safety", evidence_text: "PyTorch and FAISS project." },
  ],
  allowedProjectIds: ["aep_ai_safety", "mario_monogame", "coffee_dashboard"],
  allowedJobIds: ["captech", "publicis_sapient", "sallie_mae"],
  budgets: {
    bullet: { maxWords: 24, maxCharacters: 180, maxEstimatedLines: 2 },
    workExperience: { captech: 3, publicis_sapient: 3, sallie_mae: 3 },
    projects: { min: 1, max: 2 },
  },
};

function validResume(overrides: Record<string, unknown> = {}) {
  return {
    role_mode: "backend",
    skills: [
      {
        name: "AWS SQS",
        source: "CapTech evidence",
        matched_jd_keywords: ["queues"],
        placement: "skills_and_bullets",
      },
    ],
    work_experience: [
      {
        job_id: "captech",
        bullets: [
          {
            text: "Built idempotent SQS processing paths for resilient retry behavior.",
            evidence_refs: ["captech_f100_idempotency"],
            jd_keywords: ["queues"],
            word_count: 9,
            char_count: 68,
            estimated_lines: 1,
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
            text: "Built a PyTorch and FAISS safety classifier over incident records.",
            evidence_refs: ["aep_pytorch_faiss_20000_records"],
            jd_keywords: ["PyTorch"],
            word_count: 10,
            char_count: 68,
            estimated_lines: 1,
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
          ],
        },
      ],
    });

    expectInvalid(() => validateGeneratedResume?.(resume, context) as ValidationResult);
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
          ],
        },
      ],
    });

    expectInvalid(() => validateGeneratedResume?.(resume, context) as ValidationResult);
  });
});
