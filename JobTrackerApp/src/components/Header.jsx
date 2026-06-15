import { useRef } from 'react'
import {
  BellIcon,
  BriefcaseIcon,
  DownloadIcon,
  MoonIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  SortIcon,
  SparklesIcon,
  SunIcon,
  UploadIcon,
} from './icons'

const groupButtonClass =
  'inline-flex items-center justify-center size-9 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-brand dark:hover:text-brand-accent hover:shadow-sm active:scale-90 cursor-pointer transition-all duration-150'

const dividerClass = 'w-px h-5 bg-slate-200/80 dark:bg-slate-700/80 mx-1'

export default function Header({
  searchQuery,
  onSearchChange,
  sortOrder,
  onToggleSort,
  theme,
  onToggleTheme,
  onAddJob,
  onExport,
  onImportFile,
  onSummarizeJD,
  onOpenSettings,
  onOpenReminders,
  reminderOverdue = 0,
  reminderDueToday = 0,
}) {
  const fileInputRef = useRef(null)
  const reminderBadge = reminderOverdue > 0 ? reminderOverdue : reminderDueToday > 0 ? reminderDueToday : 0
  const reminderBadgeColor = reminderOverdue > 0 ? 'bg-rejected' : 'bg-followup'

  return (
    <header className="glass sticky top-0 z-40 flex flex-wrap items-center gap-3 px-4 sm:px-6 py-3 border-b border-slate-200/70 dark:border-white/5">
      <div className="flex items-center gap-2.5 mr-auto">
        <div className="size-9 rounded-xl gradient-brand flex items-center justify-center shadow-lg shadow-brand/30 ring-1 ring-white/20">
          <BriefcaseIcon className="size-5 text-white" strokeWidth={2} />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Job<span className="gradient-text">Tracker</span>
        </h1>
      </div>

      <div className="relative group">
        <SearchIcon className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand transition-colors" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search company or role..."
          className="w-48 sm:w-64 rounded-xl border border-slate-300/70 dark:border-slate-700/70 bg-white/80 dark:bg-slate-800/60 pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-all"
        />
      </div>

      <div className="flex items-center gap-0.5 rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-white/50 dark:bg-slate-900/40 p-1 shadow-sm">
        <button
          type="button"
          onClick={onOpenReminders}
          className={`${groupButtonClass} relative`}
          title="Reminder Center"
          aria-label={`Open reminder center${reminderBadge ? ` (${reminderBadge} need attention)` : ''}`}
        >
          <BellIcon className="size-4" />
          {reminderBadge > 0 && (
            <span className={`absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 rounded-full ${reminderBadgeColor} text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-950 shadow-sm`}>
              {reminderBadge > 9 ? '9+' : reminderBadge}
            </span>
          )}
        </button>

        <div className={dividerClass} />

        <button
          type="button"
          onClick={onSummarizeJD}
          className={groupButtonClass}
          title="AI: Summarize a job description"
          aria-label="Summarize job description with AI"
        >
          <SparklesIcon className="size-4" />
        </button>

        <button
          type="button"
          onClick={onToggleSort}
          className={groupButtonClass}
          title={`Sort by date applied: ${sortOrder === 'newest' ? 'Newest first (click for oldest first)' : 'Oldest first (click for newest first)'}`}
          aria-label="Toggle sort order"
        >
          <SortIcon className="size-4" />
        </button>

        <button
          type="button"
          onClick={onToggleTheme}
          className={groupButtonClass}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle light/dark theme"
        >
          {theme === 'dark' ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
        </button>

        <div className={dividerClass} />

        <button
          type="button"
          onClick={onExport}
          className={groupButtonClass}
          title="Export all data as a JSON file"
          aria-label="Export data as JSON"
        >
          <DownloadIcon className="size-4" />
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={groupButtonClass}
          title="Import data from a JSON file"
          aria-label="Import data from JSON"
        >
          <UploadIcon className="size-4" />
        </button>

        <div className={dividerClass} />

        <button
          type="button"
          onClick={onOpenSettings}
          className={groupButtonClass}
          title="Settings"
          aria-label="Open settings"
        >
          <SettingsIcon className="size-4" />
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onImportFile(file)
          e.target.value = ''
        }}
      />

      <button
        type="button"
        onClick={onAddJob}
        className="inline-flex items-center gap-1.5 rounded-xl gradient-brand text-white text-sm font-semibold px-4 py-2 cursor-pointer active:scale-95 shadow-lg shadow-brand/30 hover:shadow-xl hover:shadow-brand/40 hover:brightness-110 transition-all duration-150"
      >
        <PlusIcon className="size-4" strokeWidth={2.4} />
        Add Job
      </button>
    </header>
  )
}
