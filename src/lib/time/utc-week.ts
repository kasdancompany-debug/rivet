/** ISO timestamp for Monday 00:00:00 UTC of the week containing `now`. */
export function utcMondayStartIso(now = new Date()): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const wd = d.getUTCDay()
  const offset = wd === 0 ? -6 : 1 - wd
  d.setUTCDate(d.getUTCDate() + offset)
  d.setUTCHours(0, 0, 0, 0)
  return d.toISOString()
}

/** ISO timestamp at UTC midnight, `days` before today. */
export function utcDaysAgoMidnightIso(days: number, now = new Date()): string {
  const d = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - days, 0, 0, 0, 0)
  )
  return d.toISOString()
}
