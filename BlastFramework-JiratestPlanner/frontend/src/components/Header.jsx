import { Settings, Zap } from 'lucide-react';

export default function Header({ onSettingsClick, isConfigured }) {
  return (
    <header
      style={{
        background: 'linear-gradient(180deg, #0d1117 0%, #161b22 100%)',
        borderBottom: '1px solid #30363d',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: 960,
          margin: '0 auto',
          padding: '0 24px',
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #1f6feb 0%, #58a6ff 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Zap size={16} color="#fff" fill="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: '#e6edf3', lineHeight: 1.2 }}>
              TestPlan Generator
            </div>
            <div style={{ fontSize: 11, color: '#484f58', lineHeight: 1 }}>
              Jira × GROQ
            </div>
          </div>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Config status dot */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: isConfigured ? '#3fb950' : '#d29922',
                boxShadow: isConfigured ? '0 0 6px #3fb950' : '0 0 6px #d29922',
              }}
            />
            <span style={{ fontSize: 12, color: '#8b949e' }}>
              {isConfigured ? 'Connected' : 'Not configured'}
            </span>
          </div>

          <button
            onClick={onSettingsClick}
            style={{
              background: '#21262d',
              border: '1px solid #30363d',
              borderRadius: 6,
              color: '#e6edf3',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              fontSize: 13,
              fontWeight: 500,
              transition: 'background 0.15s, border-color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#30363d';
              e.currentTarget.style.borderColor = '#58a6ff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#21262d';
              e.currentTarget.style.borderColor = '#30363d';
            }}
          >
            <Settings size={14} />
            Settings
          </button>
        </div>
      </div>
    </header>
  );
}
