import {
  fetchProfilesForCurrentBusiness,
  listEmployeeModuleCertificationsForBusiness,
  listRivetAskQueriesForBusinessSearch,
  listStandardMediaForBusiness,
  listStandardsWithStepsForBusiness,
  listTrainingModulesDeepForBusiness,
} from "@/lib/db/queries"
import { buildStandardTitleMap, type UniversalSearchCorpus } from "@/lib/universal-search/corpus"
import type { TypedSupabaseClient } from "@/types/database"

export async function loadUniversalSearchCorpus(
  businessId: string,
  client: TypedSupabaseClient
): Promise<UniversalSearchCorpus> {
  const [standards, modules, media, askQueries, profiles, certifications] = await Promise.all([
    listStandardsWithStepsForBusiness(businessId, client),
    listTrainingModulesDeepForBusiness(businessId, client),
    listStandardMediaForBusiness(businessId, client),
    listRivetAskQueriesForBusinessSearch(businessId, 150, client),
    fetchProfilesForCurrentBusiness(client),
    listEmployeeModuleCertificationsForBusiness(businessId, client),
  ])

  const teamProfiles = profiles.filter((p) => p.business_id === businessId)
  const standardTitleById = buildStandardTitleMap(standards)
  const moduleTitleById = new Map(modules.map((m) => [m.id, m.title]))
  const profileNameById = new Map(teamProfiles.map((p) => [p.id, p.full_name?.trim() || p.email]))

  return {
    standards,
    modules,
    media,
    askQueries,
    profiles: teamProfiles,
    certifications,
    standardTitleById,
    moduleTitleById,
    profileNameById,
  }
}
