import { Download } from "lucide-react";
import { useState } from "react";
import { exportResumeDocx } from "../lib/docxExport";
import type { EvidenceCard, GeneratedResume, StaticProfile } from "../lib/types";

interface ExportButtonProps {
  profile: StaticProfile;
  resume: GeneratedResume | null;
  evidenceCards: EvidenceCard[];
  jobDescription?: string;
}

export function ExportButton({ profile, resume, evidenceCards, jobDescription }: ExportButtonProps) {
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    if (!resume) return;
    setError(null);
    try {
      await exportResumeDocx(profile, resume, evidenceCards, jobDescription);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "DOCX export failed.");
    }
  }

  return (
    <div className="export-control">
      <button className="secondary-button" type="button" disabled={!resume} onClick={handleExport}>
        <Download size={16} />
        Export DOCX
      </button>
      {error && <span className="export-error">{error}</span>}
    </div>
  );
}
