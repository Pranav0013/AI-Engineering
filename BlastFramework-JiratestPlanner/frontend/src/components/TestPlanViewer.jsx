import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Download, Copy, CheckCheck, FileText, Bot, Clock, Loader } from 'lucide-react';

const TABS = [
  { id: 'plan', label: 'Test Plan', icon: <FileText size={13} />, color: '#58a6ff' },
  { id: 'automation', label: 'Automation Analysis', icon: <Bot size={13} />, color: '#bc8cff' },
];

export default function TestPlanViewer({ testPlan, automationAnalysis, analyzingInProgress }) {
  const [activeTab, setActiveTab] = useState('plan');
  const [copied, setCopied] = useState(false);

  const activeData = activeTab === 'plan' ? testPlan : automationAnalysis;
  const isAnalysisLoading = activeTab === 'automation' && analyzingInProgress;

  function handleCopy() {
    if (!activeData) return;
    navigator.clipboard.writeText(activeData.markdown).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDownload() {
    if (!activeData) return;
    const filename =
      activeTab === 'plan'
        ? `test_plan_${activeData.issueKey}.md`
        : `automation_analysis_${activeData.issueKey}.md`;
    const blob = new Blob([activeData.markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleDownloadCombined() {
    if (!testPlan || !automationAnalysis) return;
    const combined = `${testPlan.markdown}\n\n---\n\n${automationAnalysis.markdown}`;
    const blob = new Blob([combined], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `full_qa_report_${testPlan.issueKey}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const generatedAt = activeData?.generatedAt
    ? new Date(activeData.generatedAt).toLocaleString()
    : '';

  return (
    <div className="animate-fade-in-up" style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10 }}>

      {/* Tab Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid #21262d',
        background: '#0d1117',
        borderRadius: '10px 10px 0 0',
        padding: '0 20px',
        gap: 4,
      }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const isTabLoading = tab.id === 'automation' && analyzingInProgress;
          const isTabReady = tab.id === 'plan' ? Boolean(testPlan) : Boolean(automationAnalysis);

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              disabled={!isTabReady && !isTabLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '12px 16px',
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${isActive ? tab.color : 'transparent'}`,
                color: isActive ? tab.color : isTabReady ? '#8b949e' : '#484f58',
                fontWeight: isActive ? 600 : 400,
                fontSize: 13,
                cursor: isTabReady || isTabLoading ? 'pointer' : 'not-allowed',
                marginBottom: -1,
                transition: 'color 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {isTabLoading ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> : tab.icon}
              {tab.label}
              {isTabLoading && (
                <span style={{ fontSize: 10, color: '#d29922', background: '#2a1f0e', border: '1px solid #d2992230', padding: '1px 6px', borderRadius: 10 }}>
                  Generating…
                </span>
              )}
              {isTabReady && !isTabLoading && (
                <span style={{ fontSize: 10, color: '#3fb950', background: '#1a4a2e', border: '1px solid #3fb95030', padding: '1px 6px', borderRadius: 10 }}>
                  Ready
                </span>
              )}
            </button>
          );
        })}

        {/* Spacer + combined download */}
        <div style={{ flex: 1 }} />
        {testPlan && automationAnalysis && (
          <ActionButton
            onClick={handleDownloadCombined}
            icon={<Download size={13} />}
            label="Download Full Report"
            primary
          />
        )}
      </div>

      {/* Toolbar */}
      {activeData && (
        <div style={{
          padding: '10px 20px',
          borderBottom: '1px solid #21262d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          background: '#111820',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {activeTab === 'plan' ? <FileText size={13} color="#58a6ff" /> : <Bot size={13} color="#bc8cff" />}
            <span style={{ fontWeight: 600, fontSize: 13, color: '#e6edf3' }}>
              {activeTab === 'plan' ? 'Formal Test Plan' : 'Test Coverage & Automation Analysis'} — {activeData.issueKey}
            </span>
            {activeData.model && (
              <span style={{ fontSize: 10, padding: '2px 7px', background: '#bc8cff18', color: '#bc8cff', border: '1px solid #bc8cff30', borderRadius: 20, fontFamily: 'JetBrains Mono, monospace' }}>
                {activeData.model}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {generatedAt && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#484f58' }}>
                <Clock size={11} />{generatedAt}
              </div>
            )}
            <ActionButton onClick={handleCopy} icon={copied ? <CheckCheck size={13} color="#3fb950" /> : <Copy size={13} />} label={copied ? 'Copied!' : 'Copy'} active={copied} />
            <ActionButton onClick={handleDownload} icon={<Download size={13} />} label="Download .md" />
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ padding: '28px 32px', minHeight: 200 }}>
        {isAnalysisLoading ? (
          <LoadingSkeleton />
        ) : activeData ? (
          <ReactMarkdown
            className="markdown-body"
            remarkPlugins={[remarkGfm]}
            components={{
              input: ({ checked, ...props }) => (
                <input type="checkbox" checked={checked} readOnly {...props} />
              ),
              h2: ({ children, ...props }) => {
                const id = String(children).toLowerCase().replace(/[^a-z0-9]+/g, '-');
                return <h2 id={id} {...props}>{children}</h2>;
              },
            }}
          >
            {activeData.markdown}
          </ReactMarkdown>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#484f58', fontSize: 14 }}>
            Content not yet available
          </div>
        )}
      </div>
    </div>
  );
}

function ActionButton({ onClick, icon, label, primary, active }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px',
        background: primary ? 'linear-gradient(135deg, #1f6feb, #388bfd)' : active ? '#1a4a2e' : '#21262d',
        border: `1px solid ${primary ? '#1f6feb' : active ? '#3fb950' : '#30363d'}`,
        borderRadius: 6, color: primary ? '#fff' : active ? '#3fb950' : '#e6edf3',
        fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => { if (!primary && !active) { e.currentTarget.style.borderColor = '#58a6ff'; e.currentTarget.style.background = '#30363d'; } }}
      onMouseLeave={(e) => { if (!primary && !active) { e.currentTarget.style.borderColor = '#30363d'; e.currentTarget.style.background = '#21262d'; } }}
    >
      {icon}{label}
    </button>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, color: '#8b949e', fontSize: 13 }}>
        <Bot size={16} color="#bc8cff" style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />
        Running deep automation analysis — identifying scenarios, classifying Playwright coverage…
      </div>
      {[220, 160, 280, 120, 200, 140, 260, 100].map((w, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
          <div className="skeleton" style={{ width: w, height: 14, flexShrink: 0 }} />
          {i % 3 === 0 && <div className="skeleton" style={{ width: w * 0.6, height: 14 }} />}
        </div>
      ))}
      <div className="skeleton" style={{ width: '100%', height: 80, marginTop: 20 }} />
      <div className="skeleton" style={{ width: '100%', height: 60, marginTop: 12 }} />
    </div>
  );
}
