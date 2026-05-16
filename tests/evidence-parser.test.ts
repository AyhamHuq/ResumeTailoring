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
});
