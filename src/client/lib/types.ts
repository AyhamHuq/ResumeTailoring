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
    coursework?: string[];
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

export interface CoveragePlanEntry {
  target_term: string;
  canonical?: string;
  selected_evidence_refs: string[];
  section: "work_experience" | "projects";
  bullet_index: number;
  job_id?: string;
  project_id?: string;
}

export interface KeywordReport {
  covered_in_bullets: string[];
  covered_in_skills_only: string[];
  supported_but_omitted_for_space: string[];
  unsupported: string[];
  details?: KeywordReportItem[];
}

export interface KeywordReportItem {
  term: string;
  canonical: string;
  status: "covered_in_bullets" | "covered_in_skills_only" | "supported_but_omitted_for_space" | "alternative_satisfied" | "unsupported";
  support_level: "bullet" | "resume_skill" | "contextual_evidence" | "skill_list_only" | "synonym_only" | "alternative_satisfied" | "unsupported";
  evidence_refs: string[];
  matched_terms: string[];
  placement_recommendation: "prefer_bullet" | "skill_ok" | "omit" | "needs_source_update";
}

export interface ResumeFitReport {
  estimated_lines: number;
  target_min_lines: number;
  target_max_lines: number;
  hard_max_lines: number;
  estimated_fill_percent: number;
  total_bullets: number;
  work_bullets: number;
  project_bullets: number;
  status: "under_target" | "target" | "over_target" | "over_hard_max";
}

export interface GeneratedResume {
  role_mode?: RoleMode;
  summary?: string;
  coverage_plan?: CoveragePlanEntry[];
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
  fitReport?: ResumeFitReport;
  mode?: "mock" | "llm";
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
