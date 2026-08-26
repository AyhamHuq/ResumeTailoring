import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TabStopPosition,
  TabStopType,
  TextRun,
} from "docx";
import { formatContact } from "./profile";
import { curateSkills } from "../../shared/skills";
import type { EvidenceCard, GeneratedBullet, GeneratedResume, StaticProfile } from "./types";

const font = "Calibri";
const bodySize = 21;
const headingSize = 21;

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

type BuildDocxInput = {
  profile: StaticProfile | LegacyProfile;
  generatedResume?: GeneratedResume;
  resume?: GeneratedResume;
  evidenceCards?: EvidenceCard[];
  jobDescription?: string;
};

type LegacyProfile = {
  name: string;
  contact: {
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    website?: string;
  } | string[];
  education: Array<string | {
    school: string;
    degree: string;
    graduation?: string;
    gpa?: string;
    location?: string;
    coursework?: string[];
  }>;
  certifications: string[];
  workExperience?: Array<{
    id: string;
    employer: string;
    title: string;
    dates: string;
    location: string;
  }>;
};

export async function buildResumeDocx(input: BuildDocxInput): Promise<Blob> {
  const profile = normalizeProfile(input.profile);
  const resume = input.generatedResume ?? input.resume;
  if (!resume) {
    throw new Error("A generated resume is required for DOCX export.");
  }

  if (input.evidenceCards) {
    validateExportableResume(profile, resume, input.evidenceCards);
  }
  const exportSkills = curateSkills(normalizeSkills(resume.skills), undefined, {
    jobDescription: input.jobDescription
  });

  const sections = [
    ...nameAndContact(profile),
    sectionHeading("Education"),
    ...profile.education.flatMap((item) => educationBlock(item)),
    sectionHeading("Work Experience"),
    ...workExperience(profile, resume),
    sectionHeading("Skills"),
    ...formatSkillLines(exportSkills).map((line) => body(line)),
    sectionHeading("Projects"),
    ...projects(profile, resume),
    sectionHeading("Certifications"),
    ...profile.certifications.map((line) => body(line)),
  ];

  const document = new Document({
    title: `${profile.name} Resume`,
    creator: profile.name,
    description: "Resume",
    styles: {
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { font: "Calibri", size: headingSize, bold: true },
          paragraph: { spacing: { before: 100, after: 30 } },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { font: "Calibri", size: bodySize, bold: true },
          paragraph: { spacing: { after: 0 } },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720
            }
          }
        },
        children: sections,
      },
    ],
  });

  return Packer.toBlob(document);
}

export async function exportResumeDocx(
  profile: StaticProfile,
  resume: GeneratedResume,
  evidenceCards: EvidenceCard[],
  jobDescription?: string
) {
  const blob = await buildResumeDocx({ profile, generatedResume: resume, evidenceCards, jobDescription });
  const fileName = `${profile.name.replace(/\s+/g, "_")}_Resume.docx`;
  downloadBlob(blob, fileName);
}

function normalizeSkills(skills: unknown[]): string[] {
  return skills.map((skill) => {
    if (typeof skill === "string") {
      return skill;
    }
    if (skill && typeof skill === "object" && "name" in skill && typeof (skill as { name: unknown }).name === "string") {
      return (skill as { name: string }).name;
    }
    return "";
  }).filter(Boolean);
}

function normalizeProfile(profile: StaticProfile | LegacyProfile): StaticProfile {
  if ("employers" in profile && "allowed_projects" in profile && !Array.isArray(profile.contact)) {
    return profile as StaticProfile;
  }

  const legacy = profile as LegacyProfile;
  const contact = Array.isArray(legacy.contact)
    ? {
      location: legacy.contact[0] ?? "",
      email: legacy.contact[1] ?? "",
      phone: "",
      linkedin: legacy.contact[2] ?? "",
      website: ""
    }
    : {
      location: legacy.contact.location ?? "",
      email: legacy.contact.email ?? "",
      phone: legacy.contact.phone ?? "",
      linkedin: legacy.contact.linkedin ?? "",
      website: legacy.contact.website ?? ""
    };

  return {
    name: legacy.name,
    contact,
    education: legacy.education.map((item) => typeof item === "string"
      ? { school: item, degree: item, graduation: "" }
      : {
        school: item.school,
        degree: item.degree,
        graduation: item.graduation ?? "",
        gpa: item.gpa,
        location: item.location,
        coursework: item.coursework
      }),
    certifications: legacy.certifications,
    role_modes: ["auto", "backend", "cloud", "full_stack", "ai", "consulting"],
    employers: (legacy.workExperience ?? []).map((item) => ({
      job_id: item.id,
      employer: item.employer,
      title: item.title,
      dates: item.dates,
      location: item.location
    })),
    allowed_projects: []
  };
}

export function formatDateString(dateStr: string): string {
  return dateStr.replace(/(\d{2})\/(\d{4})/g, (_, month, year) => {
    return `${MONTHS[parseInt(month, 10) - 1]} ${year}`;
  });
}

function nameAndContact(profile: StaticProfile) {
  const contactParts = [
    profile.contact.location,
    profile.contact.email,
    profile.contact.phone,
    profile.contact.linkedin,
    profile.contact.website,
  ].filter(Boolean);

  const children: TextRun[] = [];
  contactParts.forEach((part, i) => {
    if (i > 0) children.push(new TextRun({ text: " | ", font, size: bodySize }));
    children.push(new TextRun({ text: part, font, size: bodySize }));
  });

  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 30 },
      children: [new TextRun({ text: profile.name, bold: true, font, size: 28 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children,
    }),
  ];
}

function educationBlock(edu: StaticProfile["education"][number]): Paragraph[] {
  const paragraphs: Paragraph[] = [
    new Paragraph({
      spacing: { after: 0 },
      tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
      children: [
        new TextRun({ text: edu.degree, bold: true, font, size: bodySize }),
        ...(edu.graduation ? [
          new TextRun({ text: "\t", font, size: bodySize }),
          new TextRun({ text: edu.graduation, font, size: bodySize }),
        ] : []),
      ],
    }),
    new Paragraph({
      spacing: { after: 35 },
      tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
      children: [
        new TextRun({
          text: [edu.school, edu.location].filter(Boolean).join(", "),
          font, size: bodySize,
        }),
        ...(edu.gpa ? [
          new TextRun({ text: "\t", font, size: bodySize }),
          new TextRun({ text: `GPA: ${edu.gpa}`, font, size: bodySize }),
        ] : []),
      ],
    }),
  ];
  if (edu.coursework?.length) {
    paragraphs.push(body(`Relevant Coursework: ${edu.coursework.join(", ")}`));
  }
  return paragraphs;
}

function workExperience(profile: StaticProfile, resume: GeneratedResume) {
  const paragraphs: Paragraph[] = [];
  let lastEmployer = "";

  for (const job of resume.work_experience) {
    const staticJob = profile.employers.find((item) => item.job_id === job.job_id);
    if (!staticJob) continue;
    const dates = formatDateString(staticJob.dates);
    const sameEmployer = staticJob.employer === lastEmployer;

    if (!sameEmployer) {
      paragraphs.push(new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 0 },
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        children: [
          new TextRun({ text: `${staticJob.employer} \u2013 ${staticJob.location}`, bold: true, font, size: bodySize }),
        ],
      }));
      lastEmployer = staticJob.employer;
    }

    paragraphs.push(new Paragraph({
      spacing: { after: 35 },
      tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
      children: [
        new TextRun({ text: staticJob.title, italics: true, font, size: bodySize }),
        new TextRun({ text: "\t", font, size: bodySize }),
        new TextRun({ text: dates, font, size: bodySize }),
      ],
    }));

    paragraphs.push(...job.bullets.map((bullet) => bulletParagraph(bullet)));
  }

  return paragraphs;
}

function projects(profile: StaticProfile, resume: GeneratedResume) {
  return resume.projects.flatMap((project) => {
    const staticProject = profile.allowed_projects.find((item) => item.project_id === project.project_id);
    const name = project.display_name || staticProject?.display_name || project.project_id;
    return [body(name, true), ...project.bullets.map((bullet) => bulletParagraph(bullet))];
  });
}

function sectionHeading(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 100, after: 30 },
    children: [new TextRun({ text: text.toUpperCase(), bold: true, font, size: headingSize })],
  });
}

function body(text: string, bold = false) {
  return new Paragraph({
    spacing: { after: 35 },
    children: [new TextRun({ text, bold, font, size: bodySize })],
  });
}

function bulletParagraph(bullet: GeneratedBullet) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 35 },
    children: [new TextRun({ text: bullet.text, font, size: bodySize })],
  });
}

function formatSkillLines(skills: string[]): string[] {
  if (skills.length <= 18) {
    return [skills.join(" | ")];
  }

  const remaining = new Set(skills);
  const categories = [
    { label: "Languages", terms: ["Java", "Python", "Go", "Golang", "Kotlin", "TypeScript", "JavaScript", "C#", "C/C++", "SQL", "Bash", "YAML"] },
    { label: "Cloud/Backend", terms: ["AWS", "AWS Lambda", "Lambda", "API Gateway", "SQS", "SNS", "DynamoDB", "S3", "Kinesis", "CloudWatch", "CloudWatch Logs", "Athena", "Glue", "IAM", "CloudFormation", "CDK", "Ansible", "Azure SQL", "Spring Boot", "Flask", "Node.js", "REST APIs", "Firebase", "Plaid API"] },
    { label: "AI/Tools", terms: ["Bedrock", "LangChain", "RAG", "OpenSearch", "FAISS", "PyTorch", "Docker", "Jenkins", "GitHub Actions", "Git", "Jest", "pytest", "JUnit", "Playwright", "React", "React Native"] }
  ];

  const lines = categories.map((category) => {
    const matched = category.terms.filter((term) => remaining.delete(term));
    return matched.length > 0 ? `${category.label}: ${matched.join(" | ")}` : "";
  }).filter(Boolean);

  if (remaining.size > 0) {
    const extra = [...remaining].join(" | ");
    if (lines.length < 3) {
      lines.push(`Additional: ${extra}`);
    } else {
      lines[lines.length - 1] = `${lines[lines.length - 1]} | ${extra}`;
    }
  }

  return lines;
}

export function downloadBlob(blob: Blob, fileName: string) {
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(href);
}

function validateExportableResume(profile: StaticProfile, resume: GeneratedResume, evidenceCards: EvidenceCard[]) {
  const evidenceIds = new Set(evidenceCards.map((card) => card.id));
  const jobIds = new Set(profile.employers.map((job) => job.job_id));
  const projectIds = new Set(profile.allowed_projects.map((project) => project.project_id));
  const invalidJobs = resume.work_experience.filter((job) => !jobIds.has(job.job_id)).map((job) => job.job_id);
  const invalidProjects = resume.projects.filter((project) => projectIds.size > 0 && !projectIds.has(project.project_id)).map((project) => project.project_id);
  const invalidEvidence = [...resume.work_experience.flatMap((job) => job.bullets), ...resume.projects.flatMap((project) => project.bullets)]
    .flatMap((bullet) => bullet.evidence_refs)
    .filter((ref) => !evidenceIds.has(ref));

  if (invalidJobs.length > 0 || invalidProjects.length > 0 || invalidEvidence.length > 0) {
    throw new Error(
      [
        invalidJobs.length ? `invalid job IDs: ${invalidJobs.join(", ")}` : "",
        invalidProjects.length ? `invalid project IDs: ${invalidProjects.join(", ")}` : "",
        invalidEvidence.length ? `invalid evidence refs: ${Array.from(new Set(invalidEvidence)).join(", ")}` : "",
      ].filter(Boolean).join("; "),
    );
  }
}

export const generateResumeDocx = buildResumeDocx;
