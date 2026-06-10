import { AgentStep, MediaType } from '@/types'

export const AGENT_STEPS: Omit<AgentStep, 'status'>[] = [
  {
    name: 'observation',
    label: 'Observation Agent',
    description: 'Scanning visual elements, UI state, and extracting error messages verbatim',
  },
  {
    name: 'classification',
    label: 'Classification Agent',
    description: 'Classifying bug type, affected component, severity, and confidence score',
  },
  {
    name: 'root_cause',
    label: 'Root Cause Agent',
    description: 'Identifying root cause hypothesis, evidence, and technical details',
  },
  {
    name: 'bug_report',
    label: 'Bug Report Writer',
    description: 'Composing structured bug report with steps to reproduce and fix suggestions',
  },
]

export const MEDIA_TYPE_CONFIG: Record<
  MediaType,
  {
    label: string
    description: string
    accept: Record<string, string[]>
    maxSize: number
    icon: string
    color: string
    gradient: string
  }
> = {
  screenshot: {
    label: 'Screenshot',
    description: 'PNG, JPG, or WebP image of the bug',
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif'] },
    maxSize: 10 * 1024 * 1024, // 10MB
    icon: 'Image',
    color: 'text-blue-400',
    gradient: 'from-blue-500/20 to-cyan-500/20',
  },
  video: {
    label: 'Screen Recording',
    description: 'MP4, WebM, or MOV video of the issue',
    accept: { 'video/*': ['.mp4', '.webm', '.mov', '.avi'] },
    maxSize: 100 * 1024 * 1024, // 100MB
    icon: 'Video',
    color: 'text-purple-400',
    gradient: 'from-purple-500/20 to-pink-500/20',
  },
  playwright_trace: {
    label: 'Playwright Trace',
    description: 'ZIP trace file from Playwright test runner',
    accept: { 'application/zip': ['.zip'], 'application/x-zip-compressed': ['.zip'] },
    maxSize: 20 * 1024 * 1024, // 20MB
    icon: 'FlaskConical',
    color: 'text-green-400',
    gradient: 'from-green-500/20 to-emerald-500/20',
  },
  console_log: {
    label: 'Console / Error Log',
    description: 'TXT or JSON log file from browser or server',
    accept: {
      'text/plain': ['.txt', '.log'],
      'application/json': ['.json'],
      'text/csv': ['.csv'],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    icon: 'Terminal',
    color: 'text-orange-400',
    gradient: 'from-orange-500/20 to-red-500/20',
  },
}

export const SEVERITY_CONFIG = {
  critical: {
    label: 'Critical',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    dot: 'bg-red-400',
    badge: 'bg-red-500/15 text-red-300 border-red-500/25',
    jiraPriority: 'Highest',
  },
  high: {
    label: 'High',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    dot: 'bg-orange-400',
    badge: 'bg-orange-500/15 text-orange-300 border-orange-500/25',
    jiraPriority: 'High',
  },
  medium: {
    label: 'Medium',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    dot: 'bg-yellow-400',
    badge: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/25',
    jiraPriority: 'Medium',
  },
  low: {
    label: 'Low',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    dot: 'bg-green-400',
    badge: 'bg-green-500/15 text-green-300 border-green-500/25',
    jiraPriority: 'Low',
  },
} as const

export const MAX_VIDEO_FRAMES = 5
export const FRAME_SIZE = 768
export const FRAME_QUALITY = 0.72
