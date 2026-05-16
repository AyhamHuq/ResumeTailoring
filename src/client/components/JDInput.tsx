import { ClipboardList } from "lucide-react";

export function JDInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <section className="panel jd-panel">
      <div className="panel-title">
        <ClipboardList size={16} />
        Job Description
      </div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Paste the target job description..."
        spellCheck={false}
      />
      <div className="field-footer">
        <span>{value.trim().split(/\s+/).filter(Boolean).length} words</span>
        <button className="text-button" type="button" onClick={() => onChange("")}>
          Clear
        </button>
      </div>
    </section>
  );
}
