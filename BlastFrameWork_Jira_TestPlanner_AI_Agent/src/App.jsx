import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CheckCircle2,
  ClipboardList,
  Download,
  FileJson,
  KeyRound,
  LoaderCircle,
  Play,
  RefreshCw,
  Settings,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

// API configuration - use environment variable or fall back to current origin
const API_BASE_URL = import.meta.env.VITE_API_URL || window.location.origin;

const defaultOptions = {
  testTypes: ["functional", "negative", "edge", "regression", "api", "ui"],
  audience: "QA engineers",
  includeEdgeCases: true,
  includeAutomationCandidates: true,
  strictTraceability: true,
};

export default function App() {
  const [issueId, setIssueId] = useState("DOC-3706");
  const [settings, setSettings] = useState({
    jiraBaseUrl: "",
    jiraEmail: "",
    jiraToken: "",
    groqKey: "",
    groqModel: "llama-3.3-70b-versatile",
  });
  const [configStatus, setConfigStatus] = useState(null);
  const [connectionResult, setConnectionResult] = useState(null);
  const [plan, setPlan] = useState(null);
  const [activeView, setActiveView] = useState("summary");
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [savedProfiles, setSavedProfiles] = useState([]);
  const [activeSettingsTab, setActiveSettingsTab] = useState("current");
  const [profileName, setProfileName] = useState("");
  const [showProfileInput, setShowProfileInput] = useState(false);

  // Load saved profiles and settings from localStorage on mount
  useEffect(() => {
    const savedProfiles = localStorage.getItem("blastProfiles");
    if (savedProfiles) {
      try {
        setSavedProfiles(JSON.parse(savedProfiles));
      } catch {
        console.error("Failed to parse saved profiles");
      }
    }

    const savedSettings = localStorage.getItem("blastSettings");
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch {
        console.error("Failed to parse saved settings");
      }
    }
  }, []);

  // Fetch config status
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/config/status`)
      .then(readJsonResponse)
      .then(setConfigStatus)
      .catch(() => setConfigStatus(null));
  }, []);

  const visibleTestCases = plan?.test_plan?.test_cases || [];
  const statusItems = useMemo(() => {
    if (!configStatus) return [];
    return [
      ["Jira URL", configStatus.jiraBaseUrlConfigured],
      ["Jira Email", configStatus.jiraEmailConfigured],
      ["Jira Token", configStatus.jiraTokenConfigured],
      ["Groq Key", configStatus.groqKeyConfigured],
    ];
  }, [configStatus]);

  async function testConnections() {
    setLoading("connections");
    setError("");
    setConnectionResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/connections/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      const payload = await readJsonResponse(response);
      setConnectionResult(payload);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading("");
    }
  }

  async function generateTestPlan() {
    setLoading("plan");
    setError("");
    setPlan(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/test-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueId,
          settings,
          generationOptions: defaultOptions,
        }),
      });
      const payload = await readJsonResponse(response);
      if (!response.ok || payload.error)
        throw new Error(payload.error || "Generation failed.");
      if (payload.ok === false)
        throw new Error(payload.error || "Generation failed.");
      setPlan(payload);
      setActiveView("summary");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading("");
    }
  }

  function updateSetting(key, value) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  function saveSettings() {
    localStorage.setItem("blastSettings", JSON.stringify(settings));
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  }

  function saveAsProfile() {
    if (!profileName.trim()) {
      alert("Please enter a profile name");
      return;
    }

    const newProfile = {
      name: profileName.trim(),
      settings,
      savedAt: new Date().toLocaleString(),
    };

    const updated = savedProfiles.filter((p) => p.name !== profileName.trim());
    updated.push(newProfile);

    setSavedProfiles(updated);
    localStorage.setItem("blastProfiles", JSON.stringify(updated));
    setProfileName("");
    setShowProfileInput(false);
    setSettingsSaved(true);
    setActiveSettingsTab("saved");
    setTimeout(() => setSettingsSaved(false), 2000);
  }

  function loadProfile(profile) {
    setSettings(profile.settings);
    localStorage.setItem("blastSettings", JSON.stringify(profile.settings));
  }

  function deleteProfile(profileName) {
    if (confirm(`Delete profile "${profileName}"?`)) {
      const updated = savedProfiles.filter((p) => p.name !== profileName);
      setSavedProfiles(updated);
      localStorage.setItem("blastProfiles", JSON.stringify(updated));
    }
  }

  function clearSettings() {
    if (confirm("Are you sure you want to clear all current settings?")) {
      localStorage.removeItem("blastSettings");
      setSettings({
        jiraBaseUrl: "",
        jiraEmail: "",
        jiraToken: "",
        groqKey: "",
        groqModel: "llama-3.3-70b-versatile",
      });
    }
  }

  function download(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          {/* <p className="eyebrow">B.L.A.S.T. Jira Test Planner</p> */}
          <h1>Generate QA-ready test plans from Jira issues.</h1>
        </div>
        <div className="health-strip">
          {statusItems.map(([label, ok]) => (
            <span className={ok ? "status-pill ok" : "status-pill"} key={label}>
              {ok ? <CheckCircle2 size={15} /> : <TriangleAlert size={15} />}
              {label}
            </span>
          ))}
        </div>
      </section>

      <section className="workspace">
        <aside className="settings-panel">
          <div className="panel-heading">
            <Settings size={18} />
            <h2>Settings</h2>
          </div>

          {/* Settings Tabs */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              marginBottom: "16px",
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            <button
              onClick={() => setActiveSettingsTab("current")}
              style={{
                padding: "8px 12px",
                background:
                  activeSettingsTab === "current" ? "#10b981" : "transparent",
                color: activeSettingsTab === "current" ? "white" : "#666",
                border: "none",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: activeSettingsTab === "current" ? "600" : "400",
                borderRadius: "4px 4px 0 0",
              }}
            >
              Current Settings
            </button>
            <button
              onClick={() => setActiveSettingsTab("saved")}
              style={{
                padding: "8px 12px",
                background:
                  activeSettingsTab === "saved" ? "#10b981" : "transparent",
                color: activeSettingsTab === "saved" ? "white" : "#666",
                border: "none",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: activeSettingsTab === "saved" ? "600" : "400",
                borderRadius: "4px 4px 0 0",
              }}
            >
              Saved Settings ({savedProfiles.length})
            </button>
          </div>

          {/* Current Settings Tab */}
          {activeSettingsTab === "current" && (
            <>
              <p className="muted">
                Leave fields blank to use values from `.env`.
              </p>

              <label>
                Jira Base URL
                <input
                  value={settings.jiraBaseUrl}
                  onChange={(event) =>
                    updateSetting("jiraBaseUrl", event.target.value)
                  }
                  placeholder={
                    configStatus?.jiraBaseUrlHost ||
                    "https://your-domain.atlassian.net"
                  }
                />
              </label>

              <label>
                Jira Email
                <input
                  value={settings.jiraEmail}
                  onChange={(event) =>
                    updateSetting("jiraEmail", event.target.value)
                  }
                  placeholder="name@company.com"
                />
              </label>

              <label>
                Jira Token
                <input
                  type="password"
                  value={settings.jiraToken}
                  onChange={(event) =>
                    updateSetting("jiraToken", event.target.value)
                  }
                  placeholder="Use .env token"
                />
              </label>

              <label>
                Groq API Key
                <input
                  type="password"
                  value={settings.groqKey}
                  onChange={(event) =>
                    updateSetting("groqKey", event.target.value)
                  }
                  placeholder="Use .env key"
                />
              </label>

              <label>
                Groq Model
                <input
                  value={settings.groqModel}
                  onChange={(event) =>
                    updateSetting("groqModel", event.target.value)
                  }
                  placeholder="llama-3.3-70b-versatile"
                />
              </label>

              <button
                className="secondary-action"
                onClick={testConnections}
                disabled={Boolean(loading)}
              >
                {loading === "connections" ? (
                  <LoaderCircle className="spin" size={17} />
                ) : (
                  <RefreshCw size={17} />
                )}
                Test Connections
              </button>

              <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                <button
                  className="secondary-action"
                  onClick={saveSettings}
                  style={{
                    flex: 1,
                    backgroundColor: settingsSaved ? "#10b981" : undefined,
                  }}
                >
                  {settingsSaved ? "✓ Saved" : "💾 Save Settings"}
                </button>
                <button
                  className="secondary-action"
                  onClick={() => setShowProfileInput(true)}
                  style={{ flex: 1 }}
                >
                  💾 Save as Profile
                </button>
              </div>

              {showProfileInput && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "12px",
                    backgroundColor: "#f3f4f6",
                    borderRadius: "4px",
                  }}
                >
                  <label style={{ marginBottom: "8px", display: "block" }}>
                    Profile Name
                    <input
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="e.g., Development, Production"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") saveAsProfile();
                      }}
                      autoFocus
                    />
                  </label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      className="secondary-action"
                      onClick={saveAsProfile}
                      style={{ flex: 1, fontSize: "12px" }}
                    >
                      Save Profile
                    </button>
                    <button
                      className="secondary-action"
                      onClick={() => {
                        setShowProfileInput(false);
                        setProfileName("");
                      }}
                      style={{ flex: 1, fontSize: "12px" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <button
                className="secondary-action"
                onClick={clearSettings}
                style={{ marginTop: "8px", width: "100%" }}
              >
                🗑️ Clear
              </button>

              {connectionResult && (
                <ConnectionResult result={connectionResult} />
              )}
            </>
          )}

          {/* Saved Settings Tab */}
          {activeSettingsTab === "saved" && (
            <div>
              {savedProfiles.length === 0 ? (
                <div
                  style={{
                    padding: "16px",
                    textAlign: "center",
                    color: "#999",
                  }}
                >
                  <p>No saved profiles yet.</p>
                  <p style={{ fontSize: "12px" }}>
                    Fill in settings and click "Save as Profile" to create one.
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {savedProfiles.map((profile) => (
                    <div
                      key={profile.name}
                      style={{
                        padding: "12px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "6px",
                        backgroundColor: "#f9fafb",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "8px",
                        }}
                      >
                        <strong style={{ fontSize: "14px" }}>
                          {profile.name}
                        </strong>
                        <span style={{ fontSize: "11px", color: "#999" }}>
                          {profile.savedAt}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#666",
                          marginBottom: "8px",
                          lineHeight: "1.5",
                        }}
                      >
                        <div>
                          📧 {profile.settings.jiraEmail || "(from .env)"}
                        </div>
                        <div>🔑 {profile.settings.groqModel}</div>
                      </div>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          onClick={() => loadProfile(profile)}
                          style={{
                            flex: 1,
                            padding: "6px 12px",
                            fontSize: "12px",
                            backgroundColor: "#10b981",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          Load
                        </button>
                        <button
                          onClick={() => deleteProfile(profile.name)}
                          style={{
                            padding: "6px 12px",
                            fontSize: "12px",
                            backgroundColor: "#ef4444",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </aside>

        <section className="main-panel">
          <div className="generator-row">
            <label className="issue-input">
              Jira Issue ID
              <input
                value={issueId}
                onChange={(event) => setIssueId(event.target.value)}
              />
            </label>
            <button
              className="primary-action"
              onClick={generateTestPlan}
              disabled={Boolean(loading)}
            >
              {loading === "plan" ? (
                <LoaderCircle className="spin" size={18} />
              ) : (
                <Play size={18} />
              )}
              Generate Test Plan
            </button>
          </div>

          {error && (
            <div className="error-banner">
              <TriangleAlert size={18} />
              {error}
            </div>
          )}

          {!plan && !error && (
            <div className="empty-state">
              <ClipboardList size={40} />
              <h2>Ready for Jira context.</h2>
              <p>
                Enter an issue key, confirm settings, and generate a structured
                test plan.
              </p>
            </div>
          )}

          {plan && (
            <div className="results">
              <div className="result-header">
                <div>
                  <p className="eyebrow">{plan.jira_issue_id}</p>
                  <h2>{plan.source.title}</h2>
                  <p className="muted">
                    {plan.source.issue_type} · {plan.source.status} ·{" "}
                    {plan.source.priority} · {plan.generation_mode}
                  </p>
                </div>
                <div className="download-actions">
                  <button
                    className="icon-action"
                    title="Download Markdown"
                    onClick={() =>
                      download(
                        `${plan.jira_issue_id}-test-plan.md`,
                        plan.markdown,
                        "text/markdown",
                      )
                    }
                  >
                    <Download size={17} />
                  </button>
                  <button
                    className="icon-action"
                    title="Download JSON"
                    onClick={() =>
                      download(
                        `${plan.jira_issue_id}-test-plan.json`,
                        JSON.stringify(plan, null, 2),
                        "application/json",
                      )
                    }
                  >
                    <FileJson size={17} />
                  </button>
                </div>
              </div>

              {plan.generation_warning && (
                <div className="warning-banner">
                  <TriangleAlert size={17} />
                  Groq generation was unavailable, so the native BLAST fallback
                  created this plan.
                </div>
              )}

              <nav className="tabs">
                {["summary", "cases", "risks", "json"].map((view) => (
                  <button
                    className={activeView === view ? "active" : ""}
                    key={view}
                    onClick={() => setActiveView(view)}
                  >
                    {view}
                  </button>
                ))}
              </nav>

              {activeView === "summary" && <SummaryView plan={plan} />}
              {activeView === "cases" && (
                <CasesView testCases={visibleTestCases} />
              )}
              {activeView === "risks" && <RiskView plan={plan} />}
              {activeView === "json" && (
                <pre className="json-view">{JSON.stringify(plan, null, 2)}</pre>
              )}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

async function readJsonResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();

  if (!contentType.includes("application/json")) {
    throw new Error(
      "The React app received HTML instead of API JSON. Start the backend with `npm run api`, or make sure API_PORT matches the React dev server.",
    );
  }

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error(
      "The API returned malformed JSON. Restart the backend and try again.",
    );
  }
}

function ConnectionResult({ result }) {
  return (
    <div className="connection-box">
      <ConnectionLine
        label="Jira"
        result={result.jira}
        icon={<ShieldCheck size={16} />}
      />
      <ConnectionLine
        label="Groq"
        result={result.groq}
        icon={<KeyRound size={16} />}
      />
    </div>
  );
}

function ConnectionLine({ label, result, icon }) {
  const ok = result?.ok;
  return (
    <div className={ok ? "connection-line ok" : "connection-line"}>
      {icon}
      <span>{label}</span>
      <strong>{ok ? "Connected" : "Needs attention"}</strong>
    </div>
  );
}

function SummaryView({ plan }) {
  const testPlan = plan.test_plan;
  return (
    <div className="summary-grid">
      <Metric
        icon={<Activity size={18} />}
        label="Scenarios"
        value={testPlan.test_scenarios.length}
      />
      <Metric
        icon={<ClipboardList size={18} />}
        label="Test Cases"
        value={testPlan.test_cases.length}
      />
      <Metric
        icon={<TriangleAlert size={18} />}
        label="Risks"
        value={testPlan.risks.length}
      />
      <section className="wide-section">
        <h3>Objective</h3>
        <p>{testPlan.objective}</p>
      </section>
      <ListBlock title="Scope" items={testPlan.scope} />
      <ListBlock title="Assumptions" items={plan.assumptions} />
      <ListBlock title="Entry Criteria" items={testPlan.entry_criteria} />
      <ListBlock title="Exit Criteria" items={testPlan.exit_criteria} />
    </div>
  );
}

function CasesView({ testCases }) {
  return (
    <div className="case-list">
      {testCases.map((testCase) => (
        <article className="test-card" key={testCase.id}>
          <div className="test-card-header">
            <span>{testCase.id}</span>
            <strong>{testCase.title}</strong>
            <em>{testCase.priority || "Medium"}</em>
          </div>
          <p>{testCase.expected_result}</p>
          <div className="step-list">
            {(testCase.steps || []).map((step, index) => (
              <span key={`${testCase.id}-${step}`}>
                {index + 1}. {step}
              </span>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

function RiskView({ plan }) {
  return (
    <div className="risk-layout">
      <ListBlock title="Risks" items={plan.test_plan.risks} />
      <ListBlock title="Out Of Scope" items={plan.test_plan.out_of_scope} />
      <ListBlock
        title="Automation Candidates"
        items={plan.test_plan.automation_candidates}
      />
    </div>
  );
}

function Metric({ icon, label, value }) {
  return (
    <div className="metric">
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ListBlock({ title, items }) {
  return (
    <section className="list-block">
      <h3>{title}</h3>
      <ul>
        {(items || []).map((item) => (
          <li key={`${title}-${item}`}>{String(item)}</li>
        ))}
      </ul>
    </section>
  );
}
