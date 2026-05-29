import {
  fetchBusinessForCurrentUser,
  fetchCurrentProfile,
  fetchProfilesForCurrentBusiness,
  listAskQueriesForBusinessSince,
  listInterruptionActionPlansForBusiness,
  listOwnerInterruptionsForBusinessSince,
  listSopsForBusiness,
  listStandardIdsWithMediaForBusiness,
  listTrainingModulesForBusiness,
  listTrainingProgressForBusinessModules,
} from "@/lib/db/queries"
import { buildOwnerInterruptionsDashboardView } from "@/lib/owner-interruptions/build-view-model"
import type { OwnerInterruptionsDashboardView } from "@/lib/owner-interruptions/types"
import { isWorkspaceOwner } from "@/lib/ops/workspace-role"
import { utcDaysAgoMidnightIso, utcMondayStartIso } from "@/lib/time/utc-week"
import { shouldSkipSupabaseNetwork } from "@/lib/dev-auth-bypass"
import { getServerAuthUser, requireAuthUser } from "@/lib/auth/server-auth"
import { createClient } from "@/lib/supabase/server"

export async function getOwnerInterruptionsDashboardView(): Promise<OwnerInterruptionsDashboardView | null> {
  if (shouldSkipSupabaseNetwork()) return null
  const user = requireAuthUser(await getServerAuthUser())
  const supabase = await createClient()
  const business = await fetchBusinessForCurrentUser(supabase)
  if (!business) return null

  const profile = await fetchCurrentProfile(supabase)
  const owner = isWorkspaceOwner(user.id, business, profile)

  const weekStartIso = utcMondayStartIso()
  const historySinceIso = utcDaysAgoMidnightIso(20)

  const [rows, profiles, actionPlans, standards, modules, askQueries, standardIdsWithMedia] =
    await Promise.all([
      listOwnerInterruptionsForBusinessSince(business.id, historySinceIso, supabase),
      fetchProfilesForCurrentBusiness(supabase),
      listInterruptionActionPlansForBusiness(business.id, supabase),
      listSopsForBusiness(business.id, undefined, supabase),
      listTrainingModulesForBusiness(business.id, supabase),
      listAskQueriesForBusinessSince(business.id, utcDaysAgoMidnightIso(90), supabase),
      listStandardIdsWithMediaForBusiness(business.id, supabase),
    ])

  const moduleIds = modules.map((m) => m.id)
  const trainingProgress =
    moduleIds.length > 0
      ? await listTrainingProgressForBusinessModules(moduleIds, supabase)
      : []

  const teamProfiles = profiles.filter((p) => p.business_id === business.id || p.id === business.owner_id)
  const uniq = [...new Map(teamProfiles.map((p) => [p.id, p])).values()]

  const hourlyRaw = business.owner_hourly_value_cad
  const ownerHourlyValueCad =
    hourlyRaw != null && Number.isFinite(Number(hourlyRaw)) ? Number(hourlyRaw) : null

  return buildOwnerInterruptionsDashboardView({
    weekStartIso,
    historySinceIso,
    rowsSinceHistory: rows,
    profiles: uniq.map((p) => ({ id: p.id, full_name: p.full_name, role: p.role })),
    ownerHourlyValueCad,
    businessId: business.id,
    isOwner: owner,
    actionPlans,
    standards,
    modules,
    trainingProgress,
    askQueries,
    standardIdsWithMedia,
  })
}
