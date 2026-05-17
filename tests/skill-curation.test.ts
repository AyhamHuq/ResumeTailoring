import { beforeAll, describe, expect } from "vitest";
import { findExistingPath, loadFirstModule, pickFunction, testOrSkip } from "./helpers/moduleLoader";

const skillCandidates = [
  "src/shared/skills.ts",
  "src/shared/skillCuration.ts",
  "src/client/lib/skills.ts",
];

const skillPath = findExistingPath(skillCandidates);
const runSkillTest = testOrSkip(Boolean(skillPath));

type CurateSkills = (skills: string[], maxItems?: number) => string[];

describe("skill curation contract", () => {
  let curateSkills: CurateSkills | undefined;

  beforeAll(async () => {
    const loaded = await loadFirstModule(skillCandidates);
    curateSkills = loaded
      ? pickFunction<[string[], number | undefined], string[]>(loaded.module, [
        "curateSkills",
        "curateResumeSkills",
      ])
      : undefined;
  });

  runSkillTest("keeps compact labels and removes low-signal forced skills", () => {
    expect(curateSkills, "Expose curateSkills(skills, maxItems?).").toBeTypeOf("function");

    const curated = curateSkills?.([
      "JavaScript",
      "ES6+",
      "React",
      "RESTful",
      "Docker",
      "unit testing",
      "automated testing",
      "test automation",
      "SOLID",
      "Playwright",
      "Jenkins",
    ]) as string[];

    expect(curated).toEqual(expect.arrayContaining([
      "JavaScript",
      "React",
      "REST APIs",
      "Docker",
      "Playwright",
      "Jenkins",
    ]));
    expect(curated).not.toEqual(expect.arrayContaining([
      "ES6+",
      "unit testing",
      "automated testing",
      "test automation",
      "SOLID",
    ]));
  });

  runSkillTest("deduplicates aliases within the compact skill limit", () => {
    expect(curateSkills, "Expose curateSkills(skills, maxItems?).").toBeTypeOf("function");

    const curated = curateSkills?.([
      "RESTful APIs",
      "REST API",
      "REST APIs",
      "JavaScript",
      "ES6",
      "Docker",
    ], 4) as string[];

    expect(curated).toEqual(["REST APIs", "JavaScript", "Docker"]);
  });
});
