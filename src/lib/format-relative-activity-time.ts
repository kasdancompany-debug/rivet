const MINUTE_MS = 60_000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

/** Compact relative labels for activity feeds: "2h ago", "yesterday", "3 days ago". */
export function formatRelativeActivityTime(iso: string, now = Date.now()): string {
  const at = new Date(iso).getTime()
  if (Number.isNaN(at)) return "recently"

  const diffMs = Math.max(0, now - at)
  const diffMinutes = Math.floor(diffMs / MINUTE_MS)

  if (diffMinutes < 1) return "just now"
  if (diffMinutes < 60) return `${diffMinutes}m ago`

  const diffHours = Math.floor(diffMs / HOUR_MS)
  if (diffHours < 24) return `${diffHours}h ago`

  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const startOfYesterday = new Date(startOfToday.getTime() - DAY_MS)
  const startOfEventDay = new Date(at)
  startOfEventDay.setHours(0, 0, 0, 0)

  if (startOfEventDay.getTime() === startOfYesterday.getTime()) return "yesterday"

  const diffDays = Math.floor(diffMs / DAY_MS)
  if (diffDays === 1) return "1 day ago"
  if (diffDays < 7) return `${diffDays} days ago`

  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })
}

export function daysSinceActivity(iso: string, now = Date.now()): number {
  const at = new Date(iso).getTime()
  if (Number.isNaN(at)) return 0
  return Math.floor(Math.max(0, now - at) / DAY_MS)
}
