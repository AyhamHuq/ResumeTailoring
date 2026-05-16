import type { AppState } from "./types";

const STORAGE_KEY = "resume-tailoring.client-state.v1";

export function loadState(): Partial<AppState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<AppState>) : {};
  } catch {
    return {};
  }
}

export function saveState(state: AppState) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      evidenceCards: state.evidenceCards,
      jobDescription: state.jobDescription,
      roleMode: state.roleMode,
      generatedResume: state.generatedResume,
      validationIssues: state.validationIssues,
      lastGeneratedKey: state.lastGeneratedKey,
    }),
  );
}
