import type {
  DailyRunItemWithLine,
  DailyChecklistWithItems,
} from "@/lib/db/queries"
import {
  fetchDailyRunItemsWithLines,
  fetchOldestDailyChecklistWithItemsByType,
  listDailyRunsForChecklistOnDate,
  listIssuesForBusiness,
} from "@/lib/db/queries"
import type { DailyChecklistType, Tables, TypedSupabaseClient } from "@/types/database"

import { utcShiftDate } from "./shift-date"

export type ShiftSnapshot = {
  checklist: DailyChecklistWithItems
  run: Tables<"execution_records"> | null
  items: DailyRunItemWithLine[]
  issues: Tables<"bottlenecks">[]
}

export function pickTodayRun(runs: Tables<"execution_records">[]): Tables<"execution_records"> | null {
  const inProg = runs.find((r) => r.status === "in_progress")
  if (inProg) return inProg
  const completed = runs
    .filter((r) => r.status === "completed")
    .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
  return completed[0] ?? null
}

export async function buildShiftSnapshot(
  businessId: string,
  type: Extract<DailyChecklistType, "opening" | "closing">,
  shiftDate: string,
  client: TypedSupabaseClient
): Promise<ShiftSnapshot | null> {
  const checklist = await fetchOldestDailyChecklistWithItemsByType(
    businessId,
    type,
    client
  )
  if (!checklist) return null

  const runs = await listDailyRunsForChecklistOnDate(
    checklist.id,
    businessId,
    shiftDate,
    client
  )
  const run = pickTodayRun(runs)
  const items = run ? await fetchDailyRunItemsWithLines(run.id, client) : []
  const issues = run
    ? await listIssuesForBusiness(businessId, { executionRecordId: run.id, limit: 50 }, client)
    : []

  return { checklist, run, items, issues }
}

export async function buildTodayShiftPair(
  businessId: string,
  client: TypedSupabaseClient,
  shiftDate = utcShiftDate()
): Promise<{ shiftDate: string; opening: ShiftSnapshot | null; closing: ShiftSnapshot | null }> {
  const [opening, closing] = await Promise.all([
    buildShiftSnapshot(businessId, "opening", shiftDate, client),
    buildShiftSnapshot(businessId, "closing", shiftDate, client),
  ])
  return { shiftDate, opening, closing }
}
