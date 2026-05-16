import { RefreshCw, WandSparkles } from "lucide-react";

interface GenerateButtonProps {
  disabled: boolean;
  isGenerating: boolean;
  needsRegeneration: boolean;
  onGenerate: () => void;
}

export function GenerateButton({ disabled, isGenerating, needsRegeneration, onGenerate }: GenerateButtonProps) {
  return (
    <button className="primary-button" type="button" disabled={disabled || isGenerating} onClick={onGenerate}>
      {needsRegeneration ? <RefreshCw size={16} /> : <WandSparkles size={16} />}
      {isGenerating ? "Generating..." : needsRegeneration ? "Regenerate" : "Generate Resume"}
    </button>
  );
}
