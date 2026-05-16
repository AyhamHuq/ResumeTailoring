import mammoth from "mammoth";
import { parseEvidenceCards, type EvidenceCard } from "../shared";

export { parseEvidenceCards, parseBraindumpText, textToEvidenceCards, buildEvidenceCards } from "../shared";

export async function parseDocxBuffer(buffer: Buffer): Promise<EvidenceCard[]> {
  const result = await mammoth.extractRawText({ buffer });
  return parseEvidenceCards(result.value);
}

export async function parseDocxFile(path: string): Promise<EvidenceCard[]> {
  const result = await mammoth.extractRawText({ path });
  return parseEvidenceCards(result.value);
}
