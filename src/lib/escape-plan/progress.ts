/** Parse `YYYY-MM-DD` as UTC midnight. */
function utcDateFromYmd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number)
  return new Date(Date.UTC(y!, (m ?? 1) - 1, d ?? 1))
}

function utcTodayYmd(): string {
  const n = new Date()
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()))
    .toISOString()
    .slice(0, 10)
}

/** 1-based day within the 30-day arc; current week 1–4 from that arc. */
export function escapePlanProgressFromStart(startedOn: string): {
  dayInArc: number
  weekInArc: 1 | 2 | 3 | 4
  daysRemaining: number
  isPastArc: boolean
} {
  const start = utcDateFromYmd(startedOn)
  const today = utcDateFromYmd(utcTodayYmd())
  const diffMs = today.getTime() - start.getTime()
  const diffDays = Math.floor(diffMs / 86400000) + 1
  const dayInArc = Math.min(30, Math.max(1, diffDays))
  const weekInArc = Math.min(4, Math.max(1, Math.ceil(dayInArc / 7))) as 1 | 2 | 3 | 4
  const daysRemaining = Math.max(0, 30 - dayInArc)
  const isPastArc = diffDays > 30
  return { dayInArc, weekInArc, daysRemaining, isPastArc }
}

export function escapePlanCompletionRatio(
  tasks: { completed_at: string | null }[]
): number {
  if (tasks.length === 0) return 0
  const done = tasks.filter((t) => t.completed_at).length
  return done / tasks.length
}

/** 1-based day within the 90-day guided arc; calendar phase 1–6 (~15 days each). */
export function escapePlanGuidedCalendarProgress(startedOn: string): {
  dayInArc: number
  daysRemaining: number
  calendarPhase: 1 | 2 | 3 | 4 | 5 | 6
  isPastArc: boolean
} {
  const start = utcDateFromYmd(startedOn)
  const today = utcDateFromYmd(utcTodayYmd())
  const diffMs = today.getTime() - start.getTime()
  const diffDays = Math.floor(diffMs / 86400000) + 1
  const arc = 90
  const dayInArc = Math.min(arc, Math.max(1, diffDays))
  const daysRemaining = Math.max(0, arc - dayInArc)
  const calendarPhase = Math.min(6, Math.max(1, Math.ceil(dayInArc / 15))) as 1 | 2 | 3 | 4 | 5 | 6
  const isPastArc = diffDays > arc
  return { dayInArc, daysRemaining, calendarPhase, isPastArc }
}

/** First phase that still has incomplete tasks (work focus). */
export function escapePlanGuidedWorkPhase(
  tasks: { week_number: number; completed_at: string | null }[]
): 1 | 2 | 3 | 4 | 5 | 6 {
  for (let p = 1; p <= 6; p++) {
    const phaseTasks = tasks.filter((t) => t.week_number === p)
    if (phaseTasks.length === 0) continue
    if (!phaseTasks.every((t) => t.completed_at)) return p as 1 | 2 | 3 | 4 | 5 | 6
  }
  return 6
}
