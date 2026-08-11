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
  const captechConsultantGolf = findEvidence(evidenceCards, ["captech_consultant_golf_engine", "captech_golf_algorithm_golang", "captech_golf_10000_itineraries"], "captech_consultant");
  const captechConsultantProdSupport = findEvidence(evidenceCards, ["captech_consultant_golf_production_support"], "captech_consultant");
  const captechConsultantTheming = findEvidence(evidenceCards, ["captech_consultant_beverage_theming"], "captech_consultant");
  const captechMessaging = findEvidence(evidenceCards, ["captech_f100_spring_lambda_dynamodb", "captech_f100_idempotency"], "captech");
  const captechDeployment = findEvidence(evidenceCards, ["captech_f100_jenkins_coordination"], "captech");
  const captechBedrock = findEvidence(evidenceCards, ["captech_bedrock_rag_opensearch", "captech_bedrock_precision_recall"], "captech");
  const captechServerless = findEvidence(evidenceCards, ["captech_serverless_cicd", "captech_golf_serverless_cicd"], "captech");
  const publicisClient = findEvidence(evidenceCards, ["publicis_healthcare_predictive_app"], "publicis_sapient");
  const publicisBackend = findEvidence(evidenceCards, ["publicis_flask_azure_sql_backend"], "publicis_sapient");
  const sallieLogs = findEvidence(evidenceCards, ["sallie_mae_config_sns_centralization", "sallie_mae_200_accounts"], "sallie_mae");
  const sallieIac = findEvidence(evidenceCards, ["sallie_mae_ansible_cloudformation"], "sallie_mae");
  const jd = jobDescription.toLowerCase();
  const wantsObjectOrientedProject = /object[-\s]?oriented|\boop\b|design patterns?|data structures?|algorithm/.test(jd);
  const wantsMobileProject = /\b(android|kotlin|jetpack compose|mvvm|model[-\s]?view[-\s]?viewmodel|livedata|firebase|plaid|mobile app|mobile application|personal finance|expense tracking|receipt tracking|travel budgeting)\b/.test(jd);
  const selectedProject: ProjectId = wantsMobileProject
    ? "travel_budgeting_app"
    : wantsObjectOrientedProject || roleMode === "backend"
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
      : selectedProject === "travel_budgeting_app"
      ? [
        findEvidence(evidenceCards, ["travel_budgeting_kotlin_mvvm_compose"], undefined, selectedProject),
        findEvidence(evidenceCards, ["travel_budgeting_plaid_firebase_auth"], undefined, selectedProject),
        findEvidence(evidenceCards, ["travel_budgeting_backend_expense_tracking", "travel_budgeting_kotlin_mvvm_compose"], undefined, selectedProject)
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
      "Java", "Kotlin", "Python", "Golang", "TypeScript", "JavaScript", "C#", "Spring Boot", "Flask",
      "React", "React Native", "Android", "Jetpack Compose", "REST APIs", "AWS Lambda", "API Gateway", "SQS",
      "DynamoDB", "S3", "CloudWatch Logs", "IAM", "CloudFormation",
      "Docker", "Git", "Jenkins", "GitHub Actions", "LangChain", "RAG", "FAISS",
      "PyTorch", "Firebase", "Plaid API", "Jest", "pytest"
    ],
    work_experience: [
      {
        job_id: "captech_consultant",
        bullets: [
          withBulletCounts({ text: "Built a Go recommendation engine using a regret-insertion algorithm for the PGA Championship, generating 10,000+ attendee itineraries with 78% accepted.", evidence_refs: [captechConsultantGolf.id], jd_keywords: ["Golang", "algorithms"] }),
          withBulletCounts({ text: "Owned production support for the engine and frontend throughout the live tournament, monitoring and resolving issues in real time.", evidence_refs: [captechConsultantProdSupport.id], jd_keywords: ["production support"] }),
          withBulletCounts({ text: "Retrofitted a theming layer across a React application for a leading beverage company, converting hardcoded styles to design tokens.", evidence_refs: [captechConsultantTheming.id], jd_keywords: ["React", "design tokens"] })
        ]
      },
      {
        job_id: "captech",
        bullets: [
          withBulletCounts({ text: "Consulted for a Fortune 100 financial company to migrate a direct messaging service to AWS and Maestro using Spring APIs, DynamoDB, Lambda, and SQS.", evidence_refs: [captechMessaging.id], jd_keywords: ["Spring", "AWS", "messaging"] }),
          withBulletCounts({ text: "Operated across 3 teams to coordinate Jenkins production deployments during a code freeze on a messaging system serving millions of customers.", evidence_refs: [captechDeployment.id], jd_keywords: ["Jenkins", "production deployment"] }),
          withBulletCounts({ text: "Improved precision and recall by over 30% for an AWS Bedrock AI analysis tool through reranking and model-based evaluation.", evidence_refs: [captechBedrock.id], jd_keywords: ["Bedrock", "RAG", "metrics"] }),
          withBulletCounts({ text: "Architected a serverless pattern with Docker for local development alongside GitHub Actions CI/CD to deploy to S3 with API Gateway Lambda.", evidence_refs: [captechServerless.id], jd_keywords: ["Docker", "CI/CD", "serverless"] })
        ]
      },
      {
        job_id: "publicis_sapient",
        bullets: [
          withBulletCounts({ text: "Collaborated on an Agile client project for a Fortune 25 company to enhance user experiences on a healthcare app with personalized analytics.", evidence_refs: [publicisClient.id], jd_keywords: ["Agile", "client delivery"] }),
          withBulletCounts({ text: "Served as primary backend engineer, building a Python Flask API with an Azure SQL backend and a LangChain RAG chatbot over OpenAI embeddings.", evidence_refs: [publicisBackend.id], jd_keywords: ["Flask", "LangChain", "RAG"] })
        ]
      },
      {
        job_id: "sallie_mae",
        bullets: [
          withBulletCounts({ text: "Innovated a system to redirect thousands of daily config SNS messages across hundreds of AWS accounts to CloudWatch Logs and S3 using Lambda.", evidence_refs: [sallieLogs.id], jd_keywords: ["AWS", "CloudWatch", "Lambda"] }),
          withBulletCounts({ text: "Wrote an Ansible script and CloudFormation template in YAML to automate code deployment and deploy resources such as Athena queries with Glue and S3.", evidence_refs: [sallieIac.id], jd_keywords: ["Ansible", "CloudFormation", "IaC"] })
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
                : selectedProject === "travel_budgeting_app"
                  ? "Built an Android travel-budgeting app with Kotlin, Jetpack Compose, MVVM, and LiveData for trip budgets, expenses, and receipt tracking."
                : "Trained a PyTorch safety classifier on 20,000 incident records with FAISS retrieval and NLP preprocessing for severity classification.",
            evidence_refs: [projectEvidence[0].id],
            jd_keywords: selectedProject === "mario_monogame" ? ["C#", "OOP"] : selectedProject === "coffee_dashboard" ? ["React", "AWS", "accessibility"] : selectedProject === "travel_budgeting_app" ? ["Android", "Kotlin", "MVVM"] : ["PyTorch", "FAISS"]
          }),
          withBulletCounts({
            text: selectedProject === "mario_monogame"
              ? "Owned player physics, enemy behavior, save-system, and game-state work for a four-person MonoGame project recreating Mario levels."
              : selectedProject === "coffee_dashboard"
                ? "Delivered operational views for revenue, inventory, low-stock alerts, and linear-regression forecasting through an Agile bootcamp project."
                : selectedProject === "travel_budgeting_app"
                  ? "Integrated Plaid API and Firebase Authentication for bank-account linking, financial data access, user access, and account-backed budgeting workflows."
                : "Built the React Native, Flask, and SQLite application workflow that helped the team place 2nd in a 24-hour AEP challenge.",
            evidence_refs: [projectEvidence[1].id],
            jd_keywords: selectedProject === "mario_monogame" ? ["C#", "game systems"] : selectedProject === "coffee_dashboard" ? ["analytics", "forecasting"] : selectedProject === "travel_budgeting_app" ? ["Plaid API", "Firebase"] : ["React Native", "Flask"]
          }),
          withBulletCounts({
            text: selectedProject === "mario_monogame"
              ? "Structured object creation and gameplay transitions with reusable OOP design patterns while delivering a finished team demo."
              : selectedProject === "coffee_dashboard"
                ? "Provisioned the dashboard with Python CDK, Lambda, API Gateway, and S3 to mirror a serverless production pattern."
                : selectedProject === "travel_budgeting_app"
                  ? "Owned backend functionality for a personal-finance mobile app, connecting authenticated user data to categorized spending and trip expense features."
                : "Measured F1, precision, and accuracy while presenting a practical non-LLM safety classification approach to judges.",
            evidence_refs: [projectEvidence[2].id],
            jd_keywords: selectedProject === "mario_monogame" ? ["OOP", "design patterns"] : selectedProject === "coffee_dashboard" ? ["CDK", "serverless"] : selectedProject === "travel_budgeting_app" ? ["backend", "expense tracking"] : ["F1", "precision"]
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
