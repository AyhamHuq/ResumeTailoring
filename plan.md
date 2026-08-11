# Resume Tailoring App Implementation Plan

## Current Workspace State

- Source PRD: `docs/resume-tailor-prd-revised.md`
- Supporting documents:
  - `data/documents/Ayham Huq - Master Resume.docx`
  - `data/documents/Ayham Huq - Resume.docx`
  - `data/documents/Resume - Braindump.docx`
- Base app directories were created before implementation paused:
  - `src/`
  - `src/client/`
  - `src/server/`
  - `src/shared/`
  - `public/`
  - `data/config/`
- `package.json` was created, but dependency installation did not complete because the active shell could not find `node` on `PATH`.

## Prerequisite Recovery

Use a terminal where `node`, `npm`, and `git` are on `PATH`.

Run:

```powershell
node --version
npm --version
git --version
npm install
```

If `npm install` left a partial `node_modules` directory from the interrupted attempt, remove only `node_modules` and retry:

```powershell
Remove-Item -Recurse -Force .\node_modules
npm install
```

Do not continue implementation until dependencies install cleanly.

## Summary

Build a local-first React/Vite + Node/Express app that:

- Converts Ayham's consolidated braindump into structured evidence cards.
- Accepts a pasted job description.
- Calls a configurable LLM through a local API proxy.
- Validates evidence-grounded structured JSON.
- Shows a keyword/evidence review panel.
- Previews a tailored one-page resume.
- Exports an ATS-safe DOCX from a coded template.

The LLM must never edit DOCX XML directly. It only returns validated JSON.

## Target Architecture

Use a TypeScript app with three main areas:

- `src/shared`: schemas, types, budgets, role modes, project IDs, validation helpers.
- `src/server`: Express API, LLM provider adapter, prompt construction, repair flow.
- `src/client`: React UI, localStorage persistence, evidence parsing, keyword review, resume preview, DOCX export.

Core runtime flow:

```text
Upload braindump DOCX
  -> parse with mammoth
  -> convert to evidence cards
  -> persist locally

Paste job description
  -> choose role mode
  -> call local Express API
  -> LLM returns structured JSON
  -> validate JSON, evidence refs, budgets, and unsupported terms
  -> render preview and review panels
  -> generate DOCX with docx package
```

## Implementation Steps

### 1. Project Configuration

- Finish scaffold files:
  - `index.html`
  - `vite.config.ts`
  - `tsconfig.json`
  - `tailwind.config.js`
  - `postcss.config.js`
  - `.env.example`
- Keep API keys only in `.env`.
- Use `VITE_API_BASE_URL` for client-to-server calls.
- Add npm scripts:
  - `dev`
  - `dev:client`
  - `dev:server`
  - `build`
  - `typecheck`
  - `test`

### 2. Static Profile Configuration

Create `data/config/resume-profile.json` with:

- Name and contact info.
- Education.
- Certifications.
- Fixed employers, titles, dates, and locations.
- Allowed role modes.
- Allowed project bank:
  - `aep_ai_safety`
  - `mario_monogame`
  - `coffee_dashboard`
- Fixed work experience IDs:
  - `captech`
  - `publicis_sapient`
  - `sallie_mae`

The app must not let the LLM rewrite static profile data.

### 3. Shared Schemas And Budgets

Implement shared TypeScript/Zod schemas for:

- `ResumeProfile`
- `EvidenceCard`
- `RoleMode`
- `GeneratedResume`
- `GeneratedBullet`
- `KeywordReport`
- `GenerateResumeRequest`
- `GenerateResumeResponse`
- `ValidationIssue`

Define fixed budget defaults:

- CapTech: 3 bullets.
- Publicis Sapient: 2-3 bullets.
- Sallie Mae: 2-3 bullets.
- Projects: 1-2 projects.
- Per-bullet word, character, and estimated-line limits.
- Skills section character or line budget.

Validation must reject:

- Missing required fields.
- Invalid project IDs.
- Invalid job IDs.
- Evidence refs that do not exist.
- Unsupported terms included as resume claims.
- Bullets over budget.

### 4. Braindump Parsing

Implement DOCX parsing with `mammoth`.

Then convert text into deterministic evidence cards using heading-based parsing:

- Consolidated skills and keywords.
- CapTech project sections.
- Publicis Sapient internship section.
- Sallie Mae internship section.
- Additional projects.
- Metrics and outcomes.
- Known unknowns.

The parser should fail visibly if required sections are missing:

- `CapTech Ventures`
- `Publicis Sapient`
- `Sallie Mae`
- `Additional Projects`

Evidence refs should be fact-level where useful, for example:

- `captech_f100_idempotency`
- `captech_bedrock_precision_recall`
- `captech_golf_10000_itineraries`
- `publicis_langchain_rag`
- `sallie_mae_200_accounts`
- `aep_pytorch_faiss_20000_records`
- `mario_collision_state_command_factory`

### 5. Keyword And Synonym Scoring

Implement local keyword extraction and scoring:

- Extract technical terms and noun-like phrases from the JD.
- Normalize source-grounded synonyms.
- Compare against generated bullets, skills, and evidence cards.

Classify keywords into:

- `covered_in_bullets`
- `covered_in_skills_only`
- `supported_but_omitted_for_space`
- `unsupported`

Required grounded synonym examples:

- `OOP` -> SOLID, state machine, command pattern, factory pattern.
- `CI/CD` -> Jenkins, GitHub Actions, Vercel.
- `cloud monitoring` -> CloudWatch Logs, CloudWatch Insights, alarms, logging, tracing.
- `vector search` -> FAISS, OpenSearch, document vector store, RAG.
- `IaC` -> CloudFormation, CDK, Ansible.

### 6. LLM Proxy

Implement `POST /api/generate-resume`.

Request input:

- Job description.
- Role mode.
- Static profile.
- Evidence cards.
- Allowed project IDs.
- Section budgets.

Server behavior:

- Build a strict system prompt.
- Instruct the model to use only supported facts.
- Require structured JSON.
- Require every generated bullet to include `evidence_refs`.
- Require unsupported JD terms to be listed instead of claimed.
- Validate model output.
- If validation fails, make one repair call with validation issues.
- Return either validated resume JSON or actionable errors.

Use an OpenAI-compatible provider adapter:

- `LLM_API_KEY`
- `LLM_BASE_URL`
- `LLM_MODEL`

Add a mock generation mode for local UI testing when no API key is present.

### 7. React UI

Build the main workflow as the first screen, not a landing page.

Components:

- `SetupPanel`: upload/status for braindump.
- `ProfileSummary`: static metadata display.
- `RoleModeSelector`: auto/backend/cloud/full_stack/ai/consulting.
- `JDInput`: job description textarea.
- `GenerateButton`: calls server.
- `KeywordEvidencePanel`: keyword categories.
- `ResumePreview`: one-page-style preview.
- `WorkExperiencePreview`: per-job bullets and evidence markers.
- `ProjectPreview`: selected project and alternates.
- `EvidenceTraceDrawer`: source facts for a selected bullet.
- `ExportButton`: generates DOCX.

UI requirements:

- Dense, work-focused layout.
- No marketing hero page.
- No nested cards.
- Use lucide icons for actions where helpful.
- Show validation failures clearly.
- Let the user regenerate the whole resume after changing role mode or JD.

### 8. DOCX Export

Implement DOCX generation with `docx`.

Template rules:

- Single column.
- No tables.
- No text boxes.
- No icons or graphics.
- Contact info in body text, not header/footer.
- Standard font: Times New Roman or Calibri.
- Fixed section order:
  - Name/contact
  - Education
  - Work Experience
  - Skills
  - Projects
  - Certifications

Generated content:

- Work bullets from validated JSON.
- Projects from selected validated project IDs.
- Skills ordered by JD relevance.

Static content:

- Name/contact.
- Education.
- Certifications.
- Employer names.
- Job titles.
- Dates.
- Locations.

If page budget is tight, reduce project bullets before core work-experience bullets.

### 9. Tests

Add focused tests for:

- Evidence parsing from the consolidated braindump.
- Required section detection.
- Valid and invalid evidence refs.
- Invalid project IDs.
- Unsupported keyword rejection.
- Budget validation.
- Keyword synonym classification.
- LLM repair flow with mocked provider responses.
- DOCX generation smoke test.

Run before completion:

```powershell
npm run typecheck
npm test
npm run build
```

### 10. Architecture Document

After implementation, create `docs/architecture.md`.

It should document:

- System overview.
- Main modules and ownership.
- Runtime data flow.
- Evidence card format.
- LLM API contract.
- Validation rules.
- Keyword scoring approach.
- DOCX export strategy.
- Local environment setup.
- Known limitations.
- Future improvements.

## Acceptance Criteria

- Braindump upload produces structured evidence cards with stable IDs.
- Missing required braindump sections fail visibly.
- Static profile metadata comes from `resume-profile.json`.
- JD generation returns schema-valid JSON.
- Every bullet has valid evidence refs.
- Unsupported JD terms are surfaced and not claimed.
- Role mode influences bullet, skill, and project prioritization.
- Project selection supports alternates and validated swaps.
- Keyword panel separates bullet-covered, skills-only, omitted, and unsupported terms.
- DOCX opens without corruption.
- DOCX uses ATS-safe layout.
- Full local workflow can complete from JD paste to DOCX export.

## Implementation Notes

- Do not parse the master resume at runtime.
- Do not let the LLM control DOCX formatting.
- Do not silently truncate over-budget bullets; repair them.
- Keep generated claims tied to source evidence.
- Prefer deterministic parsing and validation over LLM-only judgment.
- Keep the architecture doc aligned with the implemented code, not just the PRD.
