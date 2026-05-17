import type { ReactNode } from "react";
import { FileSearch } from "lucide-react";
import { ProjectPreviewInline } from "./ProjectPreview";
import { WorkExperiencePreview } from "./WorkExperiencePreview";
import { formatContact, formatEducation } from "../lib/profile";
import type { EvidenceCard, GeneratedBullet, GeneratedResume, StaticProfile } from "../lib/types";

interface ResumePreviewProps {
  profile: StaticProfile;
  resume: GeneratedResume | null;
  evidenceCards: EvidenceCard[];
  onSelectBullet: (bullet: GeneratedBullet) => void;
}

export function ResumePreview({ profile, resume, evidenceCards, onSelectBullet }: ResumePreviewProps) {
  return (
    <section className="resume-surface">
      <div className="panel-title">
        <FileSearch size={16} />
        Resume Preview
      </div>
      {!resume ? (
        <div className="empty-state">Upload evidence, paste a JD, then generate a grounded resume.</div>
      ) : (
        <article className="resume-page">
          <header className="resume-header">
            <h2>{profile.name}</h2>
            <p>{formatContact(profile)}</p>
          </header>
          {resume.summary && <p className="resume-summary">{resume.summary}</p>}
          <ResumeSection title="Education">
            {profile.education.map((item) => <p key={`${item.school}-${item.degree}`}>{formatEducation(item)}</p>)}
          </ResumeSection>
          <ResumeSection title="Work Experience">
            <WorkExperiencePreview
              profile={profile}
              resume={resume}
              evidenceCards={evidenceCards}
              onSelectBullet={onSelectBullet}
            />
          </ResumeSection>
          <ResumeSection title="Skills">
            <p>{resume.skills.join(" | ")}</p>
          </ResumeSection>
          <ResumeSection title="Projects">
            <ProjectPreviewInline
              profile={profile}
              resume={resume}
              evidenceCards={evidenceCards}
              onSelectBullet={onSelectBullet}
            />
          </ResumeSection>
          <ResumeSection title="Certifications">
            {profile.certifications.map((item) => <p key={item}>{item}</p>)}
          </ResumeSection>
        </article>
      )}
    </section>
  );
}

function ResumeSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="resume-section">
      <h3>{title}</h3>
      {children}
    </section>
  );
}
