import { beforeAll, describe, expect } from "vitest";
import { findExistingPath, loadFirstModule, pickFunction, testOrSkip } from "./helpers/moduleLoader";

const keywordCandidates = ["src/shared/keywords.ts"];
const skillCandidates = ["src/shared/skills.ts"];
const keywordPath = findExistingPath(keywordCandidates);
const skillPath = findExistingPath(skillCandidates);
const runRegressionTest = testOrSkip(Boolean(keywordPath && skillPath));

type KeywordReport = {
  covered_in_bullets: string[];
  covered_in_skills_only: string[];
  details?: Array<{
    canonical: string;
    status: string;
  }>;
};

type ClassifyKeywords = (input: Record<string, unknown>) => KeywordReport;
type CurateSkills = (skills: string[], maxItems?: number, context?: { jobDescription?: string }) => string[];

const jdFixture = `
Design and build software components of services and/or platforms.
Utilize algorithms, data structures, and design patterns to produce efficient and performant code.
Professional software engineering practices for the full software development life cycle including build processes, testing, and operations.
Object-oriented design, data structures, algorithm design, problem solving, and complexity analysis.
Scrum, XP, or other agile methodologies.
AWS.
Core web technologies, including ES6+ JavaScript and React.
Experience designing, building, deploying, testing, and evolving responsive user interfaces.
Automated testing frameworks such as Karate, Playwright, Cypress, Selenium.
Developing CI/CD pipelines using Jenkins, TeamCity or comparable tools.
Experience with containerized systems such as Docker.
`;

describe("bullet-first JD regression", () => {
  let classifyKeywords: ClassifyKeywords | undefined;
  let curateSkills: CurateSkills | undefined;

  beforeAll(async () => {
    const keywordModule = await loadFirstModule(keywordCandidates);
    const skillModule = await loadFirstModule(skillCandidates);
    classifyKeywords = keywordModule
      ? pickFunction<[Record<string, unknown>], KeywordReport>(keywordModule.module, ["classifyKeywords", "scoreKeywords"])
      : undefined;
    curateSkills = skillModule
      ? pickFunction<[string[], number | undefined, { jobDescription?: string } | undefined], string[]>(skillModule.module, ["curateSkills"])
      : undefined;
  });

  runRegressionTest("covers JD concepts in bullets while keeping skills recruiter-normal", () => {
    expect(classifyKeywords).toBeTypeOf("function");
    expect(curateSkills).toBeTypeOf("function");

    const curatedSkills = curateSkills?.([
      "JavaScript",
      "React",
      "Docker",
      "Jenkins",
      "Playwright",
      "event-driven architecture",
      "idempotency",
      "document vector store",
      "boto3",
      "NLP",
      "MonoGame",
    ], 20, { jobDescription: jdFixture }) as string[];

    expect(curatedSkills).toEqual(expect.arrayContaining(["JavaScript", "React", "Docker", "Jenkins", "Playwright"]));
    expect(curatedSkills).not.toEqual(expect.arrayContaining([
      "event-driven architecture",
      "idempotency",
      "document vector store",
      "boto3",
      "NLP",
      "MonoGame",
    ]));

    const report = classifyKeywords?.({
      jobDescription: jdFixture,
      generatedResume: {
        skills: curatedSkills,
        work_experience: [
          {
            bullets: [
              { text: "Led Jenkins CI/CD production deployment coordination across product and ingestion teams during a code freeze." },
              { text: "Applied SOLID object-oriented design, Jest and pytest automated testing, and Agile delivery practices on a healthcare app." },
              { text: "Built React TypeScript responsive user interfaces backed by Flask REST APIs for healthcare plan recommendations." },
              { text: "Built a Golang regret-insertion route optimization algorithm for live itinerary recommendations." },
            ],
          },
        ],
        projects: [
          {
            bullets: [
              { text: "Implemented C# gameplay with state machine, command pattern, and factory pattern design." },
            ],
          },
        ],
      },
      evidenceCards: [
        { id: "ci_cd", type: "work_project_fact", evidence_text: "Jenkins CI/CD production deployment coordination.", skills: ["Jenkins", "CI/CD"] },
        { id: "quality", type: "work_project_fact", evidence_text: "SOLID object-oriented design, Jest, pytest, Agile delivery.", skills: ["SOLID", "Jest", "pytest", "Agile"] },
        { id: "ui", type: "work_project_fact", evidence_text: "React TypeScript responsive user interfaces and REST APIs.", skills: ["React", "TypeScript", "JavaScript", "responsive user interfaces", "REST APIs"] },
        { id: "algo", type: "work_project_fact", evidence_text: "Golang regret insertion route optimization algorithm.", skills: ["Golang", "algorithms", "route optimization"] },
        { id: "patterns", type: "project_fact", evidence_text: "C# state machine, command pattern, and factory pattern.", skills: ["C#", "state machine", "command pattern", "factory pattern"] },
      ],
    }) as KeywordReport;

    const statusFor = (canonical: string) => report.details?.find((item) => item.canonical === canonical)?.status;

    expect(statusFor("Object-Oriented")).toBe("covered_in_bullets");
    expect(statusFor("algorithms")).toBe("covered_in_bullets");
    expect(statusFor("design patterns")).toBe("covered_in_bullets");
    expect(statusFor("CI/CD")).toBe("covered_in_bullets");
    expect(statusFor("Agile")).toBe("covered_in_bullets");
    expect(statusFor("automated testing")).toBe("covered_in_bullets");
    expect(statusFor("user interfaces")).toBe("covered_in_bullets");
    expect(report.covered_in_skills_only).toEqual(expect.arrayContaining(["JavaScript", "Docker", "Playwright"]));
  });
});
