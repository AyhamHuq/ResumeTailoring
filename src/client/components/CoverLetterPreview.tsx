import { FileText } from "lucide-react";
import type { GeneratedCoverLetter, StaticProfile } from "../lib/types";

interface CoverLetterPreviewProps {
  profile: StaticProfile;
  coverLetter: GeneratedCoverLetter | null;
}

export function CoverLetterPreview({ profile, coverLetter }: CoverLetterPreviewProps) {
  return (
    <section className="resume-surface">
      <div className="panel-title">
        <FileText size={16} />
        Cover Letter Preview
      </div>
      {!coverLetter ? (
        <div className="empty-state">Generate a resume first, then generate a complementary cover letter.</div>
      ) : (
        <article className="resume-page cover-letter-page">
          <p className="cover-letter-salutation"><strong>{coverLetter.salutation}</strong></p>
          <p className="cover-letter-paragraph">{coverLetter.opening.text}</p>
          {coverLetter.body_paragraphs.map((p, i) => (
            <p key={i} className="cover-letter-paragraph">{p.text}</p>
          ))}
          <p className="cover-letter-paragraph">{coverLetter.closing.text}</p>
          <p className="cover-letter-signoff">
            {coverLetter.sign_off}<br />
            <strong>{profile.name}</strong>
          </p>
        </article>
      )}
    </section>
  );
}
