import { beforeAll, describe, expect } from "vitest";
import { findExistingPath, loadFirstModule, pickFunction, testOrSkip } from "./helpers/moduleLoader";

const skillCandidates = [
  "src/shared/skills.ts",
  "src/shared/skillCuration.ts",
  "src/client/lib/skills.ts",
];

const skillPath = findExistingPath(skillCandidates);
const runSkillTest = testOrSkip(Boolean(skillPath));

type CurateSkills = (skills: string[], maxItems?: number, context?: { jobDescription?: string }) => string[];

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
      "CI/CD",
      "Agile",
      "Scrum",
      "idempotency",
      "event-driven architecture",
      "document vector store",
      "boto3",
      "NLP",
      "MonoGame",
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
      "CI/CD",
      "Agile",
      "Scrum",
      "idempotency",
      "event-driven architecture",
      "document vector store",
      "boto3",
      "NLP",
      "MonoGame",
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

  runSkillTest("allows role-conditional skills only when the JD explicitly calls for them", () => {
    expect(curateSkills, "Expose curateSkills(skills, maxItems?, context?).").toBeTypeOf("function");

    const withoutSignals = curateSkills?.(["NLP", "MonoGame", "boto3", "JavaScript"], 8, {
      jobDescription: "Build JavaScript and React services.",
    }) as string[];
    const withSignals = curateSkills?.(["NLP", "MonoGame", "boto3", "JavaScript"], 8, {
      jobDescription: "Need NLP, boto3, and MonoGame experience for a game development tool.",
    }) as string[];

    expect(withoutSignals).toEqual(["JavaScript"]);
    expect(withSignals).toEqual(expect.arrayContaining(["NLP", "MonoGame", "boto3", "JavaScript"]));
  });

  runSkillTest("prioritizes JD-matched concrete skills before trimming", () => {
    expect(curateSkills, "Expose curateSkills(skills, maxItems?, context?).").toBeTypeOf("function");

    const curated = curateSkills?.([
      "LangChain",
      "RAG",
      "OpenSearch",
      "FAISS",
      "PyTorch",
      "JavaScript",
      "React",
      "Docker",
      "Jenkins",
      "Playwright",
    ], 5, {
      jobDescription: "Need ES6+ JavaScript, React, Docker, Jenkins, and Playwright.",
    }) as string[];

    expect(curated).toEqual(["JavaScript", "React", "Docker", "Jenkins", "Playwright"]);
  });

  runSkillTest("splits comma grouped model skill lines before curation", () => {
    expect(curateSkills, "Expose curateSkills(skills, maxItems?, context?).").toBeTypeOf("function");

    const curated = curateSkills?.([
      "Languages: Java, JavaScript, TypeScript, Python",
      "React, REST APIs, Docker, Jenkins, Playwright",
      "CI/CD, OOP, Agile, design patterns"
    ], 20, {
      jobDescription: "Need JavaScript React REST APIs Docker Jenkins Playwright CI/CD OOP Agile design patterns.",
    }) as string[];

    expect(curated).toEqual(expect.arrayContaining([
      "Java",
      "JavaScript",
      "TypeScript",
      "Python",
      "React",
      "REST APIs",
      "Docker",
      "Jenkins",
      "Playwright",
    ]));
    expect(curated).not.toEqual(expect.arrayContaining(["CI/CD", "OOP", "Agile", "design patterns"]));
  });
});
