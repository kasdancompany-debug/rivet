import {
  fetchBusinessForCurrentUser,
  fetchProfilesForCurrentBusiness,
  listOwnerInterruptionsForBusinessSince,
} from "@/lib/db/queries"
import { buildOwnerInterruptionsDashboardView } from "@/lib/owner-interruptions/build-view-model"
import type { OwnerInterruptionsDashboardView } from "@/lib/owner-interruptions/types"
import { utcDaysAgoMidnightIso, utcMondayStartIso } from "@/lib/time/utc-week"
import { shouldSkipSupabaseNetwork } from "@/lib/dev-auth-bypass"
import { createClient } from "@/lib/supabase/server"

export async function getOwnerInterruptionsDashboardView(): Promise<OwnerInterruptionsDashboardView | null> {
  if (shouldSkipSupabaseNetwork()) return null
  const supabase = await createClient()
  const business = await fetchBusinessForCurrentUser(supabase)
  if (!business) return null

  const weekStartIso = utcMondayStartIso()
  const historySinceIso = utcDaysAgoMidnightIso(13)

  const [rows, profiles] = await Promise.all([
    listOwnerInterruptionsForBusinessSince(business.id, historySinceIso, supabase),
    fetchProfilesForCurrentBusiness(supabase),
  ])

  const teamProfiles = profiles.filter((p) => p.business_id === business.id || p.id === business.owner_id)
  const uniq = [...new Map(teamProfiles.map((p) => [p.id, p])).values()]

  return buildOwnerInterruptionsDashboardView({
    weekStartIso,
    historySinceIso,
    rowsSinceHistory: rows,
    profiles: uniq.map((p) => ({ id: p.id, full_name: p.full_name, role: p.role })),
  })
}
