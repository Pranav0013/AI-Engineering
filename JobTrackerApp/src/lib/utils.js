export const STATUSES = [
  { id: 'wishlist', label: 'Wishlist', color: 'wishlist' },
  { id: 'applied', label: 'Applied', color: 'applied' },
  { id: 'followup', label: 'Follow-up', color: 'followup' },
  { id: 'interview', label: 'Interview', color: 'interview' },
  { id: 'offer', label: 'Offer', color: 'offer' },
  { id: 'rejected', label: 'Rejected', color: 'rejected' },
]

export const BORDER_COLOR = {
  wishlist: 'border-l-wishlist',
  applied: 'border-l-applied',
  followup: 'border-l-followup',
  interview: 'border-l-interview',
  offer: 'border-l-offer',
  rejected: 'border-l-rejected',
}

export function todayISODate() {
  return new Date().toISOString().slice(0, 10)
}

export function nowISO() {
  return new Date().toISOString()
}

export function daysSince(dateString) {
  if (!dateString) return null
  const then = new Date(dateString)
  if (Number.isNaN(then.getTime())) return null
  const start = new Date(then.getFullYear(), then.getMonth(), then.getDate())
  const end = new Date()
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate())
  const diffMs = endDay.getTime() - start.getTime()
  return Math.round(diffMs / (1000 * 60 * 60 * 24))
}

export function sortJobsByDate(jobs, order) {
  const sorted = [...jobs].sort((a, b) => {
    const dateA = a.dateApplied || ''
    const dateB = b.dateApplied || ''
    return dateA < dateB ? -1 : dateA > dateB ? 1 : 0
  })
  return order === 'oldest' ? sorted : sorted.reverse()
}

export function matchesSearch(job, query) {
  if (!query.trim()) return true
  const q = query.trim().toLowerCase()
  return (
    job.company.toLowerCase().includes(q) || job.role.toLowerCase().includes(q)
  )
}
