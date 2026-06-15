import { useState } from 'react'
import { STATUSES, todayISODate } from '../lib/utils'
import { CloseIcon } from './icons'

const emptyForm = {
  company: '',
  role: '',
  jobUrl: '',
  resume: '',
  dateApplied: todayISODate(),
  salaryRange: '',
  notes: '',
  status: 'wishlist',
  jobDescription: '',
}

const inputClass =
  'w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-applied/50 focus:border-applied'

const labelClass = 'block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1'

export default function JobModal({ job, resumeOptions, onSave, onClose }) {
  const [form, setForm] = useState(job ? { ...emptyForm, ...job } : emptyForm)
  const [errors, setErrors] = useState({})

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const nextErrors = {}
    if (!form.company.trim()) nextErrors.company = 'Company is required'
    if (!form.role.trim()) nextErrors.role = 'Role is required'
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }
    onSave({ ...form, company: form.company.trim(), role: form.role.trim() })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl shadow-slate-900/20 ring-1 ring-black/5 animate-pop max-h-[90vh] overflow-y-auto scroll-thin"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {job ? 'Edit Job' : 'Add Job'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>

        <div className="px-6 py-4 grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className={labelClass}>Company *</label>
            <input
              className={inputClass}
              value={form.company}
              onChange={(e) => update('company', e.target.value)}
              placeholder="Acme Corp"
              autoFocus
            />
            {errors.company && <p className="mt-1 text-xs text-rejected">{errors.company}</p>}
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className={labelClass}>Role *</label>
            <input
              className={inputClass}
              value={form.role}
              onChange={(e) => update('role', e.target.value)}
              placeholder="Senior SDE"
            />
            {errors.role && <p className="mt-1 text-xs text-rejected">{errors.role}</p>}
          </div>

          <div className="col-span-2">
            <label className={labelClass}>LinkedIn / Job URL</label>
            <input
              type="url"
              className={inputClass}
              value={form.jobUrl}
              onChange={(e) => update('jobUrl', e.target.value)}
              placeholder="https://www.linkedin.com/jobs/view/..."
            />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className={labelClass}>Resume used</label>
            <input
              className={inputClass}
              list="resume-options"
              value={form.resume}
              onChange={(e) => update('resume', e.target.value)}
              placeholder="SDE_Resume_v3"
            />
            <datalist id="resume-options">
              {resumeOptions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className={labelClass}>Date applied</label>
            <input
              type="date"
              className={inputClass}
              value={form.dateApplied}
              onChange={(e) => update('dateApplied', e.target.value)}
            />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className={labelClass}>Salary range</label>
            <input
              className={inputClass}
              value={form.salaryRange}
              onChange={(e) => update('salaryRange', e.target.value)}
              placeholder="$150-180K"
            />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className={labelClass}>Status</label>
            <select
              className={inputClass}
              value={form.status}
              onChange={(e) => update('status', e.target.value)}
            >
              {STATUSES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-2">
            <label className={labelClass}>Notes</label>
            <textarea
              className={`${inputClass} min-h-20 resize-y`}
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              placeholder="Recruiter name, referral info, etc."
            />
          </div>

          <div className="col-span-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
              AI Interview Prep (optional)
            </p>
          </div>

          <div className="col-span-2">
            <label className={labelClass}>Job description</label>
            <textarea
              className={`${inputClass} min-h-24 resize-y`}
              value={form.jobDescription}
              onChange={(e) => update('jobDescription', e.target.value)}
              placeholder="Paste the job description here to enable the AI Interview Question Generator..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-3 py-1.5 text-sm rounded-md text-white gradient-brand hover:brightness-110 shadow-sm shadow-brand/30 transition-colors"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  )
}
