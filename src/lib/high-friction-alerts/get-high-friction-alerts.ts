import {
  fetchBusinessForCurrentUser,
  listAskQueriesForBusinessSince,
  listEmployeeStandardQuizCompletionsForEmployeeIds,
  listOwnerInterruptionsForBusinessSince,
  listSopsForBusiness,
  listStandardPlayViewsForBusinessSince,
} from "@/lib/db/queries"
import { buildHighFrictionAlerts } from "@/lib/high-friction-alerts/build-alerts"
import type { HighFrictionAlertsView } from "@/lib/high-friction-alerts/types"
import { utcDaysAgoMidnightIso } from "@/lib/time/utc-week"
import { shouldSkipSupabaseNetwork } from "@/lib/dev-auth-bypass"
import { createClient } from "@/lib/supabase/server"

export async function getHighFrictionAlertsView(): Promise<HighFrictionAlertsView | null> {
  if (shouldSkipSupabaseNetwork()) return null

  try {
    const supabase = await createClient()
    const business = await fetchBusinessForCurrentUser(supabase)
    if (!business) return null

    const since30 = utcDaysAgoMidnightIso(30)
    const since14 = utcDaysAgoMidnightIso(14)

    const [askRows, interruptions, standards, playViews, profiles] = await Promise.all([
      listAskQueriesForBusinessSince(business.id, since30, supabase),
      listOwnerInterruptionsForBusinessSince(business.id, since30, supabase),
      listSopsForBusiness(business.id, undefined, supabase),
      listStandardPlayViewsForBusinessSince(business.id, since14, supabase),
      supabase.from("profiles").select("id").eq("business_id", business.id),
    ])

    const employeeIds = (profiles.data ?? []).map((p) => p.id)
    const quizCompletions =
      employeeIds.length > 0
        ? await listEmployeeStandardQuizCompletionsForEmployeeIds(employeeIds, supabase)
        : []

    const alerts = buildHighFrictionAlerts({
      askRows,
      interruptions,
      standards: standards.map((s) => ({
        id: s.id,
        title: s.title,
        quiz_questions: s.quiz_questions,
      })),
      quizCompletions,
      playViews,
    })

    return {
      businessId: business.id,
      alerts,
    }
  } catch (error) {
    console.error("[rivet] getHighFrictionAlertsView failed", error)
    return null
  }
}
