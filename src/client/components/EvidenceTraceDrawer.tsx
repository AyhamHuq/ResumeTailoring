import { X } from "lucide-react";
import type { EvidenceCard, GeneratedBullet } from "../lib/types";

interface EvidenceTraceDrawerProps {
  bullet: GeneratedBullet | null;
  evidenceCards: EvidenceCard[];
  onClose: () => void;
}

export function EvidenceTraceDrawer({ bullet, evidenceCards, onClose }: EvidenceTraceDrawerProps) {
  const facts = bullet?.evidence_refs
    .map((ref) => evidenceCards.find((card) => card.id === ref))
    .filter((card): card is EvidenceCard => Boolean(card)) ?? [];

  return (
    <aside className={`trace-drawer ${bullet ? "open" : ""}`} aria-hidden={!bullet}>
      <div className="drawer-header">
        <strong>Evidence Trace</strong>
        <button className="icon-button" type="button" onClick={onClose} title="Close evidence trace">
          <X size={16} />
        </button>
      </div>
      {bullet && (
        <>
          <p className="selected-bullet">{bullet.text}</p>
          {facts.length === 0 ? (
            <p className="inline-error">No matching source facts found for these evidence refs.</p>
          ) : (
            facts.map((card) => (
              <article className="fact-block" key={card.id}>
                <div>
                  <strong>{card.title}</strong>
                  <span>{card.type}</span>
                </div>
                <p>{card.evidence_text}</p>
                <small>{card.id} | {card.source_heading}</small>
              </article>
            ))
          )}
        </>
      )}
    </aside>
  );
}
