import { ListChecks } from "lucide-react";
import type { KeywordReport } from "../lib/types";

export function KeywordEvidencePanel({ report }: { report: KeywordReport }) {
  return (
    <section className="panel">
      <div className="panel-title">
        <ListChecks size={16} />
        Keyword Evidence
      </div>
      <KeywordGroup title="Bullet covered" items={report.covered_in_bullets} />
      <KeywordGroup title="Skills only" items={report.covered_in_skills_only} />
      <KeywordGroup title="Supported omitted" items={report.supported_but_omitted_for_space} />
      <KeywordGroup title="Unsupported" items={report.unsupported} tone="danger" />
    </section>
  );
}

function KeywordGroup({ title, items, tone }: { title: string; items: string[]; tone?: "danger" }) {
  return (
    <div className="keyword-group">
      <div className="keyword-heading">
        <span>{title}</span>
        <strong>{items.length}</strong>
      </div>
      <div className="chip-row">
        {items.length === 0 ? <span className="empty">None</span> : items.map((item) => (
          <span key={item} className={`chip ${tone === "danger" ? "chip-danger" : ""}`}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
