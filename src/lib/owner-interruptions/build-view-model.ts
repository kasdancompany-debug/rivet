import type { OwnerInterruptionKind, Tables } from "@/types/database"

import { labelForOwnerInterruptionKind } from "@/lib/owner-interruptions/kinds"
import type {
  OwnerInterruptionPersonSlice,
  OwnerInterruptionRecentRow,
  OwnerInterruptionRepeatCategory,
  OwnerInterruptionRoleSlice,
  OwnerInterruptionTrendDay,
  OwnerInterruptionsDashboardView,
} from "@/lib/owner-interruptions/types"

type ProfileRow = Pick<Tables<"profiles">, "id" | "full_name" | "role">

function utcYmd(iso: string): string {
  const d = new Date(iso)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, "0")
  const day = String(d.getUTCDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function addDaysUtcYmd(ymd: string, delta: number): string {
  const [y, m, d] = ymd.split("-").map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + delta))
  const yy = dt.getUTCFullYear()
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0")
  const dd = String(dt.getUTCDate()).padStart(2, "0")
  return `${yy}-${mm}-${dd}`
}

function normalizeSummaryKey(summary: string): string {
  return summary.trim().toLowerCase().replace(/\s+/g, " ")
}

export function buildOwnerInterruptionsDashboardView(input: {
  weekStartIso: string
  /** Inclusive lower bound for trend + repeats (e.g. 14 or 30 days). */
  historySinceIso: string
  rowsSinceHistory: Tables<"owner_interruptions">[]
  profiles: ProfileRow[]
}): OwnerInterruptionsDashboardView {
  const { weekStartIso, historySinceIso, rowsSinceHistory, profiles } = input
  const profileById = new Map(profiles.map((p) => [p.id, p]))

  const weekMs = new Date(weekStartIso).getTime()
  const thisWeekRows = rowsSinceHistory.filter((r) => new Date(r.occurred_at).getTime() >= weekMs)
  const minutesThisWeek = thisWeekRows.reduce((s, r) => s + (r.estimated_minutes ?? 0), 0)

  const historyMs = new Date(historySinceIso).getTime()
  const historyRows = rowsSinceHistory.filter((r) => new Date(r.occurred_at).getTime() >= historyMs)

  const endYmd = utcYmd(new Date().toISOString())
  const startYmd = utcYmd(historySinceIso)
  const trendMap = new Map<string, { count: number; minutes: number }>()
  for (let ymd = startYmd; ymd <= endYmd; ymd = addDaysUtcYmd(ymd, 1)) {
    trendMap.set(ymd, { count: 0, minutes: 0 })
  }
  for (const r of historyRows) {
    const ymd = utcYmd(r.occurred_at)
    const cur = trendMap.get(ymd)
    if (!cur) continue
    cur.count += 1
    cur.minutes += r.estimated_minutes ?? 0
  }
  const trend14Days: OwnerInterruptionTrendDay[] = [...trendMap.entries()].map(([ymd, v]) => ({
    ymd,
    count: v.count,
    minutes: v.minutes,
  }))

  const kindMap = new Map<string, { count: number; minutes: number }>()
  for (const r of historyRows) {
    const k = r.kind
    const cur = kindMap.get(k) ?? { count: 0, minutes: 0 }
    cur.count += 1
    cur.minutes += r.estimated_minutes ?? 0
    kindMap.set(k, cur)
  }
  const byKind = [...kindMap.entries()]
    .map(([kind, v]) => ({
      kind: kind as OwnerInterruptionKind,
      label: labelForOwnerInterruptionKind(kind as OwnerInterruptionKind),
      count: v.count,
      minutes: v.minutes,
    }))
    .sort((a, b) => b.count - a.count)

  const roleMap = new Map<string, { count: number; minutes: number }>()
  const personMap = new Map<string, { count: number; minutes: number }>()
  for (const r of historyRows) {
    const p = profileById.get(r.logged_by)
    const roleLabel = (p?.role?.trim() || "Unknown role").slice(0, 80)
    const rcur = roleMap.get(roleLabel) ?? { count: 0, minutes: 0 }
    rcur.count += 1
    rcur.minutes += r.estimated_minutes ?? 0
    roleMap.set(roleLabel, rcur)

    const pcur = personMap.get(r.logged_by) ?? { count: 0, minutes: 0 }
    pcur.count += 1
    pcur.minutes += r.estimated_minutes ?? 0
    personMap.set(r.logged_by, pcur)
  }

  const byRole: OwnerInterruptionRoleSlice[] = [...roleMap.entries()]
    .map(([role, v]) => ({ role, count: v.count, minutes: v.minutes }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  const topPeople: OwnerInterruptionPersonSlice[] = [...personMap.entries()]
    .map(([id, v]) => {
      const prof = profileById.get(id)
      return {
        profileId: id,
        name: prof?.full_name?.trim() || "Someone on the team",
        role: prof?.role?.trim() || "Unknown role",
        count: v.count,
        minutes: v.minutes,
      }
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  const summaryKeyToLabel = new Map<string, string>()
  const summaryCounts = new Map<string, number>()
  for (const r of historyRows) {
    const key = normalizeSummaryKey(r.summary)
    if (!key) continue
    if (!summaryKeyToLabel.has(key)) summaryKeyToLabel.set(key, r.summary.trim().slice(0, 120))
    summaryCounts.set(key, (summaryCounts.get(key) ?? 0) + 1)
  }
  const repeatCategories: OwnerInterruptionRepeatCategory[] = [...summaryCounts.entries()]
    .filter(([, n]) => n >= 2)
    .map(([key, count]) => ({ key, label: summaryKeyToLabel.get(key) ?? key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12)

  const recent: OwnerInterruptionRecentRow[] = [...historyRows]
    .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())
    .slice(0, 20)
    .map((r) => {
      const prof = profileById.get(r.logged_by)
      return {
        id: r.id,
        kind: r.kind,
        kindLabel: labelForOwnerInterruptionKind(r.kind),
        summary: r.summary,
        estimatedMinutes: r.estimated_minutes ?? 0,
        occurredAt: r.occurred_at,
        loggerName: prof?.full_name?.trim() || "Team member",
        loggerRole: prof?.role?.trim() || "",
      }
    })

  return {
    weekStartIso,
    interruptionsThisWeek: thisWeekRows.length,
    minutesThisWeek,
    estimatedOwnerHoursThisWeek: Math.round((minutesThisWeek / 60) * 10) / 10,
    trend14Days,
    byKind,
    byRole,
    topPeople,
    repeatCategories,
    recent,
  }
}
