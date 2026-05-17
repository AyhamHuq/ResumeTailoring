import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { formatContact, formatEducation } from "./profile";
import type { EvidenceCard, GeneratedBullet, GeneratedResume, StaticProfile } from "./types";

const font = "Calibri";

type BuildDocxInput = {
  profile: StaticProfile | LegacyProfile;
  generatedResume?: GeneratedResume;
  resume?: GeneratedResume;
  evidenceCards?: EvidenceCard[];
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

  const sections = [
    ...nameAndContact(profile),
    sectionHeading("Education"),
    ...profile.education.map((item) => body(formatEducation(item))),
    sectionHeading("Work Experience"),
    ...workExperience(profile, resume),
    sectionHeading("Skills"),
    body(resume.skills.join(" | ")),
    sectionHeading("Projects"),
    ...projects(profile, resume),
    sectionHeading("Certifications"),
    ...profile.certifications.map((line) => body(line)),
  ];

  const document = new Document({
    sections: [
      {
        properties: {},
        children: sections,
      },
    ],
  });

  return Packer.toBlob(document);
}

export async function exportResumeDocx(profile: StaticProfile, resume: GeneratedResume, evidenceCards: EvidenceCard[]) {
  const blob = await buildResumeDocx({ profile, generatedResume: resume, evidenceCards });
  const fileName = `${profile.name.replace(/\s+/g, "_")}_Tailored_Resume.docx`;
  downloadBlob(blob, fileName);
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
        location: item.location
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

function nameAndContact(profile: StaticProfile) {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.TITLE,
      children: [new TextRun({ text: profile.name, bold: true, font, size: 28 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      children: [new TextRun({ text: formatContact(profile), font, size: 20 })],
    }),
  ];
}

function workExperience(profile: StaticProfile, resume: GeneratedResume) {
  return resume.work_experience.flatMap((job) => {
    const staticJob = profile.employers.find((item) => item.job_id === job.job_id);
    if (!staticJob) return [];
    return [
      body(`${staticJob.employer} - ${staticJob.title} | ${staticJob.location} | ${staticJob.dates}`, true),
      ...job.bullets.map((bullet) => bulletParagraph(bullet)),
    ];
  });
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
    spacing: { before: 180, after: 80 },
    children: [new TextRun({ text: text.toUpperCase(), bold: true, font, size: 20 })],
  });
}

function body(text: string, bold = false) {
  return new Paragraph({
    spacing: { after: 60 },
    children: [new TextRun({ text, bold, font, size: 20 })],
  });
}

function bulletParagraph(bullet: GeneratedBullet) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text: bullet.text, font, size: 20 })],
  });
}

function downloadBlob(blob: Blob, fileName: string) {
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
