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
});
