import { Download } from "lucide-react";
import { useState } from "react";
import { exportCoverLetterDocx } from "../lib/coverLetterDocxExport";
import type { GeneratedCoverLetter, StaticProfile } from "../lib/types";

interface CoverLetterExportButtonProps {
  profile: StaticProfile;
  coverLetter: GeneratedCoverLetter | null;
  companyName?: string;
  positionTitle?: string;
}

export function CoverLetterExportButton({ profile, coverLetter, companyName, positionTitle }: CoverLetterExportButtonProps) {
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    if (!coverLetter) return;
    setError(null);
    try {
      await exportCoverLetterDocx(profile, coverLetter, companyName, positionTitle);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Cover letter DOCX export failed.");
    }
  }

  return (
    <div className="export-control">
      <button className="secondary-button" type="button" disabled={!coverLetter} onClick={handleExport}>
        <Download size={16} />
        Export Cover Letter
      </button>
      {error && <span className="export-error">{error}</span>}
    </div>
  );
}
