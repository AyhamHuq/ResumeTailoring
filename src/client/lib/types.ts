export type RoleMode = "auto" | "backend" | "cloud" | "full_stack" | "ai" | "consulting";

export interface EvidenceCard {
  id: string;
  type: "work_project_fact" | "project_fact" | "skill_fact" | "metric" | "known_unknown";
  parent_job_id?: string;
  project_id?: string;
  title: string;
  evidence_text: string;
  skills: string[];
  metrics: string[];
  role_tags: Array<Exclude<RoleMode, "auto">>;
  source_heading: string;
}

export interface StaticProfile {
  name: string;
  contact: {
    email: string;
    location: string;
    phone: string;
    linkedin: string;
    website: string;
  };
  education: Array<{
    school: string;
    location?: string;
    degree: string;
    graduation: string;
    gpa?: string;
  }>;
  certifications: string[];
  role_modes: RoleMode[];
  employers: Array<{
    job_id: string;
    employer: string;
    title: string;
    dates: string;
    location: string;
  }>;
  allowed_projects: Array<{
    project_id: string;
    display_name: string;
  }>;
}

export interface GeneratedBullet {
  text: string;
  evidence_refs: string[];
  jd_keywords?: string[];
  word_count?: number;
  char_count?: number;
  estimated_lines?: number;
}

export interface GeneratedWorkExperience {
  job_id: string;
  bullets: GeneratedBullet[];
}

export interface GeneratedProject {
  project_id: string;
  display_name: string;
  bullets: GeneratedBullet[];
  alternates?: string[];
}

export interface KeywordReport {
  covered_in_bullets: string[];
  covered_in_skills_only: string[];
  supported_but_omitted_for_space: string[];
  unsupported: string[];
}

export interface GeneratedResume {
  role_mode?: RoleMode;
  summary?: string;
  skills: string[];
  work_experience: GeneratedWorkExperience[];
  projects: GeneratedProject[];
  unsupported_terms?: string[];
  keyword_report?: KeywordReport;
}

export interface ValidationIssue {
  severity: "error" | "warning";
  code?: string;
  message: string;
  path?: string;
}

export interface GenerateResumeRequest {
  jobDescription: string;
  roleMode: RoleMode;
  staticProfile: StaticProfile;
  evidenceCards: EvidenceCard[];
}

export interface GenerateResumeResponse {
  resume: GeneratedResume;
  keywordReport?: KeywordReport;
  validationIssues?: ValidationIssue[];
}

export interface AppState {
  evidenceCards: EvidenceCard[];
  jobDescription: string;
  roleMode: RoleMode;
  generatedResume: GeneratedResume | null;
  validationIssues: ValidationIssue[];
  lastGeneratedKey: string;
}
