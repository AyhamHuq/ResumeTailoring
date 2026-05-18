import { beforeAll, describe, expect } from "vitest";
import { findExistingPath, loadFirstModule, pickFunction, testOrSkip } from "./helpers/moduleLoader";

const parserCandidates = [
  "src/client/lib/evidenceParser.ts",
  "src/client/lib/parseEvidence.ts",
  "src/shared/evidenceParser.ts",
  "src/shared/evidence.ts",
];

const parserPath = findExistingPath(parserCandidates);
const runParserTest = testOrSkip(Boolean(parserPath));

type EvidenceCard = {
  id: string;
  evidence_text?: string;
  source_heading?: string;
  skills?: string[];
};

function cardList(result: unknown): EvidenceCard[] {
  if (Array.isArray(result)) {
    return result as EvidenceCard[];
  }

  if (result && typeof result === "object" && Array.isArray((result as { cards?: unknown }).cards)) {
    return (result as { cards: EvidenceCard[] }).cards;
  }

  throw new Error("Evidence parser must return an array of cards or an object with a cards array.");
}

describe("evidence parsing contract", () => {
  let parseEvidence: ((text: string) => unknown) | undefined;

  beforeAll(async () => {
    const loaded = await loadFirstModule(parserCandidates);
    parseEvidence = loaded
      ? pickFunction<[string], unknown>(loaded.module, [
        "parseEvidenceCards",
        "parseBraindumpText",
        "textToEvidenceCards",
        "buildEvidenceCards",
      ])
      : undefined;
  });

  runParserTest("parses required braindump sections into stable evidence cards", () => {
    expect(parseEvidence, "Expose a public evidence parsing helper.").toBeTypeOf("function");

    const cards = cardList(parseEvidence?.(`
# Consolidated Skills and Keywords
AWS Lambda, SQS, DynamoDB, Spring, React, PyTorch, FAISS, SOLID, command pattern.

# CapTech Ventures
## Fortune 100 Direct Messaging Migration
Implemented idempotent SQS retry behavior with Lambda, DynamoDB, and Spring APIs.
## Bedrock AI Tool
Measured precision and recall for a Bedrock document review workflow.

# Publicis Sapient
Built a LangChain RAG proof of concept with document retrieval.

# Sallie Mae
Supported almost 200 cloud accounts and CloudWatch monitoring work.

# Additional Projects
## AEP AI Safety
Trained a PyTorch classifier on 20,000 incident records with FAISS retrieval.
## Mario MonoGame
Implemented collision handling with state, command, and factory patterns.
`));

    expect(cards.length).toBeGreaterThanOrEqual(6);
    expect(cards.find((card) => card.id === "consolidated_skills_keywords")?.skills).toEqual(
      expect.arrayContaining(["AWS", "Lambda", "SQS", "DynamoDB", "Spring", "React", "PyTorch", "FAISS", "SOLID"]),
    );
    expect(cards.map((card) => card.id)).toEqual(
      expect.arrayContaining([
        "captech_f100_idempotency",
        "captech_bedrock_precision_recall",
        "publicis_langchain_rag",
        "sallie_mae_200_accounts",
        "aep_pytorch_faiss_20000_records",
        "mario_collision_state_command_factory",
      ]),
    );
  });

  runParserTest("fails visibly when a required braindump section is missing", () => {
    expect(parseEvidence, "Expose a public evidence parsing helper.").toBeTypeOf("function");

    expect(() => parseEvidence?.(`
# CapTech Ventures
Some CapTech facts.

# Publicis Sapient
Some internship facts.

# Additional Projects
Some project facts.
`)).toThrow(/Sallie Mae|required section|missing/i);
  });

  runParserTest("extracts expanded evidence needed for full-density resumes", () => {
    expect(parseEvidence, "Expose a public evidence parsing helper.").toBeTypeOf("function");

    const cards = cardList(parseEvidence?.(`
# Consolidated Skills and Keywords
AWS, Lambda, SQS, SNS, DynamoDB, API Gateway, S3, CloudWatch Logs, IAM, CloudFormation, Ansible, Spring, Flask, Azure SQL, React Native, PyTorch, FAISS.

# CapTech Ventures
## Fortune 100 Financial Company - Direct Messaging Migration
Updated Spring APIs, Lambda business logic, DynamoDB metadata, SQS FIFO queues, and Maestro API integration for customer messaging.
Implemented idempotent retry and reprocessing behavior for reliable SQS messaging.
Coordinated Jenkins production deployment during a code freeze across 3 teams in a cross-functional release.
## National Sports League - AWS Bedrock AI Analysis Tool
Built Bedrock RAG with OpenSearch vector retrieval and reranking.
Used multi-agent supervisor agent and Bedrock Evals evaluator model for semantic similarity scoring.
## National Golf League - Itinerary Recommendation Algorithm
Built a Golang regret insertion recommendation algorithm with route optimization and configuration-driven design.
Deployed React TypeScript frontend on S3 with API Gateway, Lambda, Docker, GitHub Actions, and Playwright tests.
Generated over 10,000 itineraries for a live event.
## Coffee Shop Analytics Dashboard
React coffee shop dashboard used Lambda, API Gateway, WCAG 2.2, CDK, SQLite, forecasting, daily revenue, profit margins, inventory, low stock alerts, sales tracking, and linear regression.

# Publicis Sapient
Built a Fortune 25 healthcare app with predictive recommendations for plan savings.
Built a LangChain RAG chatbot using OpenAI embeddings.
Owned Flask REST API backend work with Azure SQL schema integration.
Applied SOLID design, Jest, pytest, and Vercel CI/CD.

# Sallie Mae
AWS Config SNS messages were centralized into S3 and CloudWatch Logs across almost 200 accounts.
Implemented cross-account IAM trust policies and least-privilege IAM.
Automated infrastructure with Ansible, CloudFormation, Athena, and Glue.
Completed ServiceNow production deployment that was adopted by the team.

# Additional Projects
## AEP Hackathon - AI Safety Classification Tool
AEP project placed 2nd out of 17 teams with 800+ participants.
Trained a PyTorch classifier on 20,000 incident records with FAISS retrieval.
Built React Native, Flask, and SQLite app workflow.
## Mario Game Design Project - MonoGame / C#
Implemented collision handling with state, command, and factory patterns.
Owned player physics, enemies, save system, and game state behavior.
`));

    expect(cards.map((card) => card.id)).toEqual(expect.arrayContaining([
      "captech_f100_spring_lambda_dynamodb",
      "captech_f100_jenkins_coordination",
      "captech_bedrock_rag_opensearch",
      "captech_bedrock_multi_agent_eval",
      "captech_golf_algorithm_golang",
      "captech_golf_serverless_cicd",
      "captech_coffee_dashboard_accessibility",
      "captech_coffee_dashboard_kpis",
      "publicis_flask_azure_sql_backend",
      "publicis_solid_testing_cicd",
      "sallie_mae_config_sns_centralization",
      "sallie_mae_cross_account_iam",
      "sallie_mae_ansible_cloudformation",
      "aep_hackathon_second_place",
      "aep_react_native_flask_sqlite",
      "mario_physics_enemy_save_systems",
    ]));
  });
});
