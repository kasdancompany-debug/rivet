import type { TypedSupabaseClient } from "@/types/database"
import type { Tables } from "@/types/database"

import type { DailyRunCompletionStats } from "@/lib/rivet-score/compute"

const IN_CHUNK = 80

async function inChunks<T>(
  ids: string[],
  chunkSize: number,
  fetchChunk: (chunk: string[]) => Promise<T[]>
): Promise<T[]> {
  const out: T[] = []
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize)
    out.push(...(await fetchChunk(chunk)))
  }
  return out
}

/** Last `days` of daily runs: completion on completed runs + abandoned ratio. */
export async function aggregateDailyRunCompletionLastDays(
  businessId: string,
  days: number,
  client: TypedSupabaseClient
): Promise<DailyRunCompletionStats> {
  const since = new Date()
  since.setUTCDate(since.getUTCDate() - days)
  const sinceIso = since.toISOString()

  const { data: runs, error } = await client
    .from("execution_records")
    .select("id,status,started_at")
    .eq("business_id", businessId)
    .gte("started_at", sinceIso)
    .order("started_at", { ascending: false })

  if (error || !runs?.length) {
    return {
      completedRunIds: [],
      abandonedCount: 0,
      itemsCompleted: 0,
      itemsTotal: 0,
      recentRunCount: 0,
    }
  }

  const recentRunCount = runs.length
  const abandonedCount = runs.filter((r) => r.status === "abandoned").length
  const completedRunIds = runs.filter((r) => r.status === "completed").map((r) => r.id)

  if (completedRunIds.length === 0) {
    return {
      completedRunIds: [],
      abandonedCount,
      itemsCompleted: 0,
      itemsTotal: 0,
      recentRunCount,
    }
  }

  const items = await inChunks(completedRunIds, IN_CHUNK, async (chunk) => {
    const { data, error: e2 } = await client
      .from("execution_record_items")
      .select("completed")
      .in("execution_record_id", chunk)
    if (e2 || !data) return []
    return data
  })

  let itemsCompleted = 0
  for (const row of items) {
    if (row.completed) itemsCompleted += 1
  }
  const itemsTotal = items.length

  return {
    completedRunIds,
    abandonedCount,
    itemsCompleted,
    itemsTotal,
    recentRunCount,
  }
}

export async function listRivetIndexSnapshotsLastDays(
  businessId: string,
  days: number,
  client: TypedSupabaseClient
): Promise<Tables<"handoff_score_snapshots">[]> {
  const since = new Date()
  since.setUTCDate(since.getUTCDate() - days)
  const sinceDate = since.toISOString().slice(0, 10)

  const { data, error } = await client
    .from("handoff_score_snapshots")
    .select("*")
    .eq("business_id", businessId)
    .gte("snapshot_date", sinceDate)
    .order("snapshot_date", { ascending: true })

  if (error || !data) return []
  return data
}

export async function upsertRivetIndexSnapshotForUtcDate(params: {
  businessId: string
  snapshotDate: string
  dependencyScore: number
  autonomyScore: number
  categoryScores: Record<string, number>
  warnings: string[]
  client: TypedSupabaseClient
}): Promise<void> {
  const { businessId, snapshotDate, dependencyScore, autonomyScore, categoryScores, warnings, client } =
    params

  await client.from("handoff_score_snapshots").upsert(
    {
      business_id: businessId,
      snapshot_date: snapshotDate,
      dependency_score: dependencyScore,
      autonomy_score: autonomyScore,
      category_scores: categoryScores,
      critical_warnings: warnings,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "business_id,snapshot_date" }
  )
}
