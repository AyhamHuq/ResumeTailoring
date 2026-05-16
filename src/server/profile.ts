import { readFile } from "node:fs/promises";
import path from "node:path";
import { ResumeProfileSchema, type ResumeProfile } from "../shared";

export async function loadResumeProfile(): Promise<ResumeProfile> {
  const profilePath = path.resolve(process.cwd(), "data", "config", "resume-profile.json");
  const raw = await readFile(profilePath, "utf8");
  return ResumeProfileSchema.parse(JSON.parse(raw));
}
