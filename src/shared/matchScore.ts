// ---------------------------------------------------------------------------
// Master Resume Text
// ---------------------------------------------------------------------------

// Extracted from "Ayham Huq - Master Resume.docx" — the untailored default
// resume used as the baseline for before/after scoring. This is a static
// snapshot; update it when the master resume DOCX changes.

const MASTER_RESUME_BULLETS = [
  "Consulted for a client team from a Fortune 100 financial company to migrate a direct messaging service to AWS and maestro using various Spring APIs, Kinesis, DynamoDB, Lambda, and SQS",
  "Operated across 3 teams to seamlessly incorporate changes and coordinate Jenkins production deployments during a period of elevated risk",
  "Improved precision and recall by over 30% compared to model baselines for an AWS Bedrock AI analysis tool through reranking and model-based evaluation for a national sports league",
  "Developed a Golang recommendation algorithm for an itinerary generator for a national golf league",
  "Architected a serverless pattern – Docker running for local development – alongside Github Actions CI/CD to deploy to a static S3 bucket with a REST API Gateway Lambda architecture for scalability",
  "Collaborated on an Agile-focused client project for a Fortune 25 company to enhance user experiences on a healthcare app by using personalized predictive healthcare analytics",
  "Trained an AI model and chat bot using an OpenAI embeddings model with LangChain",
  "Hosted React Native app on an emulator with a Python Flask and Azure SQL database backend",
  "Adhered to SOLID principles, leveraged CI/CD using Vercel, and executed Jest unit testing to ensure code quality meets industry standards",
  "Employed scaled Agile framework with Azure DevOps and Git to complete projects across 7 sprints",
  "Innovated a system to redirect thousands of daily config SNS messages across to CloudWatch Logs and S3 using Lambda functions written in Python AWS SDK to reduce email clutter for users",
  "Wrote an Ansible script and a Cloud Formation template in YAML to automate code deployment in production as well as deploy resources such as Athena SQL queries with Glue and S3",
  "Won 2nd place in AEP challenge in 24-hour hackathon against 17 teams and over 800 participants",
  "Trained a machine learning safety classification model using PyTorch and FAISS, ensuring precision with preprocessing including lemmatization and removal of stopwords on 20,000 elements",
  "Integrated a cross-platform application to enable real-time feedback on safety reports in the field",
];

const MASTER_RESUME_SKILLS = [
  "Golang", "Python", "Java", "JavaScript", "TypeScript", "C#", "C/C++",
  "SQS", "Kinesis", "DynamoDB", "Lambda", "S3", "SNS", "IAM", "CloudFormation", "CDK",
  "Spring", "React", "React Native", "LangChain", "Flask", "Jest", "Docker", "REST", "Agile",
];

/** Build a minimal resume-shaped object from the master resume so
 *  classifyKeywords can score it like any generated resume. */
export function buildMasterResumeForScoring() {
  return {
    skills: MASTER_RESUME_SKILLS,
    work_experience: [
      { job_id: "master", bullets: MASTER_RESUME_BULLETS.map((text) => ({ text, evidence_refs: [] })) },
    ],
    projects: [] as Array<{ bullets: Array<{ text: string }> }>,
  };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// Use structural types so this module works with both the strict Zod-inferred
// schemas (server) and the looser client-side interfaces.

type KeywordReportItem = {
  status: string;
  placement_recommendation: string;
};

type KeywordReport = {
  covered_in_bullets: string[];
  covered_in_skills_only: string[];
  supported_but_omitted_for_space: string[];
  unsupported: string[];
  details?: KeywordReportItem[];
};

type ProfileInput = {
  education: Array<{ degree: string; [key: string]: unknown }>;
  certifications: string[];
  employers: Array<{ dates: string; [key: string]: unknown }>;
};

export type YoeRequirement = {
  min: number;
  max: number | null;
  raw: string;
};

export type MatchScoreDimension = {
  label: string;
  score: number;   // 0–100
  weight: number;  // 0–1
  weighted: number; // score * weight
  details?: string;
};

export type MatchScoreResult = {
  overall: number; // 0–100 weighted sum
  dimensions: MatchScoreDimension[];
  yoeRequirement: YoeRequirement | null;
  candidateYoe: number;
  keywordCount: number;
  coveredCount: number;
};

export type MatchScoreComparison = {
  before: MatchScoreResult;
  after: MatchScoreResult;
  delta: number;
};

// ---------------------------------------------------------------------------
// YOE Parsing
// ---------------------------------------------------------------------------

const YOE_PATTERNS: { pattern: RegExp; extract: (m: RegExpMatchArray) => YoeRequirement }[] = [
  {
    // "3-5 years of experience"
    pattern: /(\d+)\s*[-–]\s*(\d+)\s*(?:years?|yrs?)(?:\s+of)?\s+(?:professional\s+)?(?:relevant\s+)?experience/i,
    extract: (m) => ({ min: Number(m[1]), max: Number(m[2]), raw: m[0] }),
  },
  {
    // "3+ years of experience" / "3 years of experience"
    pattern: /(\d+)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:professional\s+)?(?:relevant\s+)?experience/i,
    extract: (m) => ({ min: Number(m[1]), max: null, raw: m[0] }),
  },
  {
    // "minimum 3 years" / "at least 3 years"
    pattern: /(?:minimum|at\s+least)\s+(\d+)\s*(?:years?|yrs?)/i,
    extract: (m) => ({ min: Number(m[1]), max: null, raw: m[0] }),
  },
  {
    // "3+ years of software development/engineering"
    pattern: /(\d+)\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:software|engineering|development|programming|coding|IT|technical)/i,
    extract: (m) => ({ min: Number(m[1]), max: null, raw: m[0] }),
  },
  {
    // "experience: 3+ years"
    pattern: /experience\s*:\s*(\d+)\+?\s*(?:years?|yrs?)/i,
    extract: (m) => ({ min: Number(m[1]), max: null, raw: m[0] }),
  },
];

export function parseRequiredYoe(jobDescription: string): YoeRequirement | null {
  for (const { pattern, extract } of YOE_PATTERNS) {
    const match = jobDescription.match(pattern);
    if (match) return extract(match);
  }
  return null;
}

// ---------------------------------------------------------------------------
// Candidate YOE Calculation
// ---------------------------------------------------------------------------

const DATE_PATTERN = /(\d{2})\/(\d{4})\s*[-–]\s*(?:(\d{2})\/(\d{4})|(Present))/i;

function parseDateRange(dates: string): { startMs: number; endMs: number } | null {
  const match = dates.match(DATE_PATTERN);
  if (!match) return null;

  const startMonth = Number(match[1]) - 1; // 0-indexed
  const startYear = Number(match[2]);
  const startMs = new Date(startYear, startMonth, 1).getTime();

  let endMs: number;
  if (match[5]?.toLowerCase() === "present") {
    endMs = Date.now();
  } else {
    const endMonth = Number(match[3]) - 1;
    const endYear = Number(match[4]);
    endMs = new Date(endYear, endMonth, 1).getTime();
  }

  return { startMs, endMs };
}

export function calculateCandidateYoe(employers: { dates: string }[]): number {
  let totalMonths = 0;
  for (const employer of employers) {
    const range = parseDateRange(employer.dates);
    if (!range) continue;
    const months = (range.endMs - range.startMs) / (1000 * 60 * 60 * 24 * 30.44);
    totalMonths += Math.max(0, months);
  }
  return Math.round((totalMonths / 12) * 10) / 10; // 1 decimal
}

// ---------------------------------------------------------------------------
// Dimension Scorers
// ---------------------------------------------------------------------------

const COVERAGE_VALUE: Record<string, number> = {
  covered_in_bullets: 1.0,
  covered_in_skills_only: 0.7,
  alternative_satisfied: 0.6,
  supported_but_omitted_for_space: 0.4,
  unsupported: 0.0,
};

export function scoreKeywordCoverage(report: KeywordReport): number {
  const items = report.details ?? [];
  if (items.length === 0) return 0;
  const sum = items.reduce((acc, item) => acc + (COVERAGE_VALUE[item.status] ?? 0), 0);
  return Math.round((sum / items.length) * 100);
}

const PLACEMENT_VALUE: Record<string, number> = {
  covered_in_bullets: 1.0,
  covered_in_skills_only: 0.3,
  alternative_satisfied: 0.1,
  supported_but_omitted_for_space: 0.1,
  unsupported: 0.0,
};

export function scoreKeywordPlacement(report: KeywordReport): number {
  const preferBullet = (report.details ?? []).filter(
    (item) => item.placement_recommendation === "prefer_bullet"
  );
  if (preferBullet.length === 0) return 100;
  const sum = preferBullet.reduce((acc, item) => acc + (PLACEMENT_VALUE[item.status] ?? 0), 0);
  return Math.round((sum / preferBullet.length) * 100);
}

export function scoreYoeMatch(
  requirement: YoeRequirement | null,
  candidateYoe: number
): { score: number; details: string } {
  if (!requirement) {
    return { score: 80, details: "No YOE requirement found" };
  }

  const { min } = requirement;
  if (candidateYoe >= min) {
    return { score: 100, details: `${candidateYoe.toFixed(1)} yrs meets ${min}+ yr requirement` };
  }
  if (candidateYoe >= min - 1) {
    return { score: 75, details: `${candidateYoe.toFixed(1)} yrs is close to ${min}+ yr requirement` };
  }
  if (candidateYoe >= min - 2) {
    return { score: 40, details: `${candidateYoe.toFixed(1)} yrs is below ${min}+ yr requirement` };
  }
  return { score: 10, details: `${candidateYoe.toFixed(1)} yrs is well below ${min}+ yr requirement` };
}

export function scoreCredentials(
  jobDescription: string,
  profile: Pick<ProfileInput, "education" | "certifications">
): { score: number; details: string } {
  const jdLower = jobDescription.toLowerCase();

  // Check if JD mentions any education or certification requirements
  const mentionsDegree = /bachelor|master|b\.?s\.?|m\.?s\.?|degree/i.test(jobDescription);
  const mentionsCerts = /certif/i.test(jobDescription);

  if (!mentionsDegree && !mentionsCerts) {
    return { score: 80, details: "No credential requirements found" };
  }

  let earned = 0;
  let possible = 0;

  if (mentionsDegree) {
    possible += 40; // degree exists
    possible += 30; // field match

    const hasDegree = profile.education.length > 0;
    if (hasDegree) earned += 40;

    // Check field match
    const fieldPatterns = [
      { pattern: /computer\s*science/i, fields: ["computer science"] },
      { pattern: /software\s*engineering/i, fields: ["software engineering", "computer science"] },
      { pattern: /information\s*(?:technology|systems)/i, fields: ["information technology", "information systems", "computer science"] },
      { pattern: /engineering/i, fields: ["engineering", "computer science"] },
    ];

    for (const { pattern, fields } of fieldPatterns) {
      if (pattern.test(jobDescription)) {
        const degreeLower = profile.education.map((e) => e.degree.toLowerCase());
        if (degreeLower.some((d) => fields.some((f) => d.includes(f)))) {
          earned += 30;
        }
        break;
      }
    }
  }

  if (mentionsCerts) {
    possible += 30;

    // Check specific cert matches
    const certPatterns = [
      { pattern: /aws\s*certif/i, certs: ["aws certified"] },
      { pattern: /azure\s*certif/i, certs: ["azure certified", "microsoft certified"] },
      { pattern: /gcp\s*certif/i, certs: ["google cloud", "gcp"] },
    ];

    let certMatched = false;
    for (const { pattern, certs } of certPatterns) {
      if (pattern.test(jobDescription)) {
        const profileCerts = profile.certifications.map((c) => c.toLowerCase());
        if (profileCerts.some((pc) => certs.some((c) => pc.includes(c)))) {
          earned += 30;
          certMatched = true;
        }
        break;
      }
    }

    // Generic cert mention without specific match — give partial credit if candidate has any certs
    if (!certMatched && profile.certifications.length > 0) {
      earned += 15;
    }
  }

  const score = possible > 0 ? Math.round((earned / possible) * 100) : 80;
  const parts: string[] = [];
  if (mentionsDegree) parts.push(earned >= 40 ? "Degree match" : "Degree gap");
  if (mentionsCerts) parts.push(earned >= (mentionsDegree ? 70 : 30) ? "Cert match" : "Cert gap");
  return { score, details: parts.join(", ") || "Partial match" };
}

// ---------------------------------------------------------------------------
// Combined Score
// ---------------------------------------------------------------------------

type MatchScoreInput = {
  jobDescription: string;
  profile: ProfileInput;
  keywordReport: KeywordReport;
};

export function calculateMatchScore(input: MatchScoreInput): MatchScoreResult {
  const { jobDescription, profile, keywordReport } = input;

  const yoeRequirement = parseRequiredYoe(jobDescription);
  const candidateYoe = calculateCandidateYoe(profile.employers);

  const keywordCoverageScore = scoreKeywordCoverage(keywordReport);
  const keywordPlacementScore = scoreKeywordPlacement(keywordReport);
  const yoeResult = scoreYoeMatch(yoeRequirement, candidateYoe);
  const credResult = scoreCredentials(jobDescription, profile);

  const dimensions: MatchScoreDimension[] = [
    { label: "Keywords", score: keywordCoverageScore, weight: 0.55, weighted: keywordCoverageScore * 0.55 },
    { label: "Placement", score: keywordPlacementScore, weight: 0.15, weighted: keywordPlacementScore * 0.15 },
    { label: "Experience", score: yoeResult.score, weight: 0.15, weighted: yoeResult.score * 0.15, details: yoeResult.details },
    { label: "Credentials", score: credResult.score, weight: 0.15, weighted: credResult.score * 0.15, details: credResult.details },
  ];

  const overall = Math.round(dimensions.reduce((sum, d) => sum + d.weighted, 0));

  const details = keywordReport.details ?? [];
  const coveredCount = details.filter(
    (item) => item.status !== "unsupported"
  ).length;

  return {
    overall,
    dimensions,
    yoeRequirement,
    candidateYoe,
    keywordCount: details.length,
    coveredCount,
  };
}

// ---------------------------------------------------------------------------
// Before/After Comparison
// ---------------------------------------------------------------------------

type MatchScoreComparisonInput = {
  jobDescription: string;
  profile: ProfileInput;
  masterKeywordReport: KeywordReport;
  tailoredKeywordReport: KeywordReport | null;
};

export function calculateMatchScoreComparison(input: MatchScoreComparisonInput): MatchScoreComparison {
  const { jobDescription, profile, masterKeywordReport, tailoredKeywordReport } = input;

  const before = calculateMatchScore({ jobDescription, profile, keywordReport: masterKeywordReport });
  const after = calculateMatchScore({
    jobDescription,
    profile,
    keywordReport: tailoredKeywordReport ?? masterKeywordReport,
  });

  return {
    before,
    after,
    delta: after.overall - before.overall,
  };
}
