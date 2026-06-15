import { useEffect, useMemo, useState } from 'react'
import Header from './components/Header'
import Board from './components/Board'
import JobModal from './components/JobModal'
import ConfirmDialog from './components/ConfirmDialog'
import SummarizerModal from './components/SummarizerModal'
import SettingsModal from './components/SettingsModal'
import InterviewPrepModal from './components/InterviewPrepModal'
import ReminderModal from './components/ReminderModal'
import ReminderCenter from './components/ReminderCenter'
import * as db from './lib/db'
import { STATUSES, matchesSearch, nowISO, sortJobsByDate } from './lib/utils'
import { appendAutoReminder, summarizeReminders } from './lib/reminders'

export default function App() {
  const [jobs, setJobs] = useState([])
  const [settings, setSettings] = useState({ theme: 'light', resumeOptions: [] })
  const [loaded, setLoaded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState('newest')
  const [modal, setModal] = useState(null) // { mode: 'add' | 'edit', job: JobCard | null }
  const [confirmDelete, setConfirmDelete] = useState(null) // JobCard | null
  const [importState, setImportState] = useState(null) // { payload } | null
  const [summarizerOpen, setSummarizerOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [interviewPrepJob, setInterviewPrepJob] = useState(null) // JobCard | null
  const [reminderModal, setReminderModal] = useState(null) // { job, editReminderId? } | null
  const [reminderCenterOpen, setReminderCenterOpen] = useState(false)

  // Initial load
  useEffect(() => {
    Promise.all([db.getAllJobs(), db.getSettings()]).then(([allJobs, savedSettings]) => {
      setJobs(allJobs)
      setSettings(savedSettings)
      setLoaded(true)
    })
  }, [])

  // Apply theme to <html> for Tailwind's dark: variant
  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.theme === 'dark')
  }, [settings.theme])

  const reminderSummary = useMemo(() => summarizeReminders(jobs), [jobs])

  const jobsByStatus = useMemo(() => {
    const filtered = jobs.filter((job) => matchesSearch(job, searchQuery))
    const grouped = {}
    for (const status of STATUSES) {
      const inColumn = filtered.filter((job) => job.status === status.id)
      grouped[status.id] = sortJobsByDate(inColumn, sortOrder)
    }
    return grouped
  }, [jobs, searchQuery, sortOrder])

  function handleAddJob() {
    setModal({ mode: 'add', job: null })
  }

  function handleEditJob(job) {
    setModal({ mode: 'edit', job })
  }

  async function handleSaveJob(form) {
    const now = nowISO()

    if (modal.mode === 'add') {
      const newJob = { ...form, id: crypto.randomUUID(), createdAt: now, updatedAt: now, reminders: [] }
      newJob.reminders = appendAutoReminder(newJob)
      await db.addJob(newJob)
      setJobs((prev) => [...prev, newJob])
    } else {
      const updated = { ...modal.job, ...form, updatedAt: now }
      // If the status changed via the edit form, seed the matching auto reminder.
      if (form.status !== modal.job.status) {
        updated.reminders = appendAutoReminder(updated)
      }
      await db.updateJob(updated)
      setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)))
    }

    if (form.resume && !settings.resumeOptions.includes(form.resume)) {
      const nextSettings = { ...settings, resumeOptions: [...settings.resumeOptions, form.resume] }
      setSettings(nextSettings)
      await db.saveSettings(nextSettings)
    }

    setModal(null)
  }

  function handleDeleteRequest(job) {
    setConfirmDelete(job)
  }

  async function handleConfirmDelete() {
    await db.deleteJob(confirmDelete.id)
    setJobs((prev) => prev.filter((j) => j.id !== confirmDelete.id))
    setConfirmDelete(null)
  }

  async function handleDragEnd(event) {
    const { active, over } = event
    if (!over) return

    const job = jobs.find((j) => j.id === active.id)
    if (!job) return

    const overJob = jobs.find((j) => j.id === over.id)
    const targetStatus = overJob ? overJob.status : over.id

    if (!STATUSES.some((s) => s.id === targetStatus) || targetStatus === job.status) return

    const updated = { ...job, status: targetStatus, updatedAt: nowISO() }
    updated.reminders = appendAutoReminder(updated)
    setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)))
    await db.updateJob(updated)
  }

  function handleToggleSort() {
    setSortOrder((prev) => (prev === 'newest' ? 'oldest' : 'newest'))
  }

  async function handleToggleTheme() {
    const nextSettings = { ...settings, theme: settings.theme === 'dark' ? 'light' : 'dark' }
    setSettings(nextSettings)
    await db.saveSettings(nextSettings)
  }

  async function handleSaveInterviewPrep(updatedJob) {
    await db.updateJob(updatedJob)
    setJobs((prev) => prev.map((j) => (j.id === updatedJob.id ? updatedJob : j)))
    setInterviewPrepJob(updatedJob)
  }

  async function handleUpdateJobReminders(jobId, reminders) {
    const job = jobs.find((j) => j.id === jobId)
    if (!job) return
    const updated = { ...job, reminders, updatedAt: nowISO() }
    setJobs((prev) => prev.map((j) => (j.id === jobId ? updated : j)))
    setReminderModal((m) => (m && m.job.id === jobId ? { ...m, job: updated } : m))
    await db.updateJob(updated)
  }

  async function handleSaveApiKey(groqApiKey) {
    const nextSettings = { ...settings, groqApiKey }
    setSettings(nextSettings)
    await db.saveSettings(nextSettings)
  }

  async function handleExport() {
    const payload = await db.exportAllData()
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `job-tracker-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImportFile(file) {
    const text = await file.text()
    try {
      const payload = JSON.parse(text)
      setImportState({ payload })
    } catch {
      window.alert('That file is not valid JSON.')
    }
  }

  async function handleConfirmImport() {
    const { payload } = importState
    await db.importAllData(payload)
    const [allJobs, savedSettings] = await Promise.all([db.getAllJobs(), db.getSettings()])
    setJobs(allJobs)
    setSettings(savedSettings)
    setImportState(null)
  }

  if (!loaded) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400 text-sm">
        Loading...
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortOrder={sortOrder}
        onToggleSort={handleToggleSort}
        theme={settings.theme}
        onToggleTheme={handleToggleTheme}
        onAddJob={handleAddJob}
        onExport={handleExport}
        onImportFile={handleImportFile}
        onSummarizeJD={() => setSummarizerOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenReminders={() => setReminderCenterOpen(true)}
        reminderOverdue={reminderSummary.overdue}
        reminderDueToday={reminderSummary.dueToday}
      />

      <main className="flex-1 overflow-hidden px-4 sm:px-6 py-5 flex">
        <Board
          jobsByStatus={jobsByStatus}
          onDragEnd={handleDragEnd}
          onEdit={handleEditJob}
          onDelete={handleDeleteRequest}
          onOpenInterviewPrep={setInterviewPrepJob}
          onOpenReminders={(job) => setReminderModal({ job })}
        />
      </main>

      {modal && (
        <JobModal
          job={modal.job}
          resumeOptions={settings.resumeOptions}
          onSave={handleSaveJob}
          onClose={() => setModal(null)}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete job application?"
          message={`This will permanently remove "${confirmDelete.company} — ${confirmDelete.role}". This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {importState && (
        <ConfirmDialog
          title="Import data?"
          message={`This will replace your current ${jobs.length} job${jobs.length === 1 ? '' : 's'} with ${importState.payload.jobs?.length ?? 0} job${(importState.payload.jobs?.length ?? 0) === 1 ? '' : 's'} from the selected file. This cannot be undone.`}
          confirmLabel="Import"
          danger
          onConfirm={handleConfirmImport}
          onCancel={() => setImportState(null)}
        />
      )}

      {summarizerOpen && (
        <SummarizerModal
          apiKey={settings.groqApiKey}
          onClose={() => setSummarizerOpen(false)}
        />
      )}

      {settingsOpen && (
        <SettingsModal
          apiKey={settings.groqApiKey}
          onSave={handleSaveApiKey}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {interviewPrepJob && (
        <InterviewPrepModal
          job={interviewPrepJob}
          apiKey={settings.groqApiKey}
          onSave={handleSaveInterviewPrep}
          onEditJob={handleEditJob}
          onOpenSettings={() => {
            setInterviewPrepJob(null)
            setSettingsOpen(true)
          }}
          onClose={() => setInterviewPrepJob(null)}
        />
      )}

      {reminderModal && (
        <ReminderModal
          job={reminderModal.job}
          initialEditId={reminderModal.editReminderId}
          onUpdateReminders={(reminders) => handleUpdateJobReminders(reminderModal.job.id, reminders)}
          onClose={() => setReminderModal(null)}
        />
      )}

      {reminderCenterOpen && (
        <ReminderCenter
          jobs={jobs}
          onUpdateJobReminders={handleUpdateJobReminders}
          onEditReminder={(job, reminderId) => {
            setReminderCenterOpen(false)
            setReminderModal({ job, editReminderId: reminderId })
          }}
          onClose={() => setReminderCenterOpen(false)}
        />
      )}
    </div>
  )
}
