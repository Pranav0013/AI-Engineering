import { useState } from "react";
import { Zap, Search, AlertTriangle, ChevronRight } from "lucide-react";
import Header from "./components/Header";
import SettingsDrawer from "./components/SettingsDrawer";
import IssueCard from "./components/IssueCard";
import TestPlanViewer from "./components/TestPlanViewer";
import { useSettings } from "./hooks/useSettings";
import {
  fetchJiraIssue,
  generateTestPlan,
  analyzeAutomation,
} from "./services/api";

const STEPS = {
  IDLE: "idle",
  FETCHING: "fetching",
  GENERATING: "generating",
  ANALYZING: "analyzing",
  DONE: "done",
};

export default function App() {
  const { settings, saveSettings, isConfigured } = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [issueId, setIssueId] = useState("");
  const [issue, setIssue] = useState(null);
  const [testPlan, setTestPlan] = useState(null);
  const [automationAnalysis, setAutomationAnalysis] = useState(null);
  const [step, setStep] = useState(STEPS.IDLE);
  const [error, setError] = useState(null);

  async function handleGenerate(e) {
    e.preventDefault();
    const id = issueId.trim().toUpperCase();
    if (!id) return;

    setError(null);
    setIssue(null);
    setTestPlan(null);
    setAutomationAnalysis(null);

    try {
      // Step 1 — Fetch Jira issue
      setStep(STEPS.FETCHING);
      const fetchedIssue = await fetchJiraIssue(id, settings);
      setIssue(fetchedIssue);

      // Step 2 — Generate formal test plan (sections 1–10)
      setStep(STEPS.GENERATING);
      const plan = await generateTestPlan(fetchedIssue, settings);
      setTestPlan(plan);

      // Step 3 — Automation analysis (sections 11–17)
      setStep(STEPS.ANALYZING);
      const analysis = await analyzeAutomation(fetchedIssue, settings);
      setAutomationAnalysis(analysis);

      setStep(STEPS.DONE);
    } catch (err) {
      setError(
        err.response?.data?.error || err.message || "Something went wrong.",
      );
      setStep(STEPS.IDLE);
    }
  }

  const isLoading = [
    STEPS.FETCHING,
    STEPS.GENERATING,
    STEPS.ANALYZING,
  ].includes(step);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#030712",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Header
        onSettingsClick={() => setSettingsOpen(true)}
        isConfigured={isConfigured()}
      />

      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSave={(s) => {
          saveSettings(s);
          setSettingsOpen(false);
        }}
      />

      <main
        style={{
          flex: 1,
          maxWidth: 1080,
          width: "100%",
          margin: "0 auto",
          padding: "32px 24px",
        }}
      >
        {/* Hero — only when idle */}
        {step === STEPS.IDLE && !testPlan && (
          <div
            className="animate-fade-in-up"
            style={{ textAlign: "center", marginBottom: 40 }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "#1f6feb18",
                border: "1px solid #1f6feb30",
                borderRadius: 20,
                padding: "4px 14px",
                marginBottom: 20,
                fontSize: 12,
                color: "#58a6ff",
              }}
            >
              <Zap size={12} fill="#58a6ff" />
              Powered by Jira REST API × GROQ LLM × Playwright Analysis
            </div>
            <h1
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: "#e6edf3",
                marginBottom: 12,
                lineHeight: 1.2,
              }}
            >
              Generate a Formal Test Plan
              <br />
              <span
                style={{
                  background: "linear-gradient(135deg, #58a6ff, #bc8cff)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                + Automation Analysis
              </span>
            </h1>
            <p
              style={{
                fontSize: 15,
                color: "#8b949e",
                maxWidth: 520,
                margin: "0 auto",
              }}
            >
              Enter a Jira ID to fetch the issue and generate an IEEE 829 test
              plan with a full Playwright automation assessment — all in one
              click.
            </p>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleGenerate} style={{ marginBottom: 24 }}>
          <div
            style={{
              background: "#161b22",
              border: "1px solid #30363d",
              borderRadius: 10,
              padding: 20,
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
            }}
          >
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#8b949e",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 8,
                }}
              >
                Jira Issue I
              </label>
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Search
                  size={15}
                  style={{
                    position: "absolute",
                    left: 11,
                    color: "#484f58",
                    pointerEvents: "none",
                  }}
                />
                <input
                  value={issueId}
                  onChange={(e) => setIssueId(e.target.value)}
                  placeholder="e.g. DOC-3706"
                  disabled={isLoading}
                  style={{
                    paddingLeft: 34,
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: 15,
                    fontWeight: 500,
                    letterSpacing: "0.02em",
                    opacity: isLoading ? 0.5 : 1,
                  }}
                />
              </div>
            </div>
            <div style={{ paddingTop: 23 }}>
              <button
                type="submit"
                disabled={isLoading || !issueId.trim()}
                style={{
                  padding: "9px 20px",
                  background: isLoading
                    ? "#21262d"
                    : "linear-gradient(135deg, #1f6feb 0%, #388bfd 100%)",
                  border: `1px solid ${isLoading ? "#30363d" : "#1f6feb"}`,
                  borderRadius: 6,
                  color: isLoading ? "#8b949e" : "#fff",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: isLoading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  whiteSpace: "nowrap",
                  transition: "all 0.15s",
                  minWidth: 170,
                  justifyContent: "center",
                }}
              >
                {isLoading ? (
                  <>
                    <Spinner />
                    {stepLabel(step)}
                  </>
                ) : (
                  <>
                    <Zap size={14} fill="currentColor" />
                    Generate + Analyse
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Config warning */}
        {!isConfigured() && (
          <div
            className="animate-fade-in-up"
            style={{
              background: "#2a1f0e",
              border: "1px solid #d29922",
              borderRadius: 8,
              padding: "12px 16px",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <AlertTriangle
              size={15}
              color="#d29922"
              style={{ flexShrink: 0 }}
            />
            <span style={{ fontSize: 13, color: "#d29922" }}>
              Jira and GROQ credentials are not configured.{" "}
              <button
                onClick={() => setSettingsOpen(true)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#58a6ff",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 500,
                  padding: 0,
                }}
              >
                Open Settings{" "}
                <ChevronRight size={11} style={{ display: "inline" }} />
              </button>
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="animate-fade-in-up"
            style={{
              background: "#2a0e0e",
              border: "1px solid #f85149",
              borderRadius: 8,
              padding: "12px 16px",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <AlertTriangle
              size={15}
              color="#f85149"
              style={{ flexShrink: 0 }}
            />
            <span style={{ fontSize: 13, color: "#f85149" }}>{error}</span>
          </div>
        )}

        {/* Progress pipeline */}
        {isLoading && (
          <div className="animate-fade-in-up" style={{ marginBottom: 20 }}>
            <ProgressPipeline step={step} />
          </div>
        )}

        {/* Issue card */}
        {issue && <IssueCard issue={issue} />}

        {/* Tabbed output — shows once test plan is ready */}
        {(testPlan || automationAnalysis) && (
          <TestPlanViewer
            testPlan={testPlan}
            automationAnalysis={automationAnalysis}
            analyzingInProgress={step === STEPS.ANALYZING}
          />
        )}
      </main>

      <footer
        style={{
          borderTop: "1px solid #21262d",
          padding: "14px 24px",
          textAlign: "center",
        }}
      >
        <span style={{ fontSize: 11, color: "#484f58" }}>
          Jira Test Plan Generator · DocMX Development
        </span>
      </footer>
    </div>
  );
}

function stepLabel(step) {
  if (step === STEPS.FETCHING) return "Fetching issue…";
  if (step === STEPS.GENERATING) return "Generating plan…";
  if (step === STEPS.ANALYZING) return "Analysing…";
  return "Working…";
}

function Spinner() {
  return (
    <div
      style={{
        width: 14,
        height: 14,
        border: "2px solid #30363d",
        borderTopColor: "#58a6ff",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }}
    />
  );
}

function ProgressPipeline({ step }) {
  const steps = [
    { id: STEPS.FETCHING, label: "Fetch Jira issue", icon: "🔗" },
    { id: STEPS.GENERATING, label: "Generate formal test plan", icon: "📋" },
    {
      id: STEPS.ANALYZING,
      label: "Playwright automation analysis",
      icon: "🎭",
    },
  ];

  const order = [STEPS.FETCHING, STEPS.GENERATING, STEPS.ANALYZING, STEPS.DONE];
  const currentIdx = order.indexOf(step);

  return (
    <div
      style={{
        background: "#161b22",
        border: "1px solid #30363d",
        borderRadius: 10,
        padding: "16px 20px",
      }}
    >
      {steps.map((s, i) => {
        const stepIdx = order.indexOf(s.id);
        const isActive = step === s.id;
        const isDone = currentIdx > stepIdx;

        return (
          <div
            key={s.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "7px 0",
              position: "relative",
            }}
          >
            {/* Connector line */}
            {i < steps.length - 1 && (
              <div
                style={{
                  position: "absolute",
                  left: 10,
                  top: 30,
                  width: 2,
                  height: 14,
                  background: isDone ? "#3fb950" : "#21262d",
                  transition: "background 0.4s",
                }}
              />
            )}
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                flexShrink: 0,
                background: isDone
                  ? "#1a4a2e"
                  : isActive
                    ? "#1f3a5f"
                    : "#21262d",
                border: `2px solid ${isDone ? "#3fb950" : isActive ? "#58a6ff" : "#30363d"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.3s",
              }}
            >
              {isDone ? (
                <svg width="10" height="10" viewBox="0 0 10 10">
                  <path
                    d="M2 5l2.5 2.5L8 3"
                    stroke="#3fb950"
                    strokeWidth="1.5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : isActive ? (
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    border: "1.5px solid #484f58",
                    borderTopColor: "#58a6ff",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
              ) : (
                <span
                  style={{ fontSize: 9, fontWeight: 600, color: "#484f58" }}
                >
                  {i + 1}
                </span>
              )}
            </div>
            <span
              style={{
                fontSize: 13,
                color: isActive ? "#e6edf3" : isDone ? "#3fb950" : "#484f58",
                fontWeight: isActive ? 500 : 400,
                transition: "color 0.3s",
              }}
            >
              {s.icon} {s.label}
            </span>
            {isActive && (
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 11,
                  color: "#58a6ff",
                  fontWeight: 500,
                }}
              >
                In progress…
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
