import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { BugReport } from '@/types'

interface HistoryStore {
  reports: BugReport[]
  addReport: (report: BugReport) => void
  updateReport: (id: string, partial: Partial<BugReport>) => void
  removeReport: (id: string) => void
  getReport: (id: string) => BugReport | undefined
  clearAll: () => void
}

export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set, get) => ({
      reports: [],

      addReport: (report) =>
        set((s) => ({ reports: [report, ...s.reports] })),

      updateReport: (id, partial) =>
        set((s) => ({
          reports: s.reports.map((r) => (r.id === id ? { ...r, ...partial } : r)),
        })),

      removeReport: (id) =>
        set((s) => ({ reports: s.reports.filter((r) => r.id !== id) })),

      getReport: (id) => get().reports.find((r) => r.id === id),

      clearAll: () => set({ reports: [] }),
    }),
    {
      name: 'buglens-history',
      version: 1,
    }
  )
)
