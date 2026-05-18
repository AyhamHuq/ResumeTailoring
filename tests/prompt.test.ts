import { beforeAll, describe, expect } from "vitest";
import { findExistingPath, loadFirstModule, pickFunction, testOrSkip } from "./helpers/moduleLoader";

const promptCandidates = ["src/server/prompt.ts"];
const promptPath = findExistingPath(promptCandidates);
const runPromptTest = testOrSkip(Boolean(promptPath));

describe("resume generation prompt contract", () => {
  let buildSystemPrompt: (() => string) | undefined;
  let buildRepairPrompt: ((previousOutput: unknown, issues: unknown[], evidenceCards: Array<{ id: string } & Record<string, unknown>>) => string) | undefined;

  beforeAll(async () => {
    const loaded = await loadFirstModule(promptCandidates);
    buildSystemPrompt = loaded ? pickFunction<[], string>(loaded.module, ["buildSystemPrompt"]) : undefined;
    buildRepairPrompt = loaded ? pickFunction<[unknown, unknown[], Array<{ id: string }>], string>(loaded.module, ["buildRepairPrompt"]) : undefined;
  });

  runPromptTest("requires target page fill and rejects sparse resume output", () => {
    expect(buildSystemPrompt).toBeTypeOf("function");
    const prompt = buildSystemPrompt?.() ?? "";

    expect(prompt).toMatch(/90-95%/);
    expect(prompt).toMatch(/sparse resumes are invalid/i);
    expect(prompt).toMatch(/work and project bullets/i);
    expect(prompt).toMatch(/Select and rewrite evidence-backed bullets before choosing skills/i);
    expect(prompt).toMatch(/Skills is not a dumping ground/i);
  });

  runPromptTest("tells repair calls to add grounded bullets for under-fill issues", () => {
    expect(buildRepairPrompt).toBeTypeOf("function");
    const repairPrompt = buildRepairPrompt?.(
      { work_experience: [] },
      [
        { code: "resume_under_target_length", path: "resume", message: "too short" },
        { code: "job_under_min_bullets", path: "work_experience.0.bullets", message: "too few" },
        { code: "project_under_min_bullets", path: "projects", message: "too few" },
        { code: "keyword_prefer_bullet_not_covered", path: "keyword_report.details", message: "CI/CD needs a bullet" },
      ],
      [{ id: "captech_f100_idempotency" }],
    ) ?? "";

    expect(repairPrompt).toMatch(/resume_under_target_length/);
    expect(repairPrompt).toMatch(/add grounded bullets/i);
    expect(repairPrompt).toMatch(/job_under_min_bullets/);
    expect(repairPrompt).toMatch(/project_under_min_bullets/);
    expect(repairPrompt).toMatch(/keyword_prefer_bullet_not_covered/);
    expect(repairPrompt).toMatch(/do not add the term only to skills/i);
    expect(repairPrompt).toMatch(/at least 15 bullets/i);
  });

  runPromptTest("gives targeted repair guidance for containerized systems misses", () => {
    expect(buildRepairPrompt).toBeTypeOf("function");
    const repairPrompt = buildRepairPrompt?.(
      { work_experience: [] },
      [
        {
          code: "keyword_prefer_bullet_not_covered",
          path: "keyword_report.details",
          message: "Canonical 'containerized systems' from JD term 'containerized systems' is bullet-worthy but is not covered in a work/project bullet. Candidate section: work_experience job_id=captech. Suggested bullet slot: work_experience.0.bullets.3. Rewrite an existing grounded bullet instead of relying on Skills. Candidate evidence refs: captech_golf_serverless_cicd."
        },
      ],
      [
        {
          id: "captech_golf_serverless_cicd",
          type: "work_project_fact",
          parent_job_id: "captech",
          project_id: "captech_golf_itinerary",
          title: "Serverless golf itinerary architecture and CI/CD",
          evidence_text: "React TypeScript frontend on S3 with API Gateway, Lambda, Docker, GitHub Actions, and Playwright tests.",
          skills: ["Docker", "GitHub Actions", "Playwright"],
        },
      ],
    ) ?? "";

    expect(repairPrompt).toMatch(/containerized systems/i);
    expect(repairPrompt).toMatch(/Docker/i);
    expect(repairPrompt).toMatch(/captech_golf_serverless_cicd/);
    expect(repairPrompt).toMatch(/coverage_plan/);
  });
});
