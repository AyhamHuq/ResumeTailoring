# PRD: AI-Powered Resume Tailoring Tool

**Version:** 1.2  
**Author:** Ayham  
**Status:** Draft - revised for consolidated braindump workflow and structured evidence handling  

---

## 1. Problem Statement

Current LLM-based resume tailoring workflows produce rewritten bullet points that:

- Exceed one page with no enforcement mechanism
- Hallucinate skills or experiences not grounded in real context
- Require manual copy-paste into Word with no ATS safety guarantee
- Miss keyword/synonym opportunities, such as a JD saying "OOP" while the source says "SOLID principles"
- Cannot choose between multiple valid projects based on the job description
- Are hard to maintain because the resume, braindump, keyword bank, and project evidence are scattered

The goal is a **local resume-tailoring app** that takes a job description as input and outputs a fully tailored, ATS-safe, one-page DOCX resume grounded only in Ayham's consolidated braindump and static master-resume metadata.

---

## 2. Source Documents

The app has two source concepts:

| Source | Purpose |
|---|---|
| Consolidated braindump DOCX | Evidence source of truth: projects, skills, metrics, technologies, outcomes |
| `resume-profile.json` | Static identity/formatting source: name, contact, education, certifications, employer names, titles, dates |

The master resume DOCX can be used as a human reference, but the app should not depend on parsing it at runtime. Static metadata should live in a small editable `resume-profile.json` file so it cannot drift silently from the generated template.

The LLM may use the braindump to generate tailored content, but it must not rewrite static metadata such as education, company names, job titles, dates, or certification names.

---

## 3. Goals

| Goal | Metric |
|---|---|
| One-page enforcement | Word and line budgets per section are hard-capped before export |
| No hallucination | Every generated bullet maps to source evidence from the braindump |
| ATS safety | Programmatic DOCX generation from a coded template; no LLM-generated XML |
| Dynamic project selection | Project section can swap between AEP, MonoGame, or other eligible projects based on JD relevance |
| Role-aware tailoring | User can choose auto, backend, cloud, full-stack, AI, or consulting emphasis |
| Keyword coverage | App shows covered, skills-only, omitted, and unsupported JD keywords before export |
| Workflow speed | Paste JD -> click Generate -> export DOCX in under 60 seconds |
| Maintainability | New roles require no code changes; updating the braindump updates the evidence bank |

---

## 4. Non-Goals (MVP)

- Multi-page resumes
- Automatic JD scraping from URLs
- Cover letter generation
- Cloud hosting or user accounts
- Application tracking/history
- Editing raw DOCX XML with an LLM
- Runtime parsing of the master resume DOCX for layout or metadata

---

## 5. Key Technical Constraints & Decisions

### 5.1 LLMs Cannot Reliably Edit DOCX

DOCX is Office Open XML. LLMs can hallucinate XML structure, break styles, and corrupt files when asked to edit raw DOCX. **The LLM never touches the DOCX file.**

**Architecture decision:** LLM outputs structured JSON. The `docx` npm package builds the resume from a coded JavaScript template.

### 5.2 Use a Local API Proxy, Not Browser-Direct LLM Calls

A browser-only React app would expose the LLM API key and may run into browser/CORS constraints.

**Architecture decision:** MVP uses a local Node/Express proxy:

- React/Vite frontend runs locally
- Local Node endpoint calls the LLM API
- API key lives in a local `.env` file, not in client code
- No cloud hosting or authentication is required for MVP

### 5.3 Resume Template Is Coded, Not Parsed at Runtime

The resume structure, fonts, margins, spacing, heading styles, section order, and static metadata are defined once as JavaScript constants using the `docx` package.

This guarantees:

- ATS compliance by construction
- Deterministic formatting
- No dependency on parsing the master resume DOCX at runtime
- No LLM control over layout, headings, dates, education, or contact info

### 5.4 Braindump Becomes Structured Evidence Cards

DOCX parsing can flatten bullets and heading hierarchy. To avoid losing project boundaries, the app should convert the consolidated braindump into structured evidence cards after upload.

For MVP, this can be a deterministic heading-based parser rather than a complex NLP pipeline. The parser should identify known headings such as employer names, project names, "Tech Stack", "Outcome & Impact", and "Additional Projects".

Evidence card shape:

```json
{
  "id": "captech_f100_idempotency",
  "type": "work_project_fact",
  "parent_job_id": "captech",
  "project_id": "captech_f100_messaging",
  "title": "Idempotent direct messaging migration",
  "evidence_text": "SQS supported retry/reprocessing behavior; idempotency prevented duplicate processing issues.",
  "skills": ["SQS", "idempotency", "event-driven architecture"],
  "metrics": [],
  "role_tags": ["backend", "cloud"],
  "source_heading": "Project 1: Fortune 100 Financial Company - Direct Messaging Migration"
}
```

The app can also keep `braindump_text` as a fallback/debug artifact, but prompts and validation should prefer `evidence_cards`.

Evidence cards should cover:

- Work experience evidence
- Additional project evidence
- Skill/keyword evidence
- Metrics and outcomes
- Known unknowns that should not be invented

The parser should fail visibly if it cannot identify expected sections. It should not silently treat the whole braindump as one unstructured blob.

### 5.5 Dynamic Project Selection

The resume should not hard-code one project. The app selects the best project or projects based on the job description and the one-page budget.

Current eligible project bank:

| Project ID | Best-fit JDs |
|---|---|
| `aep_ai_safety` | AI/ML, PyTorch, NLP, FAISS, React Native, Flask, hackathon, energy/safety |
| `mario_monogame` | C#, OOP, design patterns, game development, graphics, collision/physics |
| `coffee_dashboard` | React, Python, AWS CDK, dashboards, analytics, accessibility, serverless |

The LLM may recommend project selection, but the app must validate that selected project IDs exist in the source/project bank.

Project selection should return alternates so the user can swap quickly without regenerating the entire resume.

### 5.6 Work Experience Is Fixed, But Bullets Are Selected

Employer metadata is static:

- CapTech Ventures - Associate Software Consultant
- Publicis Sapient - Software Engineer Intern
- Sallie Mae - Cloud Engineer Intern

Within each job, the LLM chooses the most relevant bullets from that job's available evidence. For CapTech, this means choosing across its project evidence:

- Fortune 100 direct messaging migration
- National sports league Bedrock AI tool
- National golf league itinerary tool
- Coffee shop analytics dashboard

The resume should not imply that CapTech client engagements were simultaneous.

### 5.7 Evidence Mapping Is Required

To reduce hallucination, every generated bullet should include hidden metadata:

- `evidence_refs`: short labels for the source evidence used
- `jd_keywords`: JD keywords addressed by the bullet
- `unsupported_terms`: terms the model wanted to use but could not support

Evidence metadata is shown in the UI for review but is not exported into the DOCX.

Evidence refs should be specific enough to prevent overgeneralization. Prefer fact-level IDs such as `sallie_mae_almost_200_accounts` over only broad IDs such as `sallie_mae`.

### 5.8 Synonym Use Is Allowed, But Must Be Grounded

The model may use a JD's wording when the braindump supports the concept under a different name.

Examples:

- JD says "OOP"; braindump mentions SOLID, state machine, command pattern, factory pattern
- JD says "CI/CD"; braindump mentions GitHub Actions and Jenkins production releases
- JD says "cloud monitoring"; braindump mentions CloudWatch Logs, CloudWatch Insights, alarms, logging, tracing
- JD says "vector search"; braindump mentions FAISS, OpenSearch, document vector store, RAG

The app should show these as grounded synonym matches, not hallucinated skills.

### 5.9 Role Modes And Resume Balance

The app supports role emphasis modes:

| Mode | Behavior |
|---|---|
| `auto` | Infer emphasis from JD |
| `backend` | Prioritize APIs, Java/Spring, Flask, Go, testing, system design |
| `cloud` | Prioritize AWS, serverless, IAM, IaC, monitoring, production deployment |
| `full_stack` | Balance frontend, backend, cloud, testing, product delivery |
| `ai` | Prioritize RAG, Bedrock, LangChain, PyTorch, FAISS, evaluation, data |
| `consulting` | Prioritize stakeholder coordination, client delivery, production releases, presentations |

Role mode should influence bullet selection, project selection, and skill ordering. It should not invent a different career narrative.

### 5.10 Page Fit Uses Word, Character, And Line Budgets

Word count alone is not enough because long technical terms wrap unpredictably in Word. The app should enforce:

- Word count per bullet and section
- Character count per bullet
- Estimated rendered line count per section
- Maximum number of bullets per section

If generated content exceeds budget, the app should request a compression/repair response from the LLM. It should not silently truncate bullets because truncation can damage meaning and grammar.

---

## 6. Resume Structure

The DOCX template uses a fixed one-page structure. Static sections never change; generated sections are constrained.

```text
[Name / Contact Header]          static
Education                        static
Work Experience                  static jobs; generated bullets
  CapTech Ventures               3 generated bullets
  Publicis Sapient               2-3 generated bullets
  Sallie Mae                     2-3 generated bullets
Projects                         dynamically selected 1-2 projects
  Selected Project(s)            generated bullets from project bank
Skills                           generated, source-grounded, JD-ordered
Certifications                   static
```

If the page budget is tight, the app should reduce project bullets before reducing core work-experience bullets.

---

## 7. Workflow

### 7.1 One-Time Setup

1. User uploads the consolidated braindump DOCX
2. App parses it using `mammoth.js` into plain text
3. App converts the plain text into structured `evidence_cards`
3. App stores:
   - `braindump_text`
   - `evidence_cards`
   - `braindump_filename`
   - `braindump_updated_at`
4. App loads static resume metadata from `resume-profile.json`

Example profile config:

```json
{
  "name": "Ayham Huq",
  "contact": {
    "email": "ayham.huq@gmail.com",
    "location": "Chicago, IL",
    "phone": "817-937-9331",
    "linkedin": "linkedin.com/in/ayham-huq",
    "website": "ayhamhuq.com"
  },
  "education": [
    {
      "school": "Ohio State University",
      "degree": "Bachelor of Science in Computer Science and Engineering",
      "graduation": "May 2025",
      "gpa": "3.95"
    }
  ],
  "certifications": [
    "AWS Certified Solutions Architect - Associate",
    "AWS Certified AI Practitioner - Associate"
  ]
}
```

### 7.2 Per-Application Workflow

```text
Paste JD into textarea
        |
Click Generate
        |
Local Node proxy calls LLM with:
  - braindump text
  - structured evidence cards
  - static resume metadata
  - project bank IDs
  - selected role mode
  - word/line budgets
  - JSON schema
  - JD text
        |
LLM returns structured JSON
        |
App validates schema, budgets, project IDs, and evidence fields
        |
App renders preview + keyword/evidence review
        |
User may regenerate whole resume or individual sections
        |
Click Export DOCX
        |
docx npm package builds file from JS template + validated JSON
        |
Browser downloads resume.docx
```

---

## 8. LLM API Contract

### 8.1 System Prompt Requirements

The system prompt must include:

- The consolidated braindump text
- Structured evidence cards
- Static resume metadata
- Fixed employer/job IDs
- Allowed project IDs
- Selected role mode
- Section budgets
- Synonym rules
- JSON schema
- Instruction to use only braindump-supported facts
- Instruction to mark unsupported JD terms rather than inventing experience

### 8.2 Output Schema

```json
{
  "role_mode": "auto",
  "skills": [
    {
      "name": "AWS Lambda",
      "source": "CapTech/Sallie Mae evidence",
      "matched_jd_keywords": ["serverless", "AWS"],
      "placement": "skills_and_bullets"
    }
  ],
  "work_experience": [
    {
      "job_id": "captech",
      "bullets": [
        {
          "text": "Built serverless messaging workflows with Lambda, SQS, DynamoDB, and Spring APIs for a Fortune 100 client.",
          "evidence_refs": ["captech_f100_messaging", "captech_f100_idempotency"],
          "jd_keywords": ["serverless", "AWS", "Spring"],
          "word_count": 15,
          "char_count": 112,
          "estimated_lines": 1
        }
      ]
    }
  ],
  "projects": [
    {
      "project_id": "aep_ai_safety",
      "display_name": "AEP Hackathon - AI Safety Classification Tool",
      "bullets": [
        {
          "text": "Trained a PyTorch safety classifier on 20,000 incident records, using FAISS retrieval and NLP preprocessing.",
          "evidence_refs": ["aep_ai_safety"],
          "jd_keywords": ["PyTorch", "NLP", "classification"],
          "word_count": 14,
          "char_count": 103,
          "estimated_lines": 1
        }
      ]
    }
  ],
  "keyword_report": {
    "covered_in_bullets": ["AWS", "React", "RAG"],
    "covered_in_skills_only": ["Jenkins"],
    "supported_but_omitted_for_space": ["MonoGame"],
    "unsupported": ["Kubernetes"]
  }
}
```

### 8.3 Validation

Before rendering, the app validates:

- JSON parses cleanly
- Required fields exist
- Project IDs are in the allowed project bank
- Evidence refs exist in `evidence_cards`
- Bullet word, character, and estimated line counts do not exceed limits
- Skills are present in the braindump or supported by grounded synonym rules
- Unsupported JD terms are not included in the resume body

If validation fails, the app requests a repair response from the LLM instead of silently truncating content.

---

## 9. Keyword Match And Evidence Score

The current simple token score should be upgraded to a more useful review panel.

### 9.1 Score Types

| Score | Meaning |
|---|---|
| Bullet coverage | JD keywords naturally present in generated bullets |
| Skills-only coverage | JD keywords present only in the skills section |
| Source coverage | JD keywords supported somewhere in the braindump |
| Unsupported keywords | JD keywords not supported by the braindump |

This distinction matters because a keyword can be real but omitted due to one-page constraints.
It also prevents the app from rewarding keyword stuffing in the skills section more than natural evidence-backed bullets.

### 9.2 Keyword Extraction

For MVP:

1. Extract noun phrases and technical terms from JD using a local heuristic list plus tokenization
2. Normalize known synonyms using a source-grounded synonym map
3. Compare against generated JSON and braindump/source terms
4. Classify matches as bullet-covered, skills-only, source-supported-but-omitted, or unsupported
5. Penalize skills-only stuffing if a critical JD keyword is not reflected in any bullet

This is a heuristic, not a true ATS simulation.

---

## 10. ATS Compliance Strategy

Since the DOCX is built programmatically from a JS template, compliance is enforced by construction:

| ATS Requirement | How It Is Guaranteed |
|---|---|
| No tables or text boxes | Use only `Paragraph` and `TextRun` primitives |
| Standard fonts | Hardcode Times New Roman or Calibri |
| Parseable headings | Use simple sequential heading paragraphs |
| Single column | No table/column layout |
| No critical header/footer content | Contact info rendered in body paragraphs |
| No icons or graphics | Plain text only |

---

## 11. Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Frontend framework | React + Vite | Fast local app and familiar stack |
| Local API proxy | Node + Express | Keeps LLM API key out of browser code |
| DOCX generation | `docx` npm package | Programmatic, ATS-safe output |
| DOCX parsing | `mammoth.js` | Reliable DOCX-to-plain-text extraction |
| LLM API | Configurable model/provider | Avoid hard-coding the app to one model release |
| Static metadata | `resume-profile.json` | Prevents drift between coded template and master resume |
| Evidence parser | Heading-based parser over `mammoth.js` output | Preserves project boundaries without complex NLP |
| Keyword scoring | Client-side JS | Fast feedback without extra API calls |
| State persistence | localStorage | Braindump persists locally |
| Styling | Tailwind CSS | Fast utility-class development |

The MVP may default to Claude Sonnet if desired, but model/provider should be configurable in environment variables.

---

## 12. Component Architecture

```text
App
  SetupPanel                 braindump upload/status
  ProfileSettings            displays static profile metadata
  RoleModeSelector           auto/backend/cloud/full-stack/AI/consulting
  JDInput                    textarea for job description
  GenerateButton             calls local API proxy
  KeywordEvidencePanel       bullet-covered / skills-only / omitted / unsupported keywords
  ResumePreview              generated resume preview
    WorkExperiencePreview    per-job bullets + evidence metadata
    ProjectPreview           selected project(s) + swap/regenerate controls
    SkillsPreview            generated skills line
  EvidenceTraceDrawer        shows source evidence refs for selected bullet
  ProjectSelectionPanel      shows selected project and alternates
  ExportButton               builds and downloads DOCX
```

---

## 13. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| LLM exceeds word budget | Validate counts client-side; request repair/compression instead of truncating |
| LLM returns malformed JSON | Validate schema; retry repair once; show actionable error |
| LLM selects weak project | Show project alternatives with source evidence and allow project-only regeneration |
| LLM includes unsupported keyword | Reject output or mark unsupported term for removal |
| DOCX parsing loses hierarchy | Convert `mammoth.js` text into heading-based evidence cards and fail visibly on parse issues |
| Master resume metadata drifts | Store static identity/education/certifications in `resume-profile.json` |
| Keyword score rewards stuffing | Split bullet coverage from skills-only coverage |
| Long technical terms wrap unexpectedly | Enforce character and estimated-line budgets, not just word budgets |
| Braindump grows too large | Keep consolidated braindump concise; later add evidence-card chunking/retrieval |
| DOCX renders differently in Word vs Google Docs | Test template against both; use conservative formatting |
| API key exposed | Use local Node proxy and `.env`; never ship browser-embedded keys |

---

## 14. MVP Acceptance Criteria

- [ ] Paste JD -> click Generate -> receive valid JSON in under 15 seconds
- [ ] Generated work bullets map to braindump evidence refs
- [ ] Uploaded braindump is converted into structured evidence cards with stable IDs
- [ ] Static contact, education, certifications, employers, titles, and dates come from `resume-profile.json`
- [ ] Project section can swap between at least AEP and MonoGame based on JD
- [ ] Role mode changes bullet/project/skill prioritization without changing static metadata
- [ ] Unsupported JD terms are surfaced and not included as claims
- [ ] Generated DOCX opens in Word without corruption
- [ ] Generated DOCX fits one page in Word
- [ ] Generated DOCX uses ATS-safe layout: no tables, text boxes, columns, graphics, or critical header/footer content
- [ ] Keyword/evidence panel separates bullet-covered, skills-only, source-supported-but-omitted, and unsupported terms
- [ ] Full workflow from JD paste to DOCX download completes in under 60 seconds
- [ ] Braindump persists across page refreshes via localStorage
