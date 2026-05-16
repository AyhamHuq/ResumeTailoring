import { withBulletCounts, type EvidenceCard, type GeneratedResume, type ProjectId, type ResumeProfile, type RoleMode } from "../shared";

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

export function generateMockResume(evidenceCards: EvidenceCard[], profile: ResumeProfile, roleMode: RoleMode): GeneratedResume {
  const captech1 = findEvidence(evidenceCards, ["captech_f100_idempotency"], "captech");
  const captech2 = findEvidence(evidenceCards, ["captech_bedrock_precision_recall"], "captech");
  const captech3 = findEvidence(evidenceCards, ["captech_golf_10000_itineraries"], "captech");
  const publicis = findEvidence(evidenceCards, ["publicis_langchain_rag"], "publicis_sapient");
  const sallie = findEvidence(evidenceCards, ["sallie_mae_200_accounts"], "sallie_mae");
  const selectedProject: ProjectId = roleMode === "backend" ? "mario_monogame" : "aep_ai_safety";
  const projectEvidence = findEvidence(evidenceCards, [selectedProject === "mario_monogame" ? "mario_collision_state_command_factory" : "aep_pytorch_faiss_20000_records"], undefined, selectedProject);

  return {
    role_mode: roleMode,
    skills: ["Java", "Python", "TypeScript", "AWS Lambda", "SQS", "DynamoDB", "React", "LangChain", "RAG", "FAISS", "PyTorch", "CloudFormation/CDK", "Docker", "REST"],
    work_experience: [
      {
        job_id: "captech",
        bullets: [
          withBulletCounts({ text: "Built idempotent AWS messaging workflows with SQS-backed retry behavior for reliable client processing.", evidence_refs: [captech1.id], jd_keywords: ["AWS", "SQS", "idempotency"] }),
          withBulletCounts({ text: "Evaluated Bedrock AI outputs with precision and recall checks to improve grounded delivery decisions.", evidence_refs: [captech2.id], jd_keywords: ["AI", "Bedrock"] }),
          withBulletCounts({ text: "Automated golf itinerary data workflows at 10,000-record scale for a national sports client.", evidence_refs: [captech3.id], jd_keywords: ["automation", "data"] })
        ]
      },
      {
        job_id: "publicis_sapient",
        bullets: [
          withBulletCounts({ text: "Developed LangChain RAG capabilities that connected retrieval workflows to source-backed answers.", evidence_refs: [publicis.id], jd_keywords: ["LangChain", "RAG"] }),
          withBulletCounts({ text: "Applied backend and AI prototyping practices in a client-facing engineering internship.", evidence_refs: [publicis.id], jd_keywords: ["backend", "AI"] })
        ]
      },
      {
        job_id: "sallie_mae",
        bullets: [
          withBulletCounts({ text: "Supported AWS cloud engineering work across nearly 200 accounts with account-aware delivery practices.", evidence_refs: [sallie.id], jd_keywords: ["AWS", "cloud"] }),
          withBulletCounts({ text: "Contributed to cloud infrastructure operations using governed access and repeatable engineering workflows.", evidence_refs: [sallie.id], jd_keywords: ["cloud infrastructure"] })
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
              ? "Implemented MonoGame collision logic with state, command, and factory patterns in C#."
              : "Built a PyTorch safety classifier using FAISS retrieval over 20,000 incident records.",
            evidence_refs: [projectEvidence.id],
            jd_keywords: selectedProject === "mario_monogame" ? ["C#", "OOP"] : ["PyTorch", "FAISS"]
          })
        ],
        alternates: profile.allowed_projects.map((project) => project.project_id).filter((id) => id !== selectedProject)
      }
    ],
    unsupported_terms: []
  };
}
