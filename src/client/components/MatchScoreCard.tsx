import { Gauge } from "lucide-react";
import type { MatchScoreComparison } from "../../shared/matchScore";

function scoreColor(score: number): string {
  if (score >= 75) return "var(--score-green)";
  if (score >= 50) return "var(--score-yellow)";
  return "var(--score-red)";
}

function DimensionRow({ label, score }: { label: string; score: number }) {
  return (
    <div className="score-dimension">
      <span className="score-dimension-label">{label}</span>
      <div className="score-bar-track">
        <div
          className="score-bar-fill"
          style={{ width: `${score}%`, backgroundColor: scoreColor(score) }}
        />
      </div>
      <span className="score-dimension-value">{score}</span>
    </div>
  );
}

export function MatchScoreCard({
  comparison,
  showDelta,
}: {
  comparison: MatchScoreComparison;
  showDelta: boolean;
}) {
  const result = showDelta ? comparison.after : comparison.before;
  const { overall, dimensions } = result;

  return (
    <section className="panel match-score-card">
      <div className="panel-title">
        <Gauge size={16} />
        Match Score
      </div>

      <div className="score-hero">
        <span className="score-number" style={{ color: scoreColor(overall) }}>
          {overall}
        </span>
        <span className="score-denominator">/ 100</span>
      </div>

      <div className="score-dimensions">
        {dimensions.map((dim) => (
          <DimensionRow key={dim.label} label={dim.label} score={dim.score} />
        ))}
      </div>

      {showDelta && (
        <div className="score-delta">
          <span className="score-delta-before">{comparison.before.overall}</span>
          <span className="score-delta-arrow">&rarr;</span>
          <span className="score-delta-after">{comparison.after.overall}</span>
          <span
            className={`score-delta-badge ${comparison.delta > 0 ? "positive" : comparison.delta < 0 ? "negative" : ""}`}
          >
            {comparison.delta > 0 ? "+" : ""}
            {comparison.delta} boost
          </span>
        </div>
      )}

      {result.yoeRequirement && (
        <div className="score-yoe-note">
          JD asks for {result.yoeRequirement.min}+ yrs &middot; You have {result.candidateYoe.toFixed(1)} yrs
        </div>
      )}
    </section>
  );
}
