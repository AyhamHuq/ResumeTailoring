# Bullet-First Resume Tailoring Handoff

## Goal

Continue iterating until the resume generator reliably solves the original problem:

- Do not force JD keywords into the Skills section.
- Rewrite/select evidence-backed bullets so reasonable JD keywords appear naturally in work experience or projects.
- Keep Skills compact and recruiter-normal: languages, frameworks, cloud services, and concrete tools.
- Preserve evidence grounding and reject unsupported claims.
- Do not use a deterministic fallback in LLM mode. If the LLM cannot satisfy validation, the app should fail loudly with actionable repair issues.

The motivating JD includes software components, algorithms, design patterns, debugging, logging/testing/metrics/monitors/alerts, service/data architecture, DevOps/IaC/deployment pipelines/public cloud, Agile, AWS, ES6+ JavaScript/React, responsive UI, REST APIs, automated testing frameworks, Jenkins/TeamCity, and Docker.

## Current State

Recent work added:

- Bullet-first keyword taxonomy for CI/CD, deployment pipelines, source control, cloud monitoring, metrics, data analytics, public cloud, Docker/containerized systems, algorithms, design patterns, user interfaces, Agile, and automated testing.
- Validation issue `keyword_prefer_bullet_not_covered` when bullet-worthy supported terms are only in Skills or only in evidence.
- JD-aware Skills curation so concrete matched skills survive trimming while low-signal concepts are blocked.
- Skills blocked as standalone labels include `CI/CD`, `OOP`, `SOLID`, `Agile`, `Scrum`, `design patterns`, `idempotency`, `event-driven architecture`, `document vector store`, `MonoGame`, `NLP`, and `boto3` except for explicitly role-triggered conditional skills.
- Education now includes coursework: `Data Structures and Algorithms`, `Software Engineering`, `Object-Oriented Programming`.
- Prompt and repair prompts now include bullet-first rules and project candidates.
- LLM mode no longer has a deterministic fallback. Mock mode still exists only for local no-key testing.

Verification after removing fallback:

- `npm run typecheck` should pass.
- `npm test` should pass.
- `npm run build` should pass.

## Key Files

- `src/shared/keywordTaxonomy.ts`: placement rules and canonical keyword aliases.
- `src/shared/keywords.ts`: JD keyword extraction, synonym expansion, coverage scoring.
- `src/shared/validation.ts`: bullet-first enforcement and resume budget validation.
- `src/shared/skills.ts`: Skills curation and JD-aware prioritization.
- `src/server/prompt.ts`: LLM and repair instructions.
- `src/server/index.ts`: generation route, repair loop, validation response.
- `src/shared/evidenceParser.ts`: evidence cards and supported facts from the braindump.
- `data/config/resume-profile.json`: static profile and coursework.
- `tests/bullet-first-regression.test.ts`: regression for the motivating JD pattern.

## Known Problem

A live `gpt-5.4-mini` run still failed after two repairs. It tended to:

- Cover `CI/CD`, `Playwright`, `Docker`, and deployment terms only in Skills.
- Omit project coverage even when `mario_monogame` was the best source for OOP/design patterns.
- Leave bullet-worthy terms such as `Agile`, `automated testing`, `algorithms`, and deployment pipelines out of bullets.

This means the next iteration should not add fallback behavior. It should make the LLM path itself more reliable through stronger interfaces, constraints, and targeted repair.

## Required Next Iteration

1. Replace freeform JSON prompt output with a stricter section-planning contract:
   - Add an intermediate `coverage_plan` or require it in the output.
   - For every `prefer_bullet` target, require `target_term`, `selected_evidence_refs`, `section`, and `bullet_index`.
   - Validation should reject missing or unused coverage-plan targets.

2. Make the prompt force project selection when project evidence is required:
   - If OOP/design patterns/data structures/algorithms are in the JD and `mario_monogame` evidence exists, require `mario_monogame` unless a stronger project is explicitly justified.
   - If React/UI/cloud/analytics dominate, allow `coffee_dashboard`.
   - If AI/ML dominates, allow `aep_ai_safety`.

3. Improve repair specificity:
   - For each `keyword_prefer_bullet_not_covered`, include the exact canonical term, candidate evidence refs, candidate section, and a suggested bullet rewrite slot.
   - Tell repair to modify existing bullets rather than regenerate the whole resume when possible.
   - If project coverage is missing, tell repair exactly which project ID and evidence refs to add.

4. Add a no-skills-credit rule for bullet-worthy terms:
   - In validation, `prefer_bullet` terms should ignore resume-skill matches entirely when deciding whether they are satisfied.
   - Skills can still show concrete tools, but Skills should never satisfy a bullet-first target.

5. Add tests for the live failure shape:
   - LLM-like output with `CI/CD`, `Docker`, `Playwright`, and `Jenkins` only in Skills must fail.
   - LLM-like output with no Projects when `mario_monogame` is required must fail.
   - Repaired output with the terms in bullets and `mario_monogame` selected must pass.

## Acceptance Criteria

For the motivating JD, a passing resume should:

- Keep Skills clean and concrete, for example: `JavaScript`, `React`, `Java`, `REST APIs`, `Docker`, `Jenkins`, `Playwright`, `AWS`, `Spring Boot`, `CloudWatch Logs`, `GitHub Actions`, `TypeScript`, `Python`, `Git`, `AWS Lambda`, `SQS`, `DynamoDB`, `CloudFormation`, `Ansible`.
- Exclude from Skills: `CI/CD`, `OOP`, `SOLID`, `Agile`, `Scrum`, `design patterns`, `idempotency`, `event-driven architecture`, `document vector store`, `MonoGame`.
- Cover these in bullets when supported:
  - `CI/CD` / deployment pipelines through Jenkins, GitHub Actions, Vercel, production deployment, or code-freeze release work.
  - `automated testing` through Playwright, Jest, pytest, JUnit, or API testing bullets.
  - `Agile` through Publicis/CapTech project delivery evidence, without claiming Scrum unless exact Scrum evidence is added.
  - `Object-Oriented`, `algorithms`, `design patterns`, and `data structures` through coursework and/or `mario_monogame` project bullets.
  - `monitoring`, `logging`, `alerts`, `metrics`, and `data analytics` through CloudWatch, SNS centralization, Athena/Glue, Bedrock evaluation metrics, or dashboard evidence.
  - `responsive user interfaces` through React/TypeScript/React Native bullets.
- Mark genuinely unsupported terms as unsupported rather than claiming them. Current unsupported terms include root-cause debugging, production issue troubleshooting, coding standards, and code reviews unless new evidence is added to the braindump.

## Suggested Commands

Use Node/npm from `C:\Program Files\nodejs` if the shell does not inherit PATH.

```powershell
$env:Path='C:\Program Files\nodejs;C:\Program Files\GitHub CLI;C:\Program Files\Git\cmd;' + $env:Path
npm run typecheck
npm test
npm run build
```

To reproduce the live LLM issue, use the motivating JD from this chat and call `POST /api/generate-resume` or run a small `tsx` script through `callOpenAiCompatibleJson`. Keep LLM calls sparse; use deterministic tests for most iteration.

## Important Constraint

Do not reintroduce deterministic fallback in LLM mode. The robust solution should be:

- Stronger prompt contract.
- Stronger output schema.
- Stronger validation.
- More actionable repair prompts.
- Better source evidence where truthful.

If the LLM still fails, return validation errors with enough detail for the next repair or manual review instead of substituting a generated fallback resume.
