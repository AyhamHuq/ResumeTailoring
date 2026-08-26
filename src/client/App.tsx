import { useEffect, useMemo, useState } from "react";
import { AlertCircle, RotateCcw, WandSparkles } from "lucide-react";
import { CoverLetterExportButton } from "./components/CoverLetterExportButton";
import { CoverLetterPreview } from "./components/CoverLetterPreview";
import { EvidenceTraceDrawer } from "./components/EvidenceTraceDrawer";
import { ExportButton } from "./components/ExportButton";
import { JDInput } from "./components/JDInput";
import { KeywordEvidencePanel } from "./components/KeywordEvidencePanel";
import { MatchScoreCard } from "./components/MatchScoreCard";
import { ProfileSummary } from "./components/ProfileSummary";
import { ProjectPreview } from "./components/ProjectPreview";
import { ResumePreview } from "./components/ResumePreview";
import { RoleModeSelector } from "./components/RoleModeSelector";
import { SetupPanel } from "./components/SetupPanel";
import { parseBraindump } from "./lib/evidence";
import { generateResume, generateCoverLetter } from "./lib/api";
import { classifyKeywords } from "./lib/keywords";
import { loadState, saveState } from "./lib/storage";
import { STATIC_PROFILE } from "./lib/profile";
import { buildMasterResumeForScoring, calculateMatchScoreComparison } from "../shared/matchScore";
import { curateSkills } from "../shared/skills";
import type {
  AppState,
  EvidenceCard,
  GeneratedBullet,
  GeneratedCoverLetter,
  GeneratedResume,
  RoleMode,
  ValidationIssue,
} from "./lib/types";

const initialState: AppState = {
  evidenceCards: [],
  jobDescription: "",
  roleMode: "auto",
  generatedResume: null,
  validationIssues: [],
  lastGeneratedKey: "",
  generatedCoverLetter: null,
  coverLetterValidationIssues: [],
  lastCoverLetterKey: "",
};

type ActiveTab = "resume" | "cover-letter";

export function App() {
  const [state, setState] = useState<AppState>(() => ({ ...initialState, ...loadState() }));
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);
  const [selectedBullet, setSelectedBullet] = useState<GeneratedBullet | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("resume");
  const [companyName, setCompanyName] = useState("");
  const [positionTitle, setPositionTitle] = useState("");

  useEffect(() => {
    saveState(state);
  }, [state]);

  const generationKey = `${state.roleMode}:${state.jobDescription.trim()}`;
  const needsRegeneration = Boolean(state.generatedResume && state.lastGeneratedKey !== generationKey);
  const displayResume = useMemo(
    () => state.generatedResume
      ? {
        ...state.generatedResume,
        skills: curateSkills(state.generatedResume.skills, undefined, { jobDescription: state.jobDescription })
      }
      : null,
    [state.generatedResume, state.jobDescription],
  );

  const keywordReport = useMemo(
    () => classifyKeywords(state.jobDescription, displayResume, state.evidenceCards),
    [state.jobDescription, displayResume, state.evidenceCards],
  );

  const masterResume = useMemo(() => buildMasterResumeForScoring(), []);

  const masterKeywordReport = useMemo(
    () => classifyKeywords(state.jobDescription, masterResume as never, state.evidenceCards),
    [state.jobDescription, masterResume, state.evidenceCards],
  );

  const matchScoreComparison = useMemo(() => {
    if (!state.jobDescription.trim()) return null;
    return calculateMatchScoreComparison({
      jobDescription: state.jobDescription,
      profile: STATIC_PROFILE,
      masterKeywordReport,
      tailoredKeywordReport: displayResume ? keywordReport : null,
    });
  }, [state.jobDescription, masterKeywordReport, displayResume, keywordReport]);

  async function handleBraindumpText(text: string, sourceName: string) {
    setUploadError(null);
    try {
      const evidenceCards = parseBraindump(text, sourceName);
      setState((current) => ({
        ...current,
        evidenceCards,
        generatedResume: null,
        validationIssues: [],
        lastGeneratedKey: "",
        generatedCoverLetter: null,
        coverLetterValidationIssues: [],
        lastCoverLetterKey: "",
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to parse braindump.";
      setUploadError(message);
    }
  }

  function updateEvidenceCards(evidenceCards: EvidenceCard[]) {
    setState((current) => ({ ...current, evidenceCards, generatedResume: null, lastGeneratedKey: "", generatedCoverLetter: null, lastCoverLetterKey: "" }));
  }

  async function handleGenerate() {
    setIsGenerating(true);
    setState((current) => ({ ...current, validationIssues: [] }));
    try {
      const response = await generateResume({
        jobDescription: state.jobDescription,
        roleMode: state.roleMode,
        staticProfile: STATIC_PROFILE,
        evidenceCards: state.evidenceCards,
      });
      setState((current) => ({
        ...current,
        generatedResume: response.resume,
        validationIssues: response.validationIssues ?? [],
        lastGeneratedKey: generationKey,
      }));
      setSelectedBullet(null);
    } catch (error) {
      const issue: ValidationIssue = {
        severity: "error",
        message: error instanceof Error ? error.message : "Generation failed.",
      };
      setState((current) => ({ ...current, validationIssues: [issue] }));
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleGenerateCoverLetter() {
    setIsGeneratingCoverLetter(true);
    setState((current) => ({ ...current, coverLetterValidationIssues: [] }));
    try {
      const response = await generateCoverLetter({
        jobDescription: state.jobDescription,
        roleMode: state.roleMode,
        staticProfile: STATIC_PROFILE,
        evidenceCards: state.evidenceCards,
        resumeKeywordReport: keywordReport,
        companyName: companyName || undefined,
        positionTitle: positionTitle || undefined,
      });
      setState((current) => ({
        ...current,
        generatedCoverLetter: response.coverLetter,
        coverLetterValidationIssues: response.validationIssues ?? [],
        lastCoverLetterKey: generationKey,
      }));
      setActiveTab("cover-letter");
    } catch (error) {
      const issue: ValidationIssue = {
        severity: "error",
        message: error instanceof Error ? error.message : "Cover letter generation failed.",
      };
      setState((current) => ({ ...current, coverLetterValidationIssues: [issue] }));
    } finally {
      setIsGeneratingCoverLetter(false);
    }
  }

  async function handleGenerateBoth() {
    setIsGenerating(true);
    setIsGeneratingCoverLetter(true);
    setState((current) => ({ ...current, validationIssues: [], coverLetterValidationIssues: [] }));
    try {
      const resumeResponse = await generateResume({
        jobDescription: state.jobDescription,
        roleMode: state.roleMode,
        staticProfile: STATIC_PROFILE,
        evidenceCards: state.evidenceCards,
      });
      setState((current) => ({
        ...current,
        generatedResume: resumeResponse.resume,
        validationIssues: resumeResponse.validationIssues ?? [],
        lastGeneratedKey: generationKey,
      }));
      setSelectedBullet(null);
      setIsGenerating(false);

      const coverLetterResponse = await generateCoverLetter({
        jobDescription: state.jobDescription,
        roleMode: state.roleMode,
        staticProfile: STATIC_PROFILE,
        evidenceCards: state.evidenceCards,
        resumeKeywordReport: resumeResponse.keywordReport,
        companyName: companyName || undefined,
        positionTitle: positionTitle || undefined,
      });
      setState((current) => ({
        ...current,
        generatedCoverLetter: coverLetterResponse.coverLetter,
        coverLetterValidationIssues: coverLetterResponse.validationIssues ?? [],
        lastCoverLetterKey: generationKey,
      }));
    } catch (error) {
      const issue: ValidationIssue = {
        severity: "error",
        message: error instanceof Error ? error.message : "Generation failed.",
      };
      setState((current) => ({ ...current, validationIssues: [...current.validationIssues, issue] }));
    } finally {
      setIsGenerating(false);
      setIsGeneratingCoverLetter(false);
    }
  }

  function setGeneratedResume(generatedResume: GeneratedResume) {
    setState((current) => ({ ...current, generatedResume }));
  }

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <h1>Resume Tailoring Console</h1>
          <p>Evidence-grounded tailoring from braindump to ATS-safe DOCX.</p>
        </div>
        <button
          className="icon-button"
          type="button"
          title="Reset generated resume"
          onClick={() => setState((current) => ({ ...current, generatedResume: null, lastGeneratedKey: "" }))}
        >
          <RotateCcw size={16} />
        </button>
      </section>

      <section className="workspace-grid">
        <aside className="left-rail">
          <SetupPanel
            evidenceCards={state.evidenceCards}
            uploadError={uploadError}
            onTextParsed={handleBraindumpText}
            onEvidenceCardsChange={updateEvidenceCards}
          />
          <ProfileSummary profile={STATIC_PROFILE} />
          <RoleModeSelector
            value={state.roleMode}
            onChange={(roleMode: RoleMode) => setState((current) => ({ ...current, roleMode }))}
          />
        </aside>

        <section className="center-panel">
          <JDInput
            value={state.jobDescription}
            onChange={(jobDescription) => setState((current) => ({ ...current, jobDescription }))}
          />
          <div className="cover-letter-fields">
            <input
              type="text"
              className="cl-field"
              placeholder="Company name (optional)"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
            <input
              type="text"
              className="cl-field"
              placeholder="Position title (optional)"
              value={positionTitle}
              onChange={(e) => setPositionTitle(e.target.value)}
            />
          </div>
          <div className="action-row">
            <button
              className="primary-button"
              type="button"
              disabled={!state.jobDescription.trim() || state.evidenceCards.length === 0 || isGenerating || isGeneratingCoverLetter}
              onClick={handleGenerateBoth}
            >
              <WandSparkles size={16} />
              {isGenerating || isGeneratingCoverLetter ? "Generating…" : "Generate Both"}
            </button>
            <button
              className="secondary-button"
              type="button"
              disabled={!state.jobDescription.trim() || state.evidenceCards.length === 0 || isGenerating}
              onClick={handleGenerate}
            >
              {isGenerating ? "Generating…" : needsRegeneration ? "Regenerate Resume" : "Resume Only"}
            </button>
            <button
              className="secondary-button"
              type="button"
              disabled={!state.generatedResume || isGeneratingCoverLetter}
              onClick={handleGenerateCoverLetter}
            >
              {isGeneratingCoverLetter ? "Generating…" : state.generatedCoverLetter ? "Regen Cover Letter" : "Cover Letter Only"}
            </button>
          </div>
          <div className="action-row">
            <ExportButton
              profile={STATIC_PROFILE}
              resume={displayResume}
              evidenceCards={state.evidenceCards}
              jobDescription={state.jobDescription}
            />
            <CoverLetterExportButton
              profile={STATIC_PROFILE}
              coverLetter={state.generatedCoverLetter}
              companyName={companyName || undefined}
              positionTitle={positionTitle || undefined}
            />
          </div>

          {activeTab === "resume" && state.validationIssues.length > 0 && (
            <div className="issues-panel" role="alert">
              <div className="panel-title">
                <AlertCircle size={16} />
                Validation
              </div>
              {state.validationIssues.map((issue, index) => (
                <p key={`${issue.message}-${index}`} className={`issue issue-${issue.severity}`}>
                  {issue.path ? `${issue.path}: ` : ""}
                  {issue.message}
                </p>
              ))}
            </div>
          )}

          {activeTab === "cover-letter" && state.coverLetterValidationIssues.length > 0 && (
            <div className="issues-panel" role="alert">
              <div className="panel-title">
                <AlertCircle size={16} />
                Validation
              </div>
              {state.coverLetterValidationIssues.map((issue, index) => (
                <p key={`${issue.message}-${index}`} className={`issue issue-${issue.severity}`}>
                  {issue.path ? `${issue.path}: ` : ""}
                  {issue.message}
                </p>
              ))}
            </div>
          )}

          <div className="tab-control">
            <button
              className={`tab-button ${activeTab === "resume" ? "tab-active" : ""}`}
              type="button"
              onClick={() => setActiveTab("resume")}
            >
              Resume
            </button>
            <button
              className={`tab-button ${activeTab === "cover-letter" ? "tab-active" : ""}`}
              type="button"
              onClick={() => setActiveTab("cover-letter")}
            >
              Cover Letter
            </button>
          </div>

          {activeTab === "resume" ? (
            <ResumePreview
              profile={STATIC_PROFILE}
              resume={displayResume}
              evidenceCards={state.evidenceCards}
              jobDescription={state.jobDescription}
              onSelectBullet={setSelectedBullet}
            />
          ) : (
            <CoverLetterPreview
              profile={STATIC_PROFILE}
              coverLetter={state.generatedCoverLetter}
            />
          )}
        </section>

        <aside className="right-rail">
          {matchScoreComparison && (
            <MatchScoreCard comparison={matchScoreComparison} showDelta={Boolean(displayResume)} />
          )}
          <KeywordEvidencePanel report={keywordReport} />
          <ProjectPreview
            resume={displayResume}
            evidenceCards={state.evidenceCards}
            onResumeChange={setGeneratedResume}
          />
        </aside>
      </section>

      <EvidenceTraceDrawer
        bullet={selectedBullet}
        evidenceCards={state.evidenceCards}
        onClose={() => setSelectedBullet(null)}
      />
    </main>
  );
}
