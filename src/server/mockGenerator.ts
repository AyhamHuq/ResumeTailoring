import {
  buildKeywordCoveragePlan,
  expandGroundedSynonyms,
  withBulletCounts,
  type CoveragePlanEntry,
  type EvidenceCard,
  type GeneratedResume,
  type ProjectId,
  type ResumeProfile,
  type RoleMode
} from "../shared";

function findEvidence(cards: EvidenceCard[], preferredIds: string[], fallbackJob?: string, fallbackProject?: string): EvidenceCard {
  return preferredIds
    .map((id) => cards.find((card) => card.id === id))
    .find((card): card is EvidenceCard => Boolean(card))
    ?? cards.find((card) => card.parent_job_id === fallbackJob)
    ?? cards.find((card) => card.project_id === fallbackProject)
    ?? cards[0];
}

function projectDisplayName(profile: ResumeProfile, projectId: ProjectId): string {
  return profile.allowed_projects.find((project) => project.project_id === projectId)?.display_name ?? projectId;
}

function includesTerm(text: string, term: string): boolean {
  const escaped = term.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9+#])${escaped}([^a-z0-9+#]|$)`, "i").test(text);
}

function buildMockCoveragePlan(
  jobDescription: string,
  evidenceCards: EvidenceCard[],
  resume: GeneratedResume
): CoveragePlanEntry[] {
  if (!jobDescription.trim()) {
    return [];
  }

  const plan = buildKeywordCoveragePlan(jobDescription, evidenceCards);
  const entries: CoveragePlanEntry[] = [];

  for (const target of plan.prefer_bullet) {
    const terms = Array.from(new Set([
      target.term,
      target.canonical,
      ...target.matched_terms,
      ...expandGroundedSynonyms(target.canonical)
    ].filter(Boolean)));

    let added = false;
    for (const job of resume.work_experience) {
      const bulletIndex = job.bullets.findIndex((bullet) => terms.some((term) => includesTerm(bullet.text, term)));
      if (bulletIndex >= 0) {
        const bullet = job.bullets[bulletIndex];
        entries.push({
          target_term: target.term,
          canonical: target.canonical,
          selected_evidence_refs: bullet.evidence_refs,
          section: "work_experience",
          job_id: job.job_id,
          bullet_index: bulletIndex
        });
        added = true;
        break;
      }
    }
    if (added) {
      continue;
    }

    for (const project of resume.projects) {
      const bulletIndex = project.bullets.findIndex((bullet) => terms.some((term) => includesTerm(bullet.text, term)));
      if (bulletIndex >= 0) {
        const bullet = project.bullets[bulletIndex];
        entries.push({
          target_term: target.term,
          canonical: target.canonical,
          selected_evidence_refs: bullet.evidence_refs,
          section: "projects",
          project_id: project.project_id,
          bullet_index: bulletIndex
        });
        break;
      }
    }
  }

  return entries;
}

export function generateMockResume(
  evidenceCards: EvidenceCard[],
  profile: ResumeProfile,
  roleMode: RoleMode,
  jobDescription = ""
): GeneratedResume {
  const captechMessaging = findEvidence(evidenceCards, ["captech_f100_spring_lambda_dynamodb", "captech_f100_idempotency"], "captech");
  const captechIdempotency = findEvidence(evidenceCards, ["captech_f100_idempotency"], "captech");
  const captechDeployment = findEvidence(evidenceCards, ["captech_f100_jenkins_coordination"], "captech");
  const captechBedrock = findEvidence(evidenceCards, ["captech_bedrock_rag_opensearch", "captech_bedrock_precision_recall"], "captech");
  const captechGolf = findEvidence(evidenceCards, ["captech_golf_algorithm_golang", "captech_golf_10000_itineraries"], "captech");
  const captechGolfDelivery = findEvidence(evidenceCards, ["captech_golf_serverless_cicd"], "captech");
  const publicisRag = findEvidence(evidenceCards, ["publicis_langchain_rag"], "publicis_sapient");
  const publicisBackend = findEvidence(evidenceCards, ["publicis_flask_azure_sql_backend"], "publicis_sapient");
  const publicisQuality = findEvidence(evidenceCards, ["publicis_solid_testing_cicd"], "publicis_sapient");
  const publicisClient = findEvidence(evidenceCards, ["publicis_healthcare_predictive_app"], "publicis_sapient");
  const sallieLogs = findEvidence(evidenceCards, ["sallie_mae_config_sns_centralization", "sallie_mae_200_accounts"], "sallie_mae");
  const sallieIam = findEvidence(evidenceCards, ["sallie_mae_cross_account_iam"], "sallie_mae");
  const sallieIac = findEvidence(evidenceCards, ["sallie_mae_ansible_cloudformation"], "sallie_mae");
  const jd = jobDescription.toLowerCase();
  const wantsObjectOrientedProject = /object[-\s]?oriented|\boop\b|design patterns?|data structures?|algorithm/.test(jd);
  const selectedProject: ProjectId = wantsObjectOrientedProject || roleMode === "backend"
    ? "mario_monogame"
    : roleMode === "cloud" || roleMode === "full_stack" || roleMode === "consulting"
      ? "coffee_dashboard"
      : "aep_ai_safety";
  const projectEvidence = selectedProject === "mario_monogame"
    ? [
      findEvidence(evidenceCards, ["mario_collision_state_command_factory"], undefined, selectedProject),
      findEvidence(evidenceCards, ["mario_physics_enemy_save_systems"], undefined, selectedProject),
      findEvidence(evidenceCards, ["mario_collision_state_command_factory"], undefined, selectedProject)
    ]
    : selectedProject === "coffee_dashboard"
      ? [
        findEvidence(evidenceCards, ["captech_coffee_dashboard_accessibility"], undefined, selectedProject),
        findEvidence(evidenceCards, ["captech_coffee_dashboard_kpis", "captech_coffee_dashboard_accessibility"], undefined, selectedProject),
        findEvidence(evidenceCards, ["captech_coffee_dashboard_accessibility"], undefined, selectedProject)
      ]
      : [
        findEvidence(evidenceCards, ["aep_pytorch_faiss_20000_records"], undefined, selectedProject),
        findEvidence(evidenceCards, ["aep_react_native_flask_sqlite", "aep_hackathon_second_place"], undefined, selectedProject),
        findEvidence(evidenceCards, ["aep_hackathon_second_place", "aep_pytorch_faiss_20000_records"], undefined, selectedProject)
      ];

  const resume: GeneratedResume = {
    role_mode: roleMode,
    coverage_plan: [],
    skills: [
      "Java", "Python", "Golang", "TypeScript", "JavaScript", "C#", "SQL", "Spring Boot", "Flask",
      "React", "React Native", "REST APIs", "AWS Lambda", "API Gateway", "SQS", "SNS",
      "DynamoDB", "S3", "CloudWatch Logs", "IAM", "CloudFormation", "CDK", "Ansible",
      "Docker", "Git", "Jenkins", "GitHub Actions", "LangChain", "RAG", "OpenSearch", "FAISS",
      "PyTorch", "Jest", "pytest"
    ],
    work_experience: [
      {
        job_id: "captech",
        bullets: [
          withBulletCounts({ text: "Extended Spring APIs, Lambda enrichment, DynamoDB metadata, and SQS FIFO queues to migrate real-time customer messaging into Maestro.", evidence_refs: [captechMessaging.id], jd_keywords: ["Spring", "AWS", "messaging"] }),
          withBulletCounts({ text: "Implemented idempotent retry and reprocessing behavior so SQS-backed messages could recover cleanly without duplicate customer notifications.", evidence_refs: [captechIdempotency.id], jd_keywords: ["SQS", "idempotency", "reliability"] }),
          withBulletCounts({ text: "Led cross-team Jenkins release coordination across Maestro, ingestion, and product teams during a high-risk production code freeze.", evidence_refs: [captechDeployment.id], jd_keywords: ["Jenkins", "production deployment"] }),
          withBulletCounts({ text: "Improved Bedrock RAG precision and recall metrics by over 30% using OpenSearch retrieval, reranking, and evaluator-model scoring.", evidence_refs: [captechBedrock.id], jd_keywords: ["Bedrock", "RAG", "OpenSearch", "metrics"] }),
          withBulletCounts({ text: "Built a Golang regret-insertion itinerary algorithm plus a React/TypeScript iframe with GitHub Actions, Docker, and Playwright tests.", evidence_refs: [captechGolf.id, captechGolfDelivery.id], jd_keywords: ["Golang", "React", "algorithms", "CI/CD", "automated testing"] })
        ]
      },
      {
        job_id: "publicis_sapient",
        bullets: [
          withBulletCounts({ text: "Built a personalized LangChain RAG chatbot using OpenAI embeddings and user healthcare data to answer plan and cost questions.", evidence_refs: [publicisRag.id], jd_keywords: ["LangChain", "RAG"] }),
          withBulletCounts({ text: "Owned most Flask REST backend work, including Azure SQL schema integration for a React Native healthcare recommendation app.", evidence_refs: [publicisBackend.id], jd_keywords: ["Flask", "REST", "SQL"] }),
          withBulletCounts({ text: "Applied SOLID design, Jest and pytest coverage, Vercel CI/CD, and client presentation practices across an Agile intern team.", evidence_refs: [publicisQuality.id], jd_keywords: ["SOLID", "testing", "CI/CD"] }),
          withBulletCounts({ text: "Partnered on an 8-person Fortune 25 healthcare engagement, translating predictive savings requirements into a working consumer app.", evidence_refs: [publicisClient.id], jd_keywords: ["Agile", "client delivery"] })
        ]
      },
      {
        job_id: "sallie_mae",
        bullets: [
          withBulletCounts({ text: "Centralized AWS Config SNS alerts from nearly 200 accounts into S3 and CloudWatch Logs for cloud monitoring and operations visibility.", evidence_refs: [sallieLogs.id], jd_keywords: ["AWS", "CloudWatch", "logging", "alerts", "monitoring"] }),
          withBulletCounts({ text: "Implemented cross-account IAM trust and least-privilege permissions so spoke-account Lambdas could write to centralized logging resources.", evidence_refs: [sallieIam.id], jd_keywords: ["IAM", "security"] }),
          withBulletCounts({ text: "Automated production infrastructure with Ansible and CloudFormation for Lambda, S3, Athena, and Glue data analytics deployments.", evidence_refs: [sallieIac.id], jd_keywords: ["Ansible", "CloudFormation", "IaC", "data analytics"] })
        ]
      }
    ],
    projects: [
      {
        project_id: selectedProject,
        display_name: projectDisplayName(profile, selectedProject),
        bullets: [
          withBulletCounts({
            text: selectedProject === "mario_monogame"
              ? "Implemented MonoGame collision detection with bounding boxes plus state machine, command pattern, and factory pattern design for organized C# gameplay behavior."
              : selectedProject === "coffee_dashboard"
                ? "Built a React coffee-shop KPI dashboard with Python Lambda APIs, CDK infrastructure, SQLite data, and WCAG 2.2 accessibility."
                : "Trained a PyTorch safety classifier on 20,000 incident records with FAISS retrieval and NLP preprocessing for severity classification.",
            evidence_refs: [projectEvidence[0].id],
            jd_keywords: selectedProject === "mario_monogame" ? ["C#", "OOP"] : selectedProject === "coffee_dashboard" ? ["React", "AWS", "accessibility"] : ["PyTorch", "FAISS"]
          }),
          withBulletCounts({
            text: selectedProject === "mario_monogame"
              ? "Owned player physics, enemy behavior, save-system, and game-state work for a four-person MonoGame project recreating Mario levels."
              : selectedProject === "coffee_dashboard"
                ? "Delivered operational views for revenue, inventory, low-stock alerts, and linear-regression forecasting through an Agile bootcamp project."
                : "Built the React Native, Flask, and SQLite application workflow that helped the team place 2nd in a 24-hour AEP challenge.",
            evidence_refs: [projectEvidence[1].id],
            jd_keywords: selectedProject === "mario_monogame" ? ["C#", "game systems"] : selectedProject === "coffee_dashboard" ? ["analytics", "forecasting"] : ["React Native", "Flask"]
          }),
          withBulletCounts({
            text: selectedProject === "mario_monogame"
              ? "Structured object creation and gameplay transitions with reusable OOP design patterns while delivering a finished team demo."
              : selectedProject === "coffee_dashboard"
                ? "Provisioned the dashboard with Python CDK, Lambda, API Gateway, and S3 to mirror a serverless production pattern."
                : "Measured F1, precision, and accuracy while presenting a practical non-LLM safety classification approach to judges.",
            evidence_refs: [projectEvidence[2].id],
            jd_keywords: selectedProject === "mario_monogame" ? ["OOP", "design patterns"] : selectedProject === "coffee_dashboard" ? ["CDK", "serverless"] : ["F1", "precision"]
          })
        ],
        alternates: profile.allowed_projects.map((project) => project.project_id).filter((id) => id !== selectedProject)
      }
    ],
    unsupported_terms: []
  };

  return {
    ...resume,
    coverage_plan: buildMockCoveragePlan(jobDescription, evidenceCards, resume)
  };
}
