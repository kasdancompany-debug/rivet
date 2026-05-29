import { normalizeSummaryKey } from "@/lib/owner-interruptions/normalize-summary"
import type { Tables } from "@/types/database"

import type { InterruptionFixImpact } from "@/lib/owner-interruptions/outcomes/types"

const TRACKING_WINDOW_DAYS = 14

function daysBetween(a: Date, b: Date): number {
  return Math.abs(b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000)
}

function patternKeyFromPlan(
  plan: Tables<"interruption_action_plans">,
  interruptionSummary: string
): string {
  const payload = plan.ai_payload
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const key = (payload as Record<string, unknown>).patternKey
    if (typeof key === "string" && key.trim()) return key
  }
  return normalizeSummaryKey(interruptionSummary)
}

function baselineFromPayload(plan: Tables<"interruption_action_plans">): number | null {
  const payload = plan.ai_payload
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null
  const value = (payload as Record<string, unknown>).baselineRepeatCount
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

export function computeFixImpact(input: {
  plan: Tables<"interruption_action_plans">
  interruptionSummary: string
  historyRows: Tables<"owner_interruptions">[]
}): InterruptionFixImpact | null {
  if (input.plan.status !== "published" || !input.plan.published_at) return null

  const { plan } = input
  const patternKey = patternKeyFromPlan(plan, input.interruptionSummary)
  if (!patternKey) return null

  const publishedAt = new Date(plan.published_at as string)
  const beforeWindowStart = new Date(publishedAt)
  beforeWindowStart.setUTCDate(beforeWindowStart.getUTCDate() - TRACKING_WINDOW_DAYS)

  const matching = input.historyRows.filter(
    (row) => normalizeSummaryKey(row.summary) === patternKey
  )

  const beforeCount =
    baselineFromPayload(plan) ??
    matching.filter((row) => {
      const at = new Date(row.occurred_at)
      return at >= beforeWindowStart && at < publishedAt
    }).length

  const afterCount = matching.filter((row) => new Date(row.occurred_at) >= publishedAt).length

  const dropPercent =
    beforeCount > 0 ? Math.round(((beforeCount - afterCount) / beforeCount) * 100) : null

  const daysSincePublish = daysBetween(publishedAt, new Date())
  const isTracking = daysSincePublish <= TRACKING_WINDOW_DAYS * 2

  let trackingLabel: string
  if (afterCount === 0 && beforeCount > 0) {
    trackingLabel = `No repeat pulls since fix (was ${beforeCount} in prior ${TRACKING_WINDOW_DAYS}d)`
  } else if (dropPercent != null && dropPercent > 0) {
    trackingLabel = `Repeat pulls down ${dropPercent}% since fix (${beforeCount} → ${afterCount})`
  } else if (afterCount > beforeCount) {
    trackingLabel = `Still surfacing—${afterCount} repeat pull(s) since fix`
  } else if (afterCount === beforeCount && afterCount > 0) {
    trackingLabel = `Same pace so far (${afterCount} since fix vs ${beforeCount} before)`
  } else {
    trackingLabel = "Tracking repeat pulls after fix"
  }

  return {
    patternKey,
    beforeCount,
    afterCount,
    dropPercent,
    trackingLabel,
    isTracking,
  }
}
