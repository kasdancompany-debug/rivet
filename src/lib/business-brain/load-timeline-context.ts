import {
  fetchBusinessForCurrentUser,
  fetchProfilesForCurrentBusiness,
  listEmployeeModuleCertificationsForBusiness,
  listOwnerInterruptionsForBusinessSince,
  listSopsForBusiness,
  listTrainingModulesDeepForBusiness,
  listTrainingProgressForBusinessModules,
  listTrainingSopCompletionsForEmployeeIds,
} from "@/lib/db/queries"
import { listRivetIndexSnapshotsLastDays } from "@/lib/rivet-score/data"
import { createClient } from "@/lib/supabase/server"
import type { TypedSupabaseClient } from "@/types/database"
import type { Tables } from "@/types/database"

import { buildBusinessBrainTimeline } from "./build-timeline"
import type { BusinessBrainTimelineContext } from "./build-timeline"
import type { BusinessBrainTimelineView } from "./types"

const LOOKBACK_DAYS = 90

function sinceIsoFromDays(days: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString()
}

async function listAskQueriesForTimeline(
  businessId: string,
  sinceIso: string,
  client: TypedSupabaseClient
): Promise<
  Pick<
    Tables<"rivet_ask_queries">,
    "id" | "question_text" | "standard_id" | "prevented_owner_interrupt" | "created_at"
  >[]
> {
  const { data, error } = await client
    .from("rivet_ask_queries")
    .select("id, question_text, standard_id, prevented_owner_interrupt, created_at")
    .eq("business_id", businessId)
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false })
    .limit(200)

  if (error || !data) return []
  return data
}

export async function loadBusinessBrainTimelineView(
  client?: TypedSupabaseClient
): Promise<BusinessBrainTimelineView | null> {
  const supabase = client ?? (await createClient())
  const business = await fetchBusinessForCurrentUser(supabase)
  if (!business) return null

  const sinceIso = sinceIsoFromDays(LOOKBACK_DAYS)
  const businessId = business.id

  const [profiles, standards, modules, certifications, interruptions, askQueries, snapshots] =
    await Promise.all([
      fetchProfilesForCurrentBusiness(supabase),
      listSopsForBusiness(businessId, undefined, supabase),
      listTrainingModulesDeepForBusiness(businessId, supabase),
      listEmployeeModuleCertificationsForBusiness(businessId, supabase),
      listOwnerInterruptionsForBusinessSince(businessId, sinceIso, supabase),
      listAskQueriesForTimeline(businessId, sinceIso, supabase),
      listRivetIndexSnapshotsLastDays(businessId, LOOKBACK_DAYS, supabase),
    ])

  const moduleIds = modules.map((m) => m.id)
  const employeeIds = profiles.map((p) => p.id)

  const [trainingProgress, playCompletions] = await Promise.all([
    listTrainingProgressForBusinessModules(moduleIds, supabase),
    listTrainingSopCompletionsForEmployeeIds(employeeIds, supabase),
  ])

  const modulesById = new Map(modules.map((m) => [m.id, { id: m.id, title: m.title }]))
  const profileNameById = new Map(
    profiles.map((p) => [p.id, p.full_name?.trim() || p.email || "Teammate"])
  )
  const trainingItemTitleById = new Map<string, string>()

  for (const mod of modules) {
    for (const item of mod.training_items ?? []) {
      const std = item.standards
      const stdTitle = std && typeof std === "object" && "title" in std ? String(std.title) : null
      trainingItemTitleById.set(item.id, stdTitle || "Play")
    }
  }

  const ctx: BusinessBrainTimelineContext = {
    sinceIso,
    standards: standards.map((s) => ({
      id: s.id,
      title: s.title,
      created_at: s.created_at,
      updated_at: s.updated_at,
    })),
    modulesById,
    trainingItemTitleById,
    profileNameById,
    trainingProgress: trainingProgress.filter(
      (r) => r.business_id === businessId || r.business_id == null
    ),
    certifications,
    playCompletions: playCompletions.filter((r) => {
      const at = new Date(r.completed_at).getTime()
      return !Number.isNaN(at) && at >= new Date(sinceIso).getTime()
    }),
    askQueries,
    interruptions,
    snapshots,
  }

  return buildBusinessBrainTimeline(ctx)
}
