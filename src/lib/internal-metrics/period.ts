/** Inclusive UTC calendar-day range (`YYYY-MM-DD`). */
export type MetricsDateRange = {
  start: string
  end: string
}

export function utcYmd(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function addUtcDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number)
  const dt = new Date(Date.UTC(y!, m! - 1, d! + days))
  return utcYmd(dt)
}

export function isoDateInRange(isoTimestamp: string, range: MetricsDateRange): boolean {
  const day = isoTimestamp.slice(0, 10)
  return day >= range.start && day <= range.end
}

export function defaultCaseStudyPeriods(asOf: Date = new Date()): {
  baseline: MetricsDateRange
  current: MetricsDateRange
} {
  const end = utcYmd(asOf)
  const currentStart = addUtcDays(end, -13)
  const baselineEnd = addUtcDays(currentStart, -1)
  const baselineStart = addUtcDays(baselineEnd, -13)
  return {
    baseline: { start: baselineStart, end: baselineEnd },
    current: { start: currentStart, end },
  }
}

export function parseMetricsDateRange(
  value: string | undefined,
  fallback: MetricsDateRange
): MetricsDateRange {
  if (!value?.trim()) return fallback
  const [start, end] = value.split("_")
  if (!start || !end || !/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
    return fallback
  }
  if (start > end) return fallback
  return { start, end }
}

export function parseCaseStudyPeriodsFromSearchParams(
  params: Record<string, string | string[] | undefined>
): { baseline: MetricsDateRange; current: MetricsDateRange } {
  const defaults = defaultCaseStudyPeriods()
  const baseline = parseMetricsDateRange(
    typeof params.baseline === "string" ? params.baseline : undefined,
    defaults.baseline
  )
  const current = parseMetricsDateRange(
    typeof params.current === "string" ? params.current : undefined,
    defaults.current
  )
  return { baseline, current }
}

export function formatMetricsRange(range: MetricsDateRange): string {
  return `${range.start} → ${range.end}`
}

export function rangeToQueryValue(range: MetricsDateRange): string {
  return `${range.start}_${range.end}`
}

export type PilotWindowDays = 7 | 30

/** Inclusive UTC window ending on `asOf` (default today). */
export function rollingWindowRange(days: number, asOf: Date = new Date()): MetricsDateRange {
  const end = utcYmd(asOf)
  const start = addUtcDays(end, -(days - 1))
  return { start, end }
}

/** Current window vs immediately prior window of equal length (for pilot trends). */
export function pilotComparisonPeriods(
  windowDays: PilotWindowDays,
  asOf: Date = new Date()
): {
  baseline: MetricsDateRange
  current: MetricsDateRange
  windowDays: PilotWindowDays
} {
  const current = rollingWindowRange(windowDays, asOf)
  const priorEnd = addUtcDays(current.start, -1)
  const priorStart = addUtcDays(priorEnd, -(windowDays - 1))
  return {
    baseline: { start: priorStart, end: priorEnd },
    current,
    windowDays,
  }
}

export function parsePilotWindowFromSearchParams(
  params: Record<string, string | string[] | undefined>
): PilotWindowDays {
  const raw = typeof params.window === "string" ? params.window : undefined
  return raw === "30" ? 30 : 7
}

export function eachUtcDayInRange(range: MetricsDateRange): string[] {
  const days: string[] = []
  let cursor = range.start
  while (cursor <= range.end) {
    days.push(cursor)
    cursor = addUtcDays(cursor, 1)
  }
  return days
}
