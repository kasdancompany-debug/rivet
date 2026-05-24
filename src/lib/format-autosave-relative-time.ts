/** "Saved 8 seconds ago" — for capture form autosave footer. */
export function formatAutosaveRelativeTime(savedAtMs: number, now = Date.now()): string {
  const diffSec = Math.floor(Math.max(0, now - savedAtMs) / 1000)

  if (diffSec < 8) return "Saved just now"
  if (diffSec < 60) return `Saved ${diffSec} seconds ago`

  const diffMin = Math.floor(diffSec / 60)
  if (diffMin === 1) return "Saved 1 minute ago"
  if (diffMin < 60) return `Saved ${diffMin} minutes ago`

  const diffHours = Math.floor(diffSec / 3600)
  if (diffHours === 1) return "Saved 1 hour ago"
  if (diffHours < 24) return `Saved ${diffHours} hours ago`

  return `Saved ${new Date(savedAtMs).toLocaleTimeString(undefined, { timeStyle: "short" })}`
}
