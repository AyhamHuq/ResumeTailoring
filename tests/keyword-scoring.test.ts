import { beforeAll, describe, expect } from "vitest";
import { findExistingPath, loadFirstModule, pickFunction, testOrSkip } from "./helpers/moduleLoader";

const keywordCandidates = [
  "src/client/lib/keywordScoring.ts",
  "src/shared/keywordScoring.ts",
  "src/shared/keywords.ts",
  "src/client/lib/keywords.ts",
];

const keywordPath = findExistingPath(keywordCandidates);
const runKeywordTest = testOrSkip(Boolean(keywordPath));

type KeywordReport = {
  covered_in_bullets: string[];
  covered_in_skills_only: string[];
  supported_but_omitted_for_space: string[];
  unsupported: string[];
  details?: Array<{
    term: string;
    canonical: string;
    status: string;
    support_level: string;
    evidence_refs: string[];
    matched_terms: string[];
    placement_recommendation: string;
  }>;
};

type ClassifyKeywords = (input: Record<string, unknown>) => KeywordReport;

describe("keyword synonym classification contract", () => {
  let classifyKeywords: ClassifyKeywords | undefined;

  beforeAll(async () => {
    const loaded = await loadFirstModule(keywordCandidates);
    classifyKeywords = loaded
      ? pickFunction<[Record<string, unknown>], KeywordReport>(loaded.module, [
        "classifyKeywords",
        "scoreKeywords",
        "buildKeywordReport",
      ])
      : undefined;
  });

  runKeywordTest("classifies grounded synonyms separately from unsupported JD terms", () => {
    expect(classifyKeywords, "Expose classifyKeywords({ jobDescription, generatedResume, evidenceCards }).")
      .toBeTypeOf("function");

    const report = classifyKeywords?.({
      jobDescription: "Need OOP, CI/CD, cloud monitoring, vector search, IaC, Kubernetes, and GraphQL.",
      generatedResume: {
        skills: [
          { name: "GitHub Actions" },
          { name: "CloudFormation" },
          { name: "CloudWatch Logs" },
        ],
        work_experience: [
          {
            bullets: [
              {
                text: "Applied SOLID principles with state, command, and factory patterns in a C# MonoGame project.",
              },
              {
                text: "Built RAG retrieval with FAISS and a document vector store.",
              },
            ],
          },
        ],
      },
      evidenceCards: [
        { id: "mario_collision_state_command_factory", skills: ["SOLID", "state machine", "command pattern", "factory pattern"] },
        { id: "captech_ci_cd", skills: ["GitHub Actions", "Jenkins"] },
        { id: "sallie_mae_monitoring", skills: ["CloudWatch Logs", "CloudWatch Insights", "alarms"] },
        { id: "publicis_langchain_rag", skills: ["FAISS", "RAG", "document vector store"] },
        { id: "coffee_dashboard_iac", skills: ["CloudFormation", "CDK"] },
      ],
    }) as KeywordReport;

    expect(report.covered_in_bullets).toEqual(expect.arrayContaining(["OOP", "vector search"]));
    expect(report.covered_in_skills_only).toEqual(expect.arrayContaining(["CI/CD", "cloud monitoring", "IaC"]));
    expect(report.unsupported).toEqual(expect.arrayContaining(["Kubernetes", "GraphQL"]));
  });

  runKeywordTest("filters JD boilerplate while honoring supported skills from evidence", () => {
    expect(classifyKeywords, "Expose classifyKeywords({ jobDescription, generatedResume, evidenceCards }).")
      .toBeTypeOf("function");

    const report = classifyKeywords?.({
      jobDescription: `
Unsupported
Job Description
What You Need
Minimum Requirements
Bachelor Computer Science Systems Software Developers Education Experience Master
Utilize Execute Troubleshoot Contribute Participate Designing Writing Professional Object-Oriented
JavaScript Docker CI/CD Jenkins Scrum ES6+ RESTFUL Automated testing Playwright Cypress Selenium Karate TeamCity
      `,
      generatedResume: null,
      evidenceCards: [
        {
          id: "consolidated_skills_keywords",
          title: "Consolidated skills and keywords",
          evidence_text: "JavaScript, Docker, CI/CD, Jenkins, Scrum, ES6+, REST APIs, Playwright, Cypress, Selenium, Karate, TeamCity, SOLID.",
          skills: ["JavaScript", "Docker", "CI/CD", "Jenkins", "Scrum", "ES6+", "REST APIs", "Playwright", "Cypress", "Selenium", "Karate", "TeamCity", "SOLID"],
        },
      ],
    }) as KeywordReport;

    expect(report.supported_but_omitted_for_space).toEqual(expect.arrayContaining([
      "JavaScript",
      "Docker",
      "Object-Oriented",
      "CI/CD",
      "Jenkins",
      "Scrum",
      "ES6+",
      "RESTful",
      "automated testing",
      "Playwright",
      "Cypress",
      "Selenium",
      "Karate",
      "TeamCity",
    ]));
    expect(report.unsupported).not.toEqual(expect.arrayContaining([
      "Job",
      "Description",
      "What",
      "Utilize",
      "Execute",
      "Troubleshoot",
      "Contribute",
      "Participate",
      "Bachelor",
      "Computer",
      "Science",
      "Object",
      "CI",
      "CD",
    ]));
  });

  runKeywordTest("handles JD testing and agile alternatives without forcing unsupported claims", () => {
    expect(classifyKeywords, "Expose classifyKeywords({ jobDescription, generatedResume, evidenceCards }).")
      .toBeTypeOf("function");

    const report = classifyKeywords?.({
      jobDescription: `
Experience or coursework must include Scrum, XP, or other agile methodologies.
Core web technologies, including ES6+ JavaScript and React.
Automated testing frameworks such as Karate, Playwright, Cypress, Selenium.
      `,
      generatedResume: null,
      evidenceCards: [
        {
          id: "consolidated_skills_keywords",
          type: "skill_fact",
          title: "Consolidated skills and keywords",
          evidence_text: "Languages: JavaScript, TypeScript. Testing: Playwright, Jest, pytest, API testing. Delivery: Jira and Agile.",
          skills: ["JavaScript", "TypeScript", "Playwright", "Jest", "pytest", "Agile"],
        },
        {
          id: "captech_golf_serverless_cicd",
          type: "work_project_fact",
          evidence_text: "Deployed React TypeScript frontend on S3 with API Gateway, Lambda, Docker, GitHub Actions, and Playwright tests.",
          skills: ["React", "TypeScript", "Docker", "GitHub Actions", "Playwright"],
        },
        {
          id: "publicis_healthcare_predictive_app",
          type: "work_project_fact",
          evidence_text: "Project managed using Jira and Agile methodology while delivering a healthcare recommendation app.",
          skills: ["Agile"],
        },
      ],
    }) as KeywordReport;

    const detail = (term: string) => report.details?.find((item) => item.term === term);

    expect(report.unsupported).not.toEqual(expect.arrayContaining([
      "Playwright",
      "Agile",
      "Scrum",
      "Cypress",
      "Selenium",
      "Karate",
      "XP",
    ]));
    expect(detail("Playwright")?.support_level).toMatch(/contextual_evidence|skill_list_only/);
    expect(detail("Playwright")?.evidence_refs).toEqual(expect.arrayContaining(["captech_golf_serverless_cicd"]));
    expect(detail("Agile")?.support_level).toMatch(/contextual_evidence|skill_list_only/);
    expect(detail("Scrum")?.support_level).toBe("synonym_only");
    expect(detail("Scrum")?.placement_recommendation).toBe("needs_source_update");
    expect(detail("Cypress")?.support_level).toBe("alternative_satisfied");
    expect(detail("Selenium")?.support_level).toBe("alternative_satisfied");
    expect(detail("Karate")?.support_level).toBe("alternative_satisfied");
    expect(detail("XP")?.support_level).toBe("alternative_satisfied");
  });

  runKeywordTest("does not satisfy exact tools from alternatives without an active example group", () => {
    expect(classifyKeywords, "Expose classifyKeywords({ jobDescription, generatedResume, evidenceCards }).")
      .toBeTypeOf("function");

    const report = classifyKeywords?.({
      jobDescription: "Need Cypress browser automation experience.",
      generatedResume: null,
      evidenceCards: [
        {
          id: "playwright_only",
          type: "work_project_fact",
          evidence_text: "Built Playwright tests for a React application.",
          skills: ["Playwright"],
        },
      ],
    }) as KeywordReport;

    expect(report.unsupported).toEqual(expect.arrayContaining(["Cypress"]));
  });
});
