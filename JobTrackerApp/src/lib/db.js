import { openDB } from 'idb'

const DB_NAME = 'job-tracker-db'
const DB_VERSION = 1
const JOBS_STORE = 'jobs'
const SETTINGS_STORE = 'settings'
const SETTINGS_ID = 'app'

const DEFAULT_SETTINGS = {
  id: SETTINGS_ID,
  theme: 'light',
  resumeOptions: [],
  groqApiKey: '',
}

let dbPromise = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(JOBS_STORE)) {
          db.createObjectStore(JOBS_STORE, { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
          db.createObjectStore(SETTINGS_STORE, { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

export async function getAllJobs() {
  const db = await getDB()
  return db.getAll(JOBS_STORE)
}

export async function addJob(job) {
  const db = await getDB()
  await db.add(JOBS_STORE, job)
}

export async function updateJob(job) {
  const db = await getDB()
  await db.put(JOBS_STORE, job)
}

export async function deleteJob(id) {
  const db = await getDB()
  await db.delete(JOBS_STORE, id)
}

export async function getSettings() {
  const db = await getDB()
  const settings = await db.get(SETTINGS_STORE, SETTINGS_ID)
  return settings ? { ...DEFAULT_SETTINGS, ...settings } : DEFAULT_SETTINGS
}

export async function saveSettings(settings) {
  const db = await getDB()
  await db.put(SETTINGS_STORE, { ...settings, id: SETTINGS_ID })
}

export async function exportAllData() {
  const [jobs, settings] = await Promise.all([getAllJobs(), getSettings()])
  return {
    exportedAt: new Date().toISOString(),
    jobs,
    settings: { theme: settings.theme, resumeOptions: settings.resumeOptions },
  }
}

export async function importAllData(payload) {
  const db = await getDB()
  const tx = db.transaction([JOBS_STORE, SETTINGS_STORE], 'readwrite')

  const jobsStore = tx.objectStore(JOBS_STORE)
  await jobsStore.clear()
  for (const job of payload.jobs || []) {
    await jobsStore.put(job)
  }

  if (payload.settings) {
    const settingsStore = tx.objectStore(SETTINGS_STORE)
    const current = (await settingsStore.get(SETTINGS_ID)) || DEFAULT_SETTINGS
    await settingsStore.put({ ...current, ...payload.settings, id: SETTINGS_ID })
  }

  await tx.done
}
