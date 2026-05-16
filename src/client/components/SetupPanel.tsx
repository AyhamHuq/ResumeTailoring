import { ChangeEvent, useRef, useState } from "react";
import { FileText, Upload, XCircle } from "lucide-react";
import mammoth from "mammoth/mammoth.browser";
import type { EvidenceCard } from "../lib/types";

interface SetupPanelProps {
  evidenceCards: EvidenceCard[];
  uploadError: string | null;
  onTextParsed: (text: string, sourceName: string) => Promise<void>;
  onEvidenceCardsChange: (evidenceCards: EvidenceCard[]) => void;
}

export function SetupPanel({ evidenceCards, uploadError, onTextParsed, onEvidenceCardsChange }: SetupPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isParsing, setIsParsing] = useState(false);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsParsing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      await onTextParsed(result.value, file.name);
    } finally {
      setIsParsing(false);
      event.target.value = "";
    }
  }

  return (
    <section className="panel">
      <div className="panel-title">
        <FileText size={16} />
        Braindump
      </div>
      <input ref={inputRef} className="hidden-input" type="file" accept=".docx" onChange={handleFile} />
      <button className="primary-button full-width" type="button" onClick={() => inputRef.current?.click()} disabled={isParsing}>
        <Upload size={16} />
        {isParsing ? "Parsing DOCX..." : "Upload DOCX"}
      </button>
      <div className="status-grid">
        <span>Evidence cards</span>
        <strong>{evidenceCards.length}</strong>
        <span>Sources</span>
        <strong>{new Set(evidenceCards.map((card) => card.source_heading)).size}</strong>
      </div>
      {uploadError && (
        <p className="inline-error">
          <XCircle size={14} />
          {uploadError}
        </p>
      )}
      {evidenceCards.length > 0 && (
        <button className="text-button" type="button" onClick={() => onEvidenceCardsChange([])}>
          Clear evidence
        </button>
      )}
    </section>
  );
}
