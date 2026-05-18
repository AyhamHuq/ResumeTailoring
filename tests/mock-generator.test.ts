import { beforeAll, describe, expect } from "vitest";
import { findExistingPath, loadFirstModule, pickFunction, testOrSkip } from "./helpers/moduleLoader";

const mockCandidates = ["src/server/mockGenerator.ts"];
const validationCandidates = ["src/shared/validation.ts"];
const mockPath = findExistingPath(mockCandidates);
const validationPath = findExistingPath(validationCandidates);
const runMockTest = testOrSkip(Boolean(mockPath && validationPath));

type GenerateMockResume = (evidenceCards: Array<Record<string, unknown>>, profile: Record<string, unknown>, roleMode: string) => Record<string, unknown>;
type ValidateGeneratedResume = (resume: Record<string, unknown>, context: Record<string, unknown>) => { success?: boolean; valid?: boolean; issues?: Array<{ code?: string }> };

const profile = {
  name: "Ayham Huq",
  contact: {
    email: "ayham@example.com",
    location: "Chicago, IL",
    phone: "555-555-5555",
    linkedin: "linkedin.com/in/ayham-huq",
    website: "ayhamhuq.com",
  },
  education: [{ school: "Ohio State University", degree: "B.S. Computer Science", graduation: "May 2025", gpa: "3.95" }],
  certifications: ["AWS Certified Solutions Architect - Associate", "AWS Certified AI Practitioner - Associate"],
  role_modes: ["auto", "backend", "cloud", "full_stack", "ai", "consulting"],
  employers: [
    { job_id: "captech", employer: "CapTech Ventures", title: "Associate Software Consultant", location: "Chicago, IL", dates: "07/2025 - Present" },
    { job_id: "publicis_sapient", employer: "Publicis Sapient", title: "Software Engineer Intern", location: "Chicago, IL", dates: "06/2024 - 08/2024" },
    { job_id: "sallie_mae", employer: "Sallie Mae", title: "Cloud Engineer Intern", location: "Indianapolis, IN", dates: "05/2023 - 08/2023" },
  ],
  allowed_projects: [
    { project_id: "aep_ai_safety", display_name: "AEP Hackathon - AI Safety Classification Tool" },
    { project_id: "mario_monogame", display_name: "MonoGame Mario Game" },
    { project_id: "coffee_dashboard", display_name: "Coffee Shop Analytics Dashboard" },
  ],
};

const evidenceCards = [
  ["captech_f100_spring_lambda_dynamodb", "captech"],
  ["captech_f100_idempotency", "captech"],
  ["captech_f100_jenkins_coordination", "captech"],
  ["captech_bedrock_rag_opensearch", "captech"],
  ["captech_golf_algorithm_golang", "captech"],
  ["publicis_langchain_rag", "publicis_sapient"],
  ["publicis_flask_azure_sql_backend", "publicis_sapient"],
  ["publicis_solid_testing_cicd", "publicis_sapient"],
  ["publicis_healthcare_predictive_app", "publicis_sapient"],
  ["sallie_mae_config_sns_centralization", "sallie_mae"],
  ["sallie_mae_cross_account_iam", "sallie_mae"],
  ["sallie_mae_ansible_cloudformation", "sallie_mae"],
  ["aep_pytorch_faiss_20000_records", undefined, "aep_ai_safety"],
  ["aep_react_native_flask_sqlite", undefined, "aep_ai_safety"],
  ["aep_hackathon_second_place", undefined, "aep_ai_safety"],
  ["mario_collision_state_command_factory", undefined, "mario_monogame"],
  ["mario_physics_enemy_save_systems", undefined, "mario_monogame"],
  ["captech_coffee_dashboard_accessibility", undefined, "coffee_dashboard"],
  ["captech_coffee_dashboard_kpis", undefined, "coffee_dashboard"],
].map(([id, parent_job_id, project_id]) => ({
  id,
  parent_job_id,
  project_id,
  evidence_text: `${id} evidence`,
  title: `${id} title`,
  skills: [],
  metrics: [],
  role_tags: [],
  source_heading: "Test",
}));

describe("mock resume generation contract", () => {
  let generateMockResume: GenerateMockResume | undefined;
  let validateGeneratedResume: ValidateGeneratedResume | undefined;

  beforeAll(async () => {
    const mockModule = await loadFirstModule(mockCandidates);
    const validationModule = await loadFirstModule(validationCandidates);
    generateMockResume = mockModule
      ? pickFunction<[Array<Record<string, unknown>>, Record<string, unknown>, string], Record<string, unknown>>(mockModule.module, ["generateMockResume"])
      : undefined;
    validateGeneratedResume = validationModule
      ? pickFunction<[Record<string, unknown>, Record<string, unknown>], ReturnType<ValidateGeneratedResume>>(validationModule.module, ["validateGeneratedResume"])
      : undefined;
  });

  runMockTest("returns full-density resume data that passes page-fit validation", () => {
    expect(generateMockResume).toBeTypeOf("function");
    expect(validateGeneratedResume).toBeTypeOf("function");

    const resume = generateMockResume?.(evidenceCards, profile, "ai") as Record<string, unknown>;
    const jobs = resume.work_experience as Array<{ job_id: string; bullets: unknown[] }>;
    const projects = resume.projects as Array<{ bullets: unknown[] }>;

    expect(jobs.find((job) => job.job_id === "captech")?.bullets).toHaveLength(5);
    expect(jobs.find((job) => job.job_id === "publicis_sapient")?.bullets).toHaveLength(4);
    expect(jobs.find((job) => job.job_id === "sallie_mae")?.bullets).toHaveLength(3);
    expect(projects.reduce((total, project) => total + project.bullets.length, 0)).toBeGreaterThanOrEqual(3);

    const validation = validateGeneratedResume?.(resume, {
      evidenceCards,
      profile,
      allowedProjectIds: ["aep_ai_safety", "mario_monogame", "coffee_dashboard"],
    });

    expect(validation?.success ?? validation?.valid).toBe(true);
    expect(validation?.issues ?? []).toHaveLength(0);
  });
});
