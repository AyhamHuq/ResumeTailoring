import type {
  EvidenceCard,
  GeneratedCoverLetter,
  ResumeProfile,
  RoleMode
} from "../shared";

function pickCards(cards: EvidenceCard[], count: number): EvidenceCard[] {
  const workCards = cards.filter((c) => c.parent_job_id);
  const projectCards = cards.filter((c) => c.project_id && !c.parent_job_id);
  const picked: EvidenceCard[] = [];
  for (const source of [workCards, projectCards, cards]) {
    for (const card of source) {
      if (picked.length >= count) break;
      if (!picked.some((p) => p.id === card.id)) {
        picked.push(card);
      }
    }
  }
  return picked;
}

export function generateMockCoverLetter(
  evidenceCards: EvidenceCard[],
  profile: ResumeProfile,
  roleMode: RoleMode,
  jobDescription: string,
  companyName?: string,
  positionTitle?: string
): GeneratedCoverLetter {
  const selected = pickCards(evidenceCards, 4);
  const card0 = selected[0];
  const card1 = selected[1];
  const card2 = selected[2];
  const card3 = selected[3] ?? card0;

  const company = companyName || "your organization";
  const position = positionTitle || "this role";

  return {
    role_mode: roleMode,
    salutation: "Dear Hiring Manager,",
    opening: {
      text: `I am writing to express my interest in ${position} at ${company}. With experience spanning cloud architecture, full-stack development, and AI-powered tooling, I am confident I can contribute meaningfully to your engineering team from day one.`,
      evidence_refs: [],
      jd_keywords: ["cloud", "full-stack"],
      purpose: "hook"
    },
    body_paragraphs: [
      {
        text: `At CapTech Consulting, I ${card0?.evidence_text.slice(0, 120) ?? "built production-grade services"}, demonstrating hands-on delivery of scalable backend systems. ${card1?.metrics[0] ? `This work resulted in ${card1.metrics[0]}.` : "This work shipped to production and served real users."}`,
        evidence_refs: [card0?.id, card1?.id].filter((id): id is string => Boolean(id)),
        jd_keywords: card0?.skills.slice(0, 2) ?? ["AWS", "Spring Boot"],
        purpose: "technical_depth"
      },
      {
        text: `Beyond individual contributions, I have operated across multiple teams to coordinate deployments and drive cross-functional delivery. ${card2?.evidence_text.slice(0, 100) ?? "I collaborated with stakeholders to ensure smooth releases"}. This experience has sharpened my ability to communicate technical decisions and align engineering work with business outcomes.`,
        evidence_refs: [card2?.id].filter((id): id is string => Boolean(id)),
        jd_keywords: ["deployment", "collaboration"],
        purpose: "leadership_impact"
      }
    ],
    closing: {
      text: `I would welcome the opportunity to discuss how my experience aligns with ${company}'s goals. Thank you for your time and consideration.`,
      evidence_refs: [],
      jd_keywords: [],
      purpose: "closing"
    },
    sign_off: "Sincerely,",
    complementary_keywords: [
      ...(card0?.skills.slice(0, 2) ?? []),
      ...(card2?.skills.slice(0, 1) ?? [])
    ]
  };
}
