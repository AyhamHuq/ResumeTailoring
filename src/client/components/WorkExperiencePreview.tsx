import { formatDateString } from "../lib/docxExport";
import type { EvidenceCard, GeneratedBullet, GeneratedResume, StaticProfile } from "../lib/types";

interface WorkExperiencePreviewProps {
  profile: StaticProfile;
  resume: GeneratedResume;
  evidenceCards: EvidenceCard[];
  onSelectBullet: (bullet: GeneratedBullet) => void;
}

export function WorkExperiencePreview({ profile, resume, evidenceCards, onSelectBullet }: WorkExperiencePreviewProps) {
  return (
    <>
      {resume.work_experience.map((job) => {
        const staticJob = profile.employers.find((item) => item.job_id === job.job_id);
        if (!staticJob) return null;
        return (
          <div className="resume-job" key={job.job_id}>
            <div className="resume-job-header">
              <div className="resume-job-line">
                <strong>{staticJob.employer}</strong>
                <span>{formatDateString(staticJob.dates)}</span>
              </div>
              <div className="resume-job-line">
                <em>{staticJob.title}</em>
                <span>{staticJob.location}</span>
              </div>
            </div>
            <ul>
              {job.bullets.map((bullet, index) => (
                <li key={`${job.job_id}-${index}-${bullet.text}`}>
                  <button className="bullet-button" type="button" onClick={() => onSelectBullet(bullet)}>
                    {bullet.text}
                    <EvidenceMarkers bullet={bullet} evidenceCards={evidenceCards} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </>
  );
}

function EvidenceMarkers({ bullet, evidenceCards }: { bullet: GeneratedBullet; evidenceCards: EvidenceCard[] }) {
  return (
    <span className="evidence-markers">
      {bullet.evidence_refs.map((ref) => (
        <span key={ref} title={evidenceCards.find((card) => card.id === ref)?.title || ref}>
          {ref}
        </span>
      ))}
    </span>
  );
}
