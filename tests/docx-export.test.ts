import { beforeAll, describe, expect } from "vitest";
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
});
