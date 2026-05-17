import { classifyKeywords as classifySharedKeywords } from "../../shared/keywords";
import type { EvidenceCard, GeneratedResume, KeywordReport } from "./types";

export function classifyKeywords(
  jobDescription: string,
  resume: GeneratedResume | null,
  evidenceCards: EvidenceCard[]
): KeywordReport {
  return classifySharedKeywords({
    jobDescription,
    generatedResume: resume as never,
    evidenceCards: evidenceCards as never
  });
}
