import type { RoleMode } from "../lib/types";

const modes: Array<{ value: RoleMode; label: string }> = [
  { value: "auto", label: "Auto" },
  { value: "backend", label: "Backend" },
  { value: "cloud", label: "Cloud" },
  { value: "full_stack", label: "Full stack" },
  { value: "ai", label: "AI" },
  { value: "consulting", label: "Consulting" },
];

export function RoleModeSelector({ value, onChange }: { value: RoleMode; onChange: (value: RoleMode) => void }) {
  return (
    <section className="panel">
      <div className="panel-title">Role Mode</div>
      <div className="segmented-control">
        {modes.map((mode) => (
          <button
            key={mode.value}
            type="button"
            className={value === mode.value ? "active" : ""}
            onClick={() => onChange(mode.value)}
          >
            {mode.label}
          </button>
        ))}
      </div>
    </section>
  );
}
