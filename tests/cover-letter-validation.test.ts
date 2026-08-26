import { beforeAll, describe, expect } from "vitest";
import { findExistingPath, loadFirstModule, pickFunction, testOrSkip } from "./helpers/moduleLoader";

const validationCandidates = ["src/shared/coverLetterValidation.ts"];
const validationPath = findExistingPath(validationCandidates);
const runTest = testOrSkip(Boolean(validationPath));

type ValidationResult = {
  success: boolean;
  valid: boolean;
  coverLetter?: unknown;
  fit_report?: unknown;
  issues: Array<{ code: string; path: string; message: string; severity: string }>;
};

const EVIDENCE_CARDS = [
  { id: "card_a", type: "work_project_fact", parent_job_id: "captech", title: "A", evidence_text: "Built something", skills: ["Java"], metrics: [], role_tags: ["backend"], source_heading: "CapTech" },
  { id: "card_b", type: "work_project_fact", parent_job_id: "captech", title: "B", evidence_text: "Deployed something", skills: ["AWS"], metrics: ["30%"], role_tags: ["cloud"], source_heading: "CapTech" },
  { id: "card_c", type: "project_fact", project_id: "aep_ai_safety", title: "C", evidence_text: "Trained a model", skills: ["PyTorch"], metrics: [], role_tags: ["ai"], source_heading: "Projects" },
  { id: "card_d", type: "work_project_fact", parent_job_id: "publicis_sapient", title: "D", evidence_text: "Led delivery", skills: ["Flask"], metrics: [], role_tags: ["backend"], source_heading: "Publicis" },
];

function validCoverLetter() {
  return {
    role_mode: "backend",
    salutation: "Dear Hiring Manager,",
    opening: {
      text: "I am writing to express my strong interest in the Software Engineer position at Acme Corp. With professional experience spanning cloud architecture, full-stack development, and production delivery across Fortune 100 clients, I am confident I can contribute meaningfully to your engineering team from day one and help drive technical excellence.",
      evidence_refs: [],
      jd_keywords: ["cloud", "full-stack"],
      purpose: "hook"
    },
    body_paragraphs: [
      {
        text: "At CapTech Consulting, I built production-grade Spring Boot services deployed on AWS Lambda and DynamoDB, improving system reliability and reducing API latency for a Fortune 100 financial services client. I architected serverless patterns with Docker for local development alongside GitHub Actions CI/CD pipelines to deploy efficiently to S3 with API Gateway. This hands-on experience with cloud-first architecture and infrastructure-as-code directly aligns with your team's approach to building scalable, resilient backend systems that serve millions of users.",
        evidence_refs: ["card_a", "card_b"],
        jd_keywords: ["AWS", "Spring Boot", "serverless"],
        purpose: "technical_depth"
      },
      {
        text: "Beyond individual technical contributions, I have led cross-functional delivery efforts spanning multiple engineering teams. At Publicis Sapient, I served as primary backend engineer on a Fortune 25 healthcare client engagement, building a Python Flask API with Azure SQL and coordinating with product managers and designers to ship personalized analytics features on schedule. This collaborative work sharpened my ability to communicate technical decisions clearly, align engineering priorities with business outcomes, and deliver results in Agile environments with high stakeholder visibility.",
        evidence_refs: ["card_d"],
        jd_keywords: ["collaboration", "delivery"],
        purpose: "leadership_impact"
      }
    ],
    closing: {
      text: "I would welcome the opportunity to discuss how my cloud architecture experience, backend engineering skills, and track record of cross-team delivery align with Acme Corp's goals. Thank you for your time and consideration, and I look forward to the possibility of contributing to your team.",
      evidence_refs: [],
      jd_keywords: [],
      purpose: "closing"
    },
    sign_off: "Sincerely,",
    complementary_keywords: ["AWS", "Spring Boot"]
  };
}

describe("cover letter validation", () => {
  let validate: ((candidate: unknown, context: { evidenceCards: typeof EVIDENCE_CARDS }) => ValidationResult) | undefined;

  beforeAll(async () => {
    const loaded = await loadFirstModule(validationCandidates);
    validate = loaded ? pickFunction(loaded.module, ["validateGeneratedCoverLetter"]) : undefined;
  });

  runTest("accepts a valid cover letter", () => {
    expect(validate).toBeTypeOf("function");
    const result = validate!(validCoverLetter(), { evidenceCards: EVIDENCE_CARDS });
    expect(result.success).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(result.coverLetter).toBeDefined();
    expect(result.fit_report).toBeDefined();
  });

  runTest("rejects invalid evidence refs", () => {
    const cl = validCoverLetter();
    cl.body_paragraphs[0].evidence_refs = ["nonexistent_card"];
    const result = validate!(cl, { evidenceCards: EVIDENCE_CARDS });
    expect(result.issues.some((i) => i.code === "invalid_evidence_ref")).toBe(true);
  });

  runTest("rejects body paragraph with no evidence refs", () => {
    const cl = validCoverLetter();
    cl.body_paragraphs[0].evidence_refs = [];
    const result = validate!(cl, { evidenceCards: EVIDENCE_CARDS });
    expect(result.issues.some((i) => i.code === "missing_evidence_refs")).toBe(true);
  });

  runTest("rejects too few total distinct evidence refs", () => {
    const cl = validCoverLetter();
    cl.body_paragraphs[0].evidence_refs = ["card_a"];
    cl.body_paragraphs[1].evidence_refs = ["card_a"];
    const result = validate!(cl, { evidenceCards: EVIDENCE_CARDS });
    expect(result.issues.some((i) => i.code === "insufficient_evidence_refs")).toBe(true);
  });

  runTest("rejects too few keywords", () => {
    const cl = validCoverLetter();
    cl.opening.jd_keywords = [];
    cl.body_paragraphs[0].jd_keywords = ["AWS"];
    cl.body_paragraphs[1].jd_keywords = [];
    cl.closing.jd_keywords = [];
    const result = validate!(cl, { evidenceCards: EVIDENCE_CARDS });
    expect(result.issues.some((i) => i.code === "insufficient_keywords")).toBe(true);
  });

  runTest("reports under_target fit status for short letters", () => {
    const cl = validCoverLetter();
    cl.opening.text = "Short opening here.";
    cl.body_paragraphs = [
      {
        text: "Short body one.",
        evidence_refs: ["card_a", "card_b"],
        jd_keywords: ["AWS", "Python"],
        purpose: "technical_depth"
      },
      {
        text: "Short body two.",
        evidence_refs: ["card_c"],
        jd_keywords: ["Docker", "React"],
        purpose: "leadership_impact"
      }
    ];
    cl.closing.text = "Thanks.";
    const result = validate!(cl, { evidenceCards: EVIDENCE_CARDS });
    expect(result.issues.some((i) => i.code === "under_target_length")).toBe(true);
  });
});
