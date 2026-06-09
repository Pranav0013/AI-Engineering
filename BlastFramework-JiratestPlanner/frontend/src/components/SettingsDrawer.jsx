import { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Save, CheckCircle } from 'lucide-react';

const Field = ({ label, type = 'text', value, onChange, placeholder, hint }) => {
  const [show, setShow] = useState(false);
  const isSecret = type === 'password';
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#8b949e', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={isSecret && !show ? 'password' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ paddingRight: isSecret ? 36 : 12 }}
        />
        {isSecret && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8b949e', padding: 0 }}
          >
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>
      {hint && <p style={{ fontSize: 11, color: '#484f58', marginTop: 4 }}>{hint}</p>}
    </div>
  );
};

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 28 }}>
    <div style={{
      fontSize: 11,
      fontWeight: 600,
      color: '#58a6ff',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      marginBottom: 14,
      paddingBottom: 6,
      borderBottom: '1px solid #21262d',
    }}>
      {title}
    </div>
    {children}
  </div>
);

export default function SettingsDrawer({ open, onClose, settings, onSave }) {
  const [form, setForm] = useState(settings);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setForm(settings); }, [settings]);

  function set(key) {
    return (val) => setForm((f) => ({ ...f, [key]: val }));
  }

  function handleSave() {
    onSave(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, backdropFilter: 'blur(2px)' }}
      />
      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 380,
          background: '#0d1117',
          borderLeft: '1px solid #30363d',
          zIndex: 101,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.25s ease-out both',
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #21262d', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: '#e6edf3' }}>Settings</div>
            <div style={{ fontSize: 11, color: '#484f58' }}>Configure Jira & GROQ connections</div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8b949e', padding: 4, borderRadius: 4, display: 'flex' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#e6edf3'; e.currentTarget.style.background = '#21262d'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#8b949e'; e.currentTarget.style.background = 'none'; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
          <Section title="Jira Configuration">
            <Field label="Email Address" value={form.jiraEmail} onChange={set('jiraEmail')} placeholder="you@company.com" />
            <Field label="API Token" type="password" value={form.jiraToken} onChange={set('jiraToken')} placeholder="Your Jira API token" hint="Generate at id.atlassian.com → Security → API tokens" />
            <Field label="Base URL" value={form.jiraBaseUrl} onChange={set('jiraBaseUrl')} placeholder="https://company.atlassian.net" />
          </Section>

          <Section title="GROQ Configuration">
            <Field label="API Key" type="password" value={form.groqKey} onChange={set('groqKey')} placeholder="gsk_..." hint="Get your free key at console.groq.com" />
            <Field label="Model" value={form.groqModel} onChange={set('groqModel')} placeholder="llama-3.3-70b-versatile" hint="Default: llama-3.3-70b-versatile (free)" />
          </Section>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid #21262d' }}>
          <button
            onClick={handleSave}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: saved ? '#1a4a2e' : 'linear-gradient(135deg, #1f6feb 0%, #388bfd 100%)',
              border: `1px solid ${saved ? '#3fb950' : '#1f6feb'}`,
              borderRadius: 6,
              color: saved ? '#3fb950' : '#fff',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s',
            }}
          >
            {saved ? <><CheckCircle size={16} /> Saved!</> : <><Save size={16} /> Save Settings</>}
          </button>
          <p style={{ fontSize: 11, color: '#484f58', textAlign: 'center', marginTop: 8 }}>
            Settings are saved locally in your browser.
          </p>
        </div>
      </div>
    </>
  );
}
