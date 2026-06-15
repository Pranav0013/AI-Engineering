import { useState } from 'react'
import { CloseIcon, EyeIcon, EyeOffIcon } from './icons'

const inputClass =
  'w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-applied/50 focus:border-applied'

export default function SettingsModal({ apiKey, onSave, onClose }) {
  const [value, setValue] = useState(apiKey || '')
  const [visible, setVisible] = useState(false)

  function handleSave() {
    onSave(value.trim())
    onClose()
  }

  function handleClear() {
    setValue('')
    onSave('')
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl shadow-slate-900/20 ring-1 ring-black/5 animate-pop"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              GROQ API key (optional)
            </label>
            <div className="relative">
              <input
                type={visible ? 'text' : 'password'}
                className={`${inputClass} pr-9`}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="gsk_..."
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title={visible ? 'Hide key' : 'Show key'}
              >
                {visible ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Used only by the JD Summarizer for AI-enhanced results. Stored locally in your
            browser (IndexedDB) and sent directly to GROQ's API — never anywhere else, and
            never included in exported JSON. Leave blank to use local-only analysis.
          </p>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={handleClear}
            className="px-3 py-1.5 text-sm rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-3 py-1.5 text-sm rounded-md text-white gradient-brand hover:brightness-110 shadow-sm shadow-brand/30 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
