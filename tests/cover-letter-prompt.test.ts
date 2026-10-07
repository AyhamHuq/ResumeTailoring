import { beforeAll, describe, expect } from "vitest";
import { findExistingPath, loadFirstModule, pickFunction, testOrSkip } from "./helpers/moduleLoader";

const promptCandidates = ["src/server/coverLetterPrompt.ts"];
const promptPath = findExistingPath(promptCandidates);
const runTest = testOrSkip(Boolean(promptPath));

describe("cover letter prompt contract", () => {
  let buildCoverLetterSystemPrompt: (() => string) | undefined;
  let buildCoverLetterRepairPrompt: ((prev: unknown, issues: unknown[], cards: Array<{ id: string } & Record<string, unknown>>) => string) | undefined;

  beforeAll(async () => {
    const loaded = await loadFirstModule(promptCandidates);
    buildCoverLetterSystemPrompt = loaded ? pickFunction<[], string>(loaded.module, ["buildCoverLetterSystemPrompt"]) : undefined;
    buildCoverLetterRepairPrompt = loaded ? pickFunction<[unknown, unknown[], Array<{ id: string } & Record<string, unknown>>], string>(loaded.module, ["buildCoverLetterRepairPrompt"]) : undefined;
  });

  runTest("system prompt includes core cover letter rules", () => {
    expect(buildCoverLetterSystemPrompt).toBeTypeOf("function");
    const prompt = buildCoverLetterSystemPrompt!();
    expect(prompt).toMatch(/evidence_cards/i);
    expect(prompt).toMatch(/first person/i);
    expect(prompt).toMatch(/250-400 words/i);
    expect(prompt).toMatch(/complement/i);
    expect(prompt).toMatch(/JSON/i);
  });

  runTest("system prompt prohibits cliches", () => {
    const prompt = buildCoverLetterSystemPrompt!();
    expect(prompt).toMatch(/passionate about/i);
    expect(prompt).toMatch(/excited to/i);
  });

  runTest("repair prompt includes previous output and issues", () => {
    expect(buildCoverLetterRepairPrompt).toBeTypeOf("function");
    const repairPrompt = buildCoverLetterRepairPrompt!(
      { opening: { text: "short" } },
      [{ code: "under_target_length", path: "cover_letter", message: "too short" }],
      [{ id: "card_a", type: "work_project_fact", title: "Test", evidence_text: "Built a thing", skills: ["Java"], metrics: [], role_tags: ["backend"], source_heading: "Test" }]
    );
    const parsed = JSON.parse(repairPrompt);
    expect(parsed.previous_output).toBeDefined();
    expect(parsed.validation_issues).toHaveLength(1);
    expect(parsed.candidate_evidence_cards).toHaveLength(1);
  });
});
