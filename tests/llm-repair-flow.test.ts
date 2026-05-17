import { beforeAll, describe, expect, vi } from "vitest";
import { findExistingPath, loadFirstModule, pickFunction, testOrSkip } from "./helpers/moduleLoader";

const llmCandidates = [
  "src/server/llmRepair.ts",
  "src/server/generateResume.ts",
  "src/server/resumeGenerator.ts",
  "src/server/llm.ts",
];

const llmPath = findExistingPath(llmCandidates);
const runLlmTest = testOrSkip(Boolean(llmPath));

type GenerateWithRepair = (input: Record<string, unknown>) => Promise<Record<string, unknown>>;

const invalidModelResponse = {
  role_mode: "backend",
  skills: [],
  work_experience: [
    {
      job_id: "captech",
      bullets: [
        {
          text: "Invented unsupported Kubernetes platform claim.",
          evidence_refs: ["missing_ref"],
          jd_keywords: ["Kubernetes"],
          word_count: 5,
          char_count: 46,
          estimated_lines: 1,
        },
      ],
    },
  ],
  projects: [{ project_id: "invalid_project", display_name: "Invalid", bullets: [] }],
  keyword_report: {
    covered_in_bullets: ["Kubernetes"],
    covered_in_skills_only: [],
    supported_but_omitted_for_space: [],
    unsupported: [],
  },
};

const repairedModelResponse = {
  role_mode: "backend",
  skills: [{ name: "SQS", source: "CapTech evidence", matched_jd_keywords: ["queues"], placement: "skills_and_bullets" }],
  work_experience: [
    {
      job_id: "captech",
      bullets: [
        {
          text: "Built idempotent SQS retry behavior for resilient messaging workflows.",
          evidence_refs: ["captech_f100_idempotency"],
          jd_keywords: ["queues"],
          word_count: 9,
          char_count: 68,
          estimated_lines: 1,
        },
      ],
    },
  ],
  projects: [],
  keyword_report: {
    covered_in_bullets: ["queues"],
    covered_in_skills_only: [],
    supported_but_omitted_for_space: [],
    unsupported: ["Kubernetes"],
  },
};

describe("LLM repair flow contract", () => {
  let generateWithRepair: GenerateWithRepair | undefined;

  beforeAll(async () => {
    const loaded = await loadFirstModule(llmCandidates);
    generateWithRepair = loaded
      ? pickFunction<[Record<string, unknown>], Promise<Record<string, unknown>>>(loaded.module, [
        "generateResumeWithRepair",
        "generateWithRepair",
        "generateResume",
      ])
      : undefined;
  });

  runLlmTest("makes one repair call with validation issues after an invalid model response", async () => {
    expect(generateWithRepair, "Expose generateResumeWithRepair({ provider, request, validate }).")
      .toBeTypeOf("function");

    const provider = {
      completeJson: vi.fn()
        .mockResolvedValueOnce(invalidModelResponse)
        .mockResolvedValueOnce(repairedModelResponse),
    };

    const validate = vi.fn((response: Record<string, unknown>) => {
      if (response === invalidModelResponse) {
        return {
          success: false,
          issues: [
            { code: "invalid_evidence_ref", path: "work_experience.0.bullets.0.evidence_refs.0" },
            { code: "invalid_project_id", path: "projects.0.project_id" },
            { code: "unsupported_claim", path: "work_experience.0.bullets.0.text" },
          ],
        };
      }

      return { success: true, issues: [] };
    });

    const result = await generateWithRepair?.({
      provider,
      validate,
      request: {
        jobDescription: "Backend queues role; Kubernetes preferred.",
        roleMode: "backend",
        evidenceCards: [{ id: "captech_f100_idempotency", evidence_text: "SQS idempotency work." }],
        allowedProjectIds: ["aep_ai_safety"],
      },
    });

    expect(provider.completeJson).toHaveBeenCalledTimes(2);
    expect(validate).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(provider.completeJson.mock.calls[1])).toMatch(/invalid_evidence_ref|invalid_project_id|unsupported_claim/);
    expect(result).toEqual(expect.objectContaining(repairedModelResponse));
  });
});
