import { beforeAll, describe, expect } from "vitest";
import JSZip from "jszip";
import { findExistingPath, loadFirstModule, pickFunction, testOrSkip } from "./helpers/moduleLoader";

const exportCandidates = [
  "src/client/lib/docxExport.ts",
  "src/client/lib/exportDocx.ts",
  "src/shared/docxExport.ts",
];

const exportPath = findExistingPath(exportCandidates);
const runExportTest = testOrSkip(Boolean(exportPath));

type BuildDocx = (input: Record<string, unknown>) => Promise<Blob | Buffer | Uint8Array> | Blob | Buffer | Uint8Array;

async function toBytes(value: Awaited<ReturnType<BuildDocx>>): Promise<Uint8Array> {
  if (value instanceof Uint8Array) {
    return value;
  }

  if (typeof Blob !== "undefined" && value instanceof Blob) {
    return new Uint8Array(await value.arrayBuffer());
  }

  throw new Error("DOCX export helper must return a Blob, Buffer, or Uint8Array.");
}

describe("DOCX export contract", () => {
  let buildDocx: BuildDocx | undefined;

  beforeAll(async () => {
    const loaded = await loadFirstModule(exportCandidates);
    buildDocx = loaded
      ? pickFunction<[Record<string, unknown>], Promise<Blob | Buffer | Uint8Array> | Blob | Buffer | Uint8Array>(loaded.module, [
        "buildResumeDocx",
        "generateResumeDocx",
        "exportResumeDocx",
      ])
      : undefined;
  });

  runExportTest("generates a non-empty DOCX zip package from validated resume data", async () => {
    expect(buildDocx, "Expose buildResumeDocx({ profile, generatedResume }).").toBeTypeOf("function");

    const bytes = await toBytes(await buildDocx?.({
      profile: {
        name: "Ayham Huq",
        contact: {
          email: "ayham@example.com",
          phone: "555-555-5555",
          location: "Chicago, IL",
          linkedin: "linkedin.com/in/ayham-huq",
        },
        education: [{ school: "Ohio State University", degree: "B.S. Computer Science", graduation: "May 2025", gpa: "3.95" }],
        certifications: ["AWS Certified Solutions Architect - Associate"],
        workExperience: [
          { id: "captech", employer: "CapTech Ventures", title: "Associate Software Consultant", dates: "2025 - Present", location: "Chicago, IL" },
        ],
      },
      generatedResume: {
        role_mode: "backend",
        skills: [{ name: "AWS SQS" }, { name: "Spring" }],
        work_experience: [
          {
            job_id: "captech",
            bullets: [
              {
                text: "Built idempotent SQS retry behavior for resilient messaging workflows.",
                evidence_refs: ["captech_f100_idempotency"],
                jd_keywords: ["queues"],
                word_count: 9,
                char_count: 68,
                estimated_lines: 1,
              },
            ],
          },
        ],
        projects: [],
        keyword_report: {
          covered_in_bullets: ["queues"],
          covered_in_skills_only: [],
          supported_but_omitted_for_space: [],
          unsupported: [],
        },
      },
    }) as Awaited<ReturnType<BuildDocx>>);

    expect(bytes.byteLength).toBeGreaterThan(500);
    expect(String.fromCharCode(bytes[0], bytes[1])).toBe("PK");
  });

  runExportTest("uses ATS-safe page layout with full-density bullet paragraphs", async () => {
    expect(buildDocx, "Expose buildResumeDocx({ profile, generatedResume }).").toBeTypeOf("function");

    const bytes = await toBytes(await buildDocx?.({
      profile: {
        name: "Ayham Huq",
        contact: {
          email: "ayham@example.com",
          phone: "555-555-5555",
          location: "Chicago, IL",
          linkedin: "linkedin.com/in/ayham-huq",
          website: "ayhamhuq.com",
        },
        education: [{ school: "Ohio State University", degree: "B.S. Computer Science", graduation: "May 2025", gpa: "3.95" }],
        certifications: ["AWS Certified Solutions Architect - Associate", "AWS Certified AI Practitioner - Associate"],
        employers: [
          { job_id: "captech", employer: "CapTech Ventures", title: "Associate Software Consultant", dates: "07/2025 - Present", location: "Chicago, IL" },
          { job_id: "publicis_sapient", employer: "Publicis Sapient", title: "Software Engineer Intern", dates: "06/2024 - 08/2024", location: "Chicago, IL" },
          { job_id: "sallie_mae", employer: "Sallie Mae", title: "Cloud Engineer Intern", dates: "05/2023 - 08/2023", location: "Indianapolis, IN" },
        ],
        allowed_projects: [{ project_id: "aep_ai_safety", display_name: "AEP Hackathon - AI Safety Classification Tool" }],
        role_modes: ["auto", "backend", "cloud", "full_stack", "ai", "consulting"],
      },
      generatedResume: {
        role_mode: "ai",
        skills: ["Java", "Python", "TypeScript", "AWS Lambda", "API Gateway", "SQS", "DynamoDB", "S3", "CloudWatch Logs", "IAM", "CloudFormation", "Spring Boot", "Flask", "REST APIs", "LangChain", "RAG", "OpenSearch", "FAISS", "PyTorch", "Jest", "pytest", "Jenkins"],
        work_experience: [
          {
            job_id: "captech",
            bullets: [
              { text: "Extended Spring APIs, Lambda enrichment, DynamoDB metadata, and SQS FIFO queues to migrate customer messaging.", evidence_refs: ["a"], jd_keywords: [] },
              { text: "Implemented idempotent retry and reprocessing behavior so SQS-backed messages recovered without duplicate notifications.", evidence_refs: ["b"], jd_keywords: [] },
              { text: "Led cross-team Jenkins release coordination across Maestro, ingestion, and product teams during production freeze.", evidence_refs: ["c"], jd_keywords: [] },
              { text: "Improved Bedrock RAG precision and recall using OpenSearch retrieval, reranking, and evaluator-model scoring.", evidence_refs: ["d"], jd_keywords: [] },
              { text: "Built a Golang regret-insertion itinerary algorithm and React iframe that generated 10,000+ live itineraries.", evidence_refs: ["m"], jd_keywords: [] },
            ],
          },
          {
            job_id: "publicis_sapient",
            bullets: [
              { text: "Built a personalized LangChain RAG chatbot using OpenAI embeddings and user healthcare data.", evidence_refs: ["e"], jd_keywords: [] },
              { text: "Owned Flask REST backend work, including Azure SQL schema integration for React Native recommendations.", evidence_refs: ["f"], jd_keywords: [] },
              { text: "Applied SOLID design, Jest and pytest coverage, Vercel CI/CD, and client presentation practices.", evidence_refs: ["g"], jd_keywords: [] },
              { text: "Partnered on an 8-person Fortune 25 healthcare engagement and presented the finished app to the client representative.", evidence_refs: ["n"], jd_keywords: [] },
            ],
          },
          {
            job_id: "sallie_mae",
            bullets: [
              { text: "Centralized AWS Config SNS alerts from nearly 200 accounts into S3 and CloudWatch Logs.", evidence_refs: ["h"], jd_keywords: [] },
              { text: "Implemented cross-account IAM trust and least-privilege permissions for centralized logging writes.", evidence_refs: ["i"], jd_keywords: [] },
              { text: "Automated infrastructure with Ansible and CloudFormation for Lambda, S3, Athena, and Glue.", evidence_refs: ["j"], jd_keywords: [] },
            ],
          },
        ],
        projects: [
          {
            project_id: "aep_ai_safety",
            display_name: "AEP Hackathon - AI Safety Classification Tool",
            bullets: [
              { text: "Trained a PyTorch safety classifier on 20,000 records with FAISS retrieval and NLP preprocessing.", evidence_refs: ["k"], jd_keywords: [] },
              { text: "Built the React Native, Flask, and SQLite application workflow for field feedback.", evidence_refs: ["l"], jd_keywords: [] },
              { text: "Measured F1, precision, and accuracy while placing 2nd out of 17 teams with a practical AI safety approach.", evidence_refs: ["o"], jd_keywords: [] },
            ],
          },
        ],
      },
    }) as Awaited<ReturnType<BuildDocx>>);

    const zip = await JSZip.loadAsync(bytes);
    const documentXml = await zip.file("word/document.xml")?.async("string");
    expect(documentXml).toBeTruthy();
    expect(documentXml).not.toMatch(/<w:tbl\b|<w:txbxContent\b/);
    expect(documentXml).toMatch(/w:top="720"/);
    expect(documentXml).toMatch(/EDUCATION[\s\S]*WORK EXPERIENCE[\s\S]*SKILLS[\s\S]*PROJECTS[\s\S]*CERTIFICATIONS/);
    expect((documentXml?.match(/<w:numPr>/g) ?? []).length).toBeGreaterThanOrEqual(15);
  });
});
