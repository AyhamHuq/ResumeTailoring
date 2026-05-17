import "dotenv/config";
import express from "express";
import cors from "cors";
import {
  GenerateResumeRequestSchema,
  GeneratedResumeSchema,
  curateGeneratedResumeSkills,
  scoreKeywords,
  termsProhibitedAsClaims,
  validateGeneratedResume,
  type ValidationIssue
} from "../shared";
import { parseDocxBuffer } from "./evidenceParser";
import { getLlmConfig, callOpenAiCompatibleJson } from "./llmProvider";
import { generateMockResume } from "./mockGenerator";
import { buildRepairPrompt, buildSystemPrompt, buildUserPrompt } from "./prompt";
import { loadResumeProfile } from "./profile";

const app = express();
const port = Number(process.env.SERVER_PORT ?? process.env.PORT ?? 3001);
const MAX_LLM_REPAIR_ATTEMPTS = 2;

app.use(cors());
app.use(express.json({ limit: "12mb" }));

function errorIssue(code: string, message: string, path = "$"): ValidationIssue {
  return { code, path, message, severity: "error" };
}

function prepareGeneratedCandidate(rawOutput: unknown) {
  const schemaCheck = GeneratedResumeSchema.safeParse(rawOutput);
  if (!schemaCheck.success) {
    return { rawOutput, schemaCheck };
  }

  const curated = curateGeneratedResumeSkills(schemaCheck.data);
  return {
    rawOutput: curated,
    schemaCheck: GeneratedResumeSchema.safeParse(curated)
  };
}

app.get("/api/profile", async (_req, res) => {
  try {
    res.json(await loadResumeProfile());
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to load profile." });
  }
});

app.get("/api/status", (_req, res) => {
  const llmConfig = getLlmConfig();
  res.json({
    ok: true,
    mode: llmConfig.apiKey ? "llm" : "mock",
    model: llmConfig.model,
    base_url: llmConfig.baseUrl,
    has_api_key: Boolean(llmConfig.apiKey)
  });
});

app.post("/api/parse-evidence", async (req, res) => {
  try {
    const docxBase64 = req.body?.docx_base64;
    if (typeof docxBase64 !== "string" || docxBase64.length === 0) {
      res.status(400).json({ ok: false, errors: [errorIssue("missing_docx", "Provide docx_base64 in the JSON body.", "docx_base64")] });
      return;
    }
    const cards = await parseDocxBuffer(Buffer.from(docxBase64, "base64"));
    res.json({ ok: true, evidence_cards: cards });
  } catch (error) {
    res.status(422).json({ ok: false, errors: [errorIssue("parse_failed", error instanceof Error ? error.message : "Failed to parse DOCX.")] });
  }
});

app.post("/api/generate-resume", async (req, res) => {
  try {
    const profile = await loadResumeProfile();
    const parsed = GenerateResumeRequestSchema.safeParse({ ...req.body, profile: req.body?.profile ?? profile });
    if (!parsed.success) {
      res.status(400).json({
        ok: false,
        errors: parsed.error.issues.map((issue) => errorIssue("request_schema_error", issue.message, issue.path.join(".") || "$"))
      });
      return;
    }

    const request = parsed.data;
    const effectiveProfile = request.profile ?? profile;
    const llmConfig = getLlmConfig();
    const mode = llmConfig.apiKey ? "llm" : "mock";
    let rawOutput: unknown;

    if (mode === "mock") {
      rawOutput = generateMockResume(request.evidence_cards, effectiveProfile, request.role_mode);
    } else {
      rawOutput = await callOpenAiCompatibleJson([
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: buildUserPrompt(request, effectiveProfile) }
      ], llmConfig);
    }

    let prepared = prepareGeneratedCandidate(rawOutput);
    rawOutput = prepared.rawOutput;
    let schemaCheck = prepared.schemaCheck;
    let keywordReport = schemaCheck.success
      ? scoreKeywords(request.job_description, schemaCheck.data, request.evidence_cards)
      : undefined;
    let validation = validateGeneratedResume(rawOutput, request.evidence_cards, effectiveProfile, termsProhibitedAsClaims(keywordReport), request.allowed_project_ids);

    for (let attempt = 0; validation.issues.length > 0 && mode === "llm" && attempt < MAX_LLM_REPAIR_ATTEMPTS; attempt += 1) {
      rawOutput = await callOpenAiCompatibleJson([
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: buildUserPrompt(request, effectiveProfile) },
        { role: "user", content: buildRepairPrompt(rawOutput, validation.issues, request.evidence_cards) }
      ], llmConfig);
      prepared = prepareGeneratedCandidate(rawOutput);
      rawOutput = prepared.rawOutput;
      schemaCheck = prepared.schemaCheck;
      keywordReport = schemaCheck.success
        ? scoreKeywords(request.job_description, schemaCheck.data, request.evidence_cards)
        : undefined;
      validation = validateGeneratedResume(rawOutput, request.evidence_cards, effectiveProfile, termsProhibitedAsClaims(keywordReport), request.allowed_project_ids);
    }

    if (!validation.resume || validation.issues.length > 0) {
      res.status(422).json({ ok: false, errors: validation.issues, keyword_report: keywordReport, raw_model_output: rawOutput });
      return;
    }

    res.json({
      ok: true,
      resume: validation.resume,
      keyword_report: keywordReport ?? scoreKeywords(request.job_description, validation.resume, request.evidence_cards),
      keywordReport: keywordReport ?? scoreKeywords(request.job_description, validation.resume, request.evidence_cards),
      fit_report: validation.fit_report,
      fitReport: validation.fit_report,
      validation_issues: [],
      validationIssues: [],
      mode
    });
  } catch (error) {
    res.status(502).json({
      ok: false,
      errors: [errorIssue("generation_failed", error instanceof Error ? error.message : "Resume generation failed.")]
    });
  }
});

app.listen(port, () => {
  console.log(`Resume tailoring API listening on http://127.0.0.1:${port}`);
});
