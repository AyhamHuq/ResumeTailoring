import { parseEvidenceCards } from "../../shared/evidenceParser";
import type { EvidenceCard } from "./types";

export function parseBraindump(text: string, _sourceName: string): EvidenceCard[] {
  return parseEvidenceCards(text);
}

export const parseBraindumpText = parseBraindump;
