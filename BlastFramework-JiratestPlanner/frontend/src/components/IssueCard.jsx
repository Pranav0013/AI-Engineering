import { ExternalLink, Tag, User, AlertCircle } from 'lucide-react';

const PRIORITY_COLORS = {
  Highest: '#f85149',
  High: '#f85149',
  Medium: '#d29922',
  Low: '#3fb950',
  Lowest: '#3fb950',
};

const STATUS_COLORS = {
  'To Do': '#8b949e',
  'In Progress': '#58a6ff',
  Testing: '#bc8cff',
  Done: '#3fb950',
  Closed: '#3fb950',
};

function Badge({ text, color }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 500,
        background: `${color}18`,
        color: color,
        border: `1px solid ${color}30`,
      }}
    >
      {text}
    </span>
  );
}

export default function IssueCard({ issue }) {
  if (!issue) return null;

  const priorityColor = PRIORITY_COLORS[issue.priority] || '#8b949e';
  const statusColor = STATUS_COLORS[issue.status] || '#8b949e';

  return (
    <div
      className="animate-fade-in-up"
      style={{
        background: '#161b22',
        border: '1px solid #30363d',
        borderRadius: 10,
        padding: 20,
        marginBottom: 20,
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <a
              href={issue.webUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 12, fontWeight: 600, color: '#58a6ff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'JetBrains Mono, monospace' }}
              onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
              onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
            >
              {issue.key}
              <ExternalLink size={11} />
            </a>
            <Badge text={issue.issueType} color="#8b949e" />
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e6edf3', lineHeight: 1.4 }}>
            {issue.summary}
          </h3>
        </div>
      </div>

      {/* Badges row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        <Badge text={issue.status} color={statusColor} />
        <Badge text={`P: ${issue.priority}`} color={priorityColor} />
        {issue.labels.map((l) => (
          <Badge key={l} text={l} color="#76e3ea" />
        ))}
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#8b949e' }}>
          <User size={12} />
          <span style={{ color: '#484f58' }}>Assignee:</span> {issue.assignee}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#8b949e' }}>
          <AlertCircle size={12} />
          <span style={{ color: '#484f58' }}>Reporter:</span> {issue.reporter}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#8b949e' }}>
          <Tag size={12} />
          <span style={{ color: '#484f58' }}>Project:</span> {issue.project}
        </div>
      </div>

      {/* Description preview */}
      {issue.description && issue.description !== 'No description provided.' && (
        <div
          style={{
            marginTop: 14,
            paddingTop: 14,
            borderTop: '1px solid #21262d',
            fontSize: 12,
            color: '#8b949e',
            lineHeight: 1.6,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {issue.description}
        </div>
      )}
    </div>
  );
}
