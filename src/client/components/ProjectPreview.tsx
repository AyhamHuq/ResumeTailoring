import { Boxes } from "lucide-react";
import type { EvidenceCard, GeneratedBullet, GeneratedResume, StaticProfile } from "../lib/types";
import { STATIC_PROFILE } from "../lib/profile";

interface ProjectPreviewProps {
  resume: GeneratedResume | null;
  evidenceCards: EvidenceCard[];
  onResumeChange: (resume: GeneratedResume) => void;
}

export function ProjectPreview({ resume, evidenceCards, onResumeChange }: ProjectPreviewProps) {
  function swapProject(index: number, projectId: string) {
    if (!resume) return;
    const projects = resume.projects.map((project, currentIndex) =>
      currentIndex === index
        ? {
          ...project,
          project_id: projectId,
          display_name: STATIC_PROFILE.allowed_projects.find((item) => item.project_id === projectId)?.display_name ?? projectId
        }
        : project,
    );
    onResumeChange({ ...resume, projects });
  }

  return (
    <section className="panel">
      <div className="panel-title">
        <Boxes size={16} />
        Projects
      </div>
      {!resume ? (
        <p className="muted">Generated project choices appear here.</p>
      ) : (
        resume.projects.map((project, index) => (
          <div className="project-control" key={`${project.project_id}-${index}`}>
            <label>
              Project {index + 1}
              <select value={project.project_id} onChange={(event) => swapProject(index, event.target.value)}>
                {STATIC_PROFILE.allowed_projects.map((item) => (
                  <option key={item.project_id} value={item.project_id}>
                    {item.display_name}
                  </option>
                ))}
              </select>
            </label>
            <p>{project.bullets.length} bullets | {evidenceCards.length} evidence cards available</p>
          </div>
        ))
      )}
    </section>
  );
}

export function ProjectPreviewInline({
  profile,
  resume,
  evidenceCards,
  onSelectBullet,
}: {
  profile: StaticProfile;
  resume: GeneratedResume;
  evidenceCards: EvidenceCard[];
  onSelectBullet: (bullet: GeneratedBullet) => void;
}) {
  return (
    <>
      {resume.projects.map((project) => {
        const staticProject = profile.allowed_projects.find((item) => item.project_id === project.project_id);
        return (
          <div className="resume-project" key={project.project_id}>
            <strong>{project.display_name || staticProject?.display_name || project.project_id}</strong>
            <ul>
              {project.bullets.map((bullet, index) => (
                <li key={`${project.project_id}-${index}-${bullet.text}`}>
                  <button className="bullet-button" type="button" onClick={() => onSelectBullet(bullet)}>
                    {bullet.text}
                    <span className="evidence-markers">
                      {bullet.evidence_refs.map((ref) => (
                        <span key={ref} title={evidenceCards.find((card) => card.id === ref)?.title || ref}>
                          {ref}
                        </span>
                      ))}
                    </span>
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
