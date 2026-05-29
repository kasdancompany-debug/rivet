/**
 * Common typed queries for Rivet.
 * Intended for the server Supabase client (cookies); RLS applies automatically.
 */

import { shouldSkipSupabaseNetwork } from "@/lib/dev-auth-bypass"
import { getDevWorkspaceBusiness } from "@/lib/dev-workspace"
import { createClient } from "@/lib/supabase/server"
import type { StandardStepRollup } from "@/lib/dashboard/standards-depth"
import {
  DEFAULT_CLOSING_CHECKLIST_ITEMS,
  DEFAULT_OPENING_CHECKLIST_ITEMS,
} from "@/lib/daily-ops/defaults"
import type { SopPlayCompletionContext } from "@/lib/sops/sop-play-completion"
import { syncEmployeeModuleCertification } from "@/lib/training/certifications/sync"
import {
  profileFirstName,
  type SopActivityContext,
  type SopActivityChecklistEvent,
  type SopActivityPersonEvent,
} from "@/lib/sops/sop-activity-feed"
import type {
  DailyChecklistType,
  EscapePlanStatus,
  IssueStatus,
  IssueLifecycleStage,
  ReadinessBadge,
  StandardStatus,
  Tables,
  TablesInsert,
  TablesUpdate,
  TrainingProgressStatus,
  TypedSupabaseClient,
} from "@/types/database"

async function getClient(client?: TypedSupabaseClient): Promise<TypedSupabaseClient> {
  return client ?? (await createClient())
}

export type StandardWithSteps = Tables<"standards"> & {
  standard_steps: Tables<"standard_steps">[]
  standard_media?: Tables<"standard_media">[]
}

/** @deprecated use StandardWithSteps */
export type SopWithSteps = StandardWithSteps

export type DailyChecklistWithItems = Tables<"daily_checklists"> & {
  daily_checklist_items: Tables<"daily_checklist_items">[]
}

export type TrainingModuleWithItems = Tables<"training_modules"> & {
  training_items: Tables<"training_items">[]
}

export type TrainingItemWithSop = Tables<"training_items"> & {
  standards: Pick<
    Tables<"standards">,
    "id" | "title" | "status" | "category" | "estimated_time_minutes"
  > | null
}

export type TrainingModuleDeep = Tables<"training_modules"> & {
  training_items: TrainingItemWithSop[]
}

/** Logged-in user's profile, if present. */
export async function fetchCurrentProfile(
  client?: TypedSupabaseClient
): Promise<Tables<"profiles"> | null> {
  if (shouldSkipSupabaseNetwork() && !client) return null
  const supabase = await getClient(client)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  if (error) return null
  return data
}

/** Single business by id (allowed by RLS). */
export async function fetchBusinessById(
  businessId: string,
  client?: TypedSupabaseClient
): Promise<Tables<"businesses"> | null> {
  const supabase = await getClient(client)
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", businessId)
    .maybeSingle()

  if (error) return null
  return data
}

/**
 * Business for the current user: profile.business_id, or owned business
 * when the profile row has not been linked yet.
 */
export async function fetchBusinessForCurrentUser(
  client?: TypedSupabaseClient
): Promise<Tables<"businesses"> | null> {
  if (shouldSkipSupabaseNetwork() && !client) {
    return getDevWorkspaceBusiness()
  }
  const supabase = await getClient(client)
  const profile = await fetchCurrentProfile(supabase)
  if (profile?.business_id) {
    return fetchBusinessById(profile.business_id, supabase)
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) return null
  return data
}

export async function fetchBusinessMemberForUser(
  userId: string,
  client?: TypedSupabaseClient
): Promise<Tables<"business_members"> | null> {
  const supabase = await getClient(client)
  const business = await fetchBusinessForCurrentUser(supabase)
  if (!business) return null

  const { data, error } = await supabase
    .from("business_members")
    .select("*")
    .eq("business_id", business.id)
    .eq("user_id", userId)
    .maybeSingle()

  if (error) return null
  return data
}

export async function listBusinessMembersForCurrentBusiness(
  client?: TypedSupabaseClient
): Promise<Tables<"business_members">[]> {
  const supabase = await getClient(client)
  const business = await fetchBusinessForCurrentUser(supabase)
  if (!business) return []

  const { data, error } = await supabase
    .from("business_members")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", { ascending: true })

  if (error || !data) return []
  return data
}

/** All profiles visible to the current user (same business + self). */
export async function fetchProfilesForCurrentBusiness(
  client?: TypedSupabaseClient
): Promise<Tables<"profiles">[]> {
  const supabase = await getClient(client)
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("full_name", { ascending: true })

  if (error || !data) return []
  return data
}

export async function listSopsForBusiness(
  businessId: string,
  options?: { status?: StandardStatus; category?: string },
  client?: TypedSupabaseClient
): Promise<Tables<"standards">[]> {
  const supabase = await getClient(client)
  let q = supabase
    .from("standards")
    .select("*")
    .eq("business_id", businessId)
    .order("updated_at", { ascending: false })

  if (options?.status) {
    q = q.eq("status", options.status)
  }
  if (options?.category) {
    q = q.eq("category", options.category)
  }

  const { data, error } = await q
  if (error || !data) return []
  return data
}

/** Step counts keyed by standard id for SOP list cards. */
export async function listStandardStepCountsForBusiness(
  businessId: string,
  client?: TypedSupabaseClient
): Promise<Map<string, number>> {
  const supabase = await getClient(client)
  const { data: standards, error: standardsErr } = await supabase
    .from("standards")
    .select("id")
    .eq("business_id", businessId)

  if (standardsErr || !standards?.length) return new Map()

  const ids = standards.map((s) => s.id as string)
  const { data: steps, error: stepsErr } = await supabase
    .from("standard_steps")
    .select("standard_id")
    .in("standard_id", ids)

  if (stepsErr || !steps) return new Map()

  const counts = new Map<string, number>()
  for (const row of steps) {
    const sid = row.standard_id as string
    counts.set(sid, (counts.get(sid) ?? 0) + 1)
  }
  return counts
}

const EMPTY_PLAY_COMPLETION_CONTEXT: SopPlayCompletionContext = {
  stepRollupBySopId: new Map(),
  mediaCountBySopId: new Map(),
  trainingItemsBySopId: new Map(),
  assignedEmployeesByModuleId: new Map(),
  completionKeys: new Set(),
}

/** Rollups for documentation, training linkage, and ownership on SOP cards. */
export async function fetchSopPlayCompletionContextForBusiness(
  businessId: string,
  client?: TypedSupabaseClient
): Promise<SopPlayCompletionContext> {
  const supabase = await getClient(client)
  const { data: standards, error: standardsErr } = await supabase
    .from("standards")
    .select("id")
    .eq("business_id", businessId)

  if (standardsErr || !standards?.length) return EMPTY_PLAY_COMPLETION_CONTEXT

  const standardIds = standards.map((s) => s.id as string)

  const stepRollupBySopId = new Map<string, StandardStepRollup>()
  const { data: stepRows, error: stepsErr } = await supabase
    .from("standard_steps")
    .select("standard_id, media_url, requires_photo_confirmation")
    .in("standard_id", standardIds)

  if (!stepsErr && stepRows) {
    for (const row of stepRows) {
      const sid = row.standard_id as string
      const prev = stepRollupBySopId.get(sid) ?? { stepCount: 0, hasStepMediaOrEvidence: false }
      prev.stepCount += 1
      if (
        (row.media_url != null && String(row.media_url).trim().length > 0) ||
        row.requires_photo_confirmation === true
      ) {
        prev.hasStepMediaOrEvidence = true
      }
      stepRollupBySopId.set(sid, prev)
    }
  }

  const { data: mediaRows, error: mediaErr } = await supabase
    .from("standard_media")
    .select("standard_id")
    .in("standard_id", standardIds)

  const mediaCountBySopId = new Map<string, number>()
  if (!mediaErr && mediaRows) {
    for (const row of mediaRows) {
      const sid = row.standard_id as string
      mediaCountBySopId.set(sid, (mediaCountBySopId.get(sid) ?? 0) + 1)
    }
  }

  const modules = await listTrainingModulesForBusiness(businessId, supabase)
  const moduleIds = modules.map((m) => m.id)

  const trainingItemsBySopId = new Map<string, { id: string; moduleId: string }[]>()
  if (moduleIds.length > 0) {
    const { data: itemRows, error: itemsErr } = await supabase
      .from("training_items")
      .select("id, module_id, standard_id")
      .in("module_id", moduleIds)
      .in("standard_id", standardIds)
      .eq("required", true)

    if (!itemsErr && itemRows) {
      for (const row of itemRows) {
        const sid = row.standard_id as string
        const list = trainingItemsBySopId.get(sid) ?? []
        list.push({ id: row.id as string, moduleId: row.module_id as string })
        trainingItemsBySopId.set(sid, list)
      }
    }
  }

  const assignedEmployeesByModuleId = new Map<string, Set<string>>()
  const completionKeys = new Set<string>()

  if (moduleIds.length > 0) {
    const progress = await listTrainingProgressForBusinessModules(moduleIds, supabase)
    for (const row of progress) {
      const moduleId = row.training_module_id
      const set = assignedEmployeesByModuleId.get(moduleId) ?? new Set<string>()
      set.add(row.employee_id)
      assignedEmployeesByModuleId.set(moduleId, set)
    }

    const employeeIds = [...new Set(progress.map((p) => p.employee_id))]
    if (employeeIds.length > 0) {
      const completions = await listTrainingSopCompletionsForEmployeeIds(employeeIds, supabase)
      for (const row of completions) {
        completionKeys.add(`${row.employee_id}:${row.training_item_id}`)
      }
    }
  }

  return {
    stepRollupBySopId,
    mediaCountBySopId,
    trainingItemsBySopId,
    assignedEmployeesByModuleId,
    completionKeys,
  }
}

/** Recent edits, checklist runs, and training events for SOP card activity feeds. */
export async function fetchSopActivityContextForBusiness(
  businessId: string,
  client?: TypedSupabaseClient
): Promise<SopActivityContext> {
  const supabase = await getClient(client)

  const profileFirstNameById = new Map<string, string>()
  const profiles = await fetchProfilesForCurrentBusiness(supabase)
  for (const profile of profiles) {
    profileFirstNameById.set(profile.id, profileFirstName(profile.full_name))
  }

  const { data: businessRow } = await supabase
    .from("businesses")
    .select("owner_id")
    .eq("id", businessId)
    .maybeSingle()

  if (businessRow?.owner_id && !profileFirstNameById.has(businessRow.owner_id)) {
    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", businessRow.owner_id)
      .maybeSingle()
    if (ownerProfile?.full_name) {
      profileFirstNameById.set(businessRow.owner_id, profileFirstName(ownerProfile.full_name))
    }
  }

  const { data: standards } = await supabase
    .from("standards")
    .select("id")
    .eq("business_id", businessId)

  const standardIds = (standards ?? []).map((row) => row.id as string)
  const trainingCompletionsBySopId = new Map<string, SopActivityPersonEvent[]>()
  const trainingModuleCompletionsBySopId = new Map<string, SopActivityPersonEvent[]>()

  const modules = await listTrainingModulesForBusiness(businessId, supabase)
  const moduleIds = modules.map((module) => module.id)

  if (moduleIds.length > 0 && standardIds.length > 0) {
    const { data: itemRows } = await supabase
      .from("training_items")
      .select("id, module_id, standard_id")
      .in("module_id", moduleIds)
      .in("standard_id", standardIds)

    const itemIds: string[] = []
    const sopIdByItemId = new Map<string, string>()
    const sopIdsByModuleId = new Map<string, Set<string>>()

    for (const row of itemRows ?? []) {
      const itemId = row.id as string
      const sopId = row.standard_id as string
      const moduleId = row.module_id as string
      itemIds.push(itemId)
      sopIdByItemId.set(itemId, sopId)
      const sopIds = sopIdsByModuleId.get(moduleId) ?? new Set<string>()
      sopIds.add(sopId)
      sopIdsByModuleId.set(moduleId, sopIds)
    }

    if (itemIds.length > 0) {
      const { data: completions } = await supabase
        .from("employee_training_sop_completions")
        .select("employee_id, training_item_id, completed_at")
        .in("training_item_id", itemIds)

      for (const row of completions ?? []) {
        const sopId = sopIdByItemId.get(row.training_item_id as string)
        if (!sopId) continue
        const list = trainingCompletionsBySopId.get(sopId) ?? []
        list.push({
          employeeId: row.employee_id as string,
          completedAt: row.completed_at as string,
        })
        trainingCompletionsBySopId.set(sopId, list)
      }
    }

    const progress = await listTrainingProgressForBusinessModules(moduleIds, supabase)
    for (const row of progress) {
      if (row.status !== "completed") continue
      const completedAt = row.completed_at ?? row.updated_at
      if (!completedAt) continue

      const sopIds = sopIdsByModuleId.get(row.training_module_id)
      if (!sopIds) continue

      for (const sopId of sopIds) {
        const list = trainingModuleCompletionsBySopId.get(sopId) ?? []
        list.push({
          employeeId: row.employee_id,
          completedAt,
        })
        trainingModuleCompletionsBySopId.set(sopId, list)
      }
    }
  }

  const checklistCompletionsByChecklistType = new Map<DailyChecklistType, SopActivityChecklistEvent[]>()
  const { data: checklists } = await supabase
    .from("daily_checklists")
    .select("id, type")
    .eq("business_id", businessId)

  const checklistTypeById = new Map<string, DailyChecklistType>(
    (checklists ?? []).map((row) => [row.id as string, row.type as DailyChecklistType])
  )
  const checklistIds = [...checklistTypeById.keys()]

  if (checklistIds.length > 0) {
    const { data: runs } = await supabase
      .from("execution_records")
      .select("employee_id, checklist_id, completed_at, updated_at, status")
      .eq("business_id", businessId)
      .in("checklist_id", checklistIds)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(120)

    for (const run of runs ?? []) {
      const checklistType = checklistTypeById.get(run.checklist_id as string)
      if (!checklistType) continue
      const completedAt = (run.completed_at ?? run.updated_at) as string | null
      if (!completedAt) continue

      const list = checklistCompletionsByChecklistType.get(checklistType) ?? []
      list.push({
        employeeId: run.employee_id as string,
        completedAt,
      })
      checklistCompletionsByChecklistType.set(checklistType, list)
    }
  }

  return {
    profileFirstNameById,
    checklistCompletionsByChecklistType,
    trainingCompletionsBySopId,
    trainingModuleCompletionsBySopId,
  }
}

export async function fetchSopWithSteps(
  sopId: string,
  client?: TypedSupabaseClient
): Promise<StandardWithSteps | null> {
  const supabase = await getClient(client)
  const { data, error } = await supabase
    .from("standards")
    .select("*, standard_steps(*), standard_media(*)")
    .eq("id", sopId)
    .maybeSingle()

  if (error || !data) return null

  const row = data as unknown as StandardWithSteps
  const steps = [...(row.standard_steps ?? [])].sort(
    (a, b) => a.step_order - b.step_order
  )
  const media = [...(row.standard_media ?? [])].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
  return { ...row, standard_steps: steps, standard_media: media }
}

export async function listTrainingModulesForBusiness(
  businessId: string,
  client?: TypedSupabaseClient
): Promise<Tables<"training_modules">[]> {
  const supabase = await getClient(client)
  const { data, error } = await supabase
    .from("training_modules")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })

  if (error || !data) return []
  return data
}

export async function fetchTrainingModuleWithItems(
  moduleId: string,
  client?: TypedSupabaseClient
): Promise<TrainingModuleWithItems | null> {
  const supabase = await getClient(client)
  const { data, error } = await supabase
    .from("training_modules")
    .select("*, training_items(*)")
    .eq("id", moduleId)
    .maybeSingle()

  if (error || !data) return null
  return data as unknown as TrainingModuleWithItems
}

export async function listTrainingItemsForModule(
  moduleId: string,
  client?: TypedSupabaseClient
): Promise<Tables<"training_items">[]> {
  const supabase = await getClient(client)
  const { data, error } = await supabase
    .from("training_items")
    .select("*")
    .eq("module_id", moduleId)

  if (error || !data) return []
  return data
}

export async function listEmployeeTrainingProgress(
  filters: { employeeId?: string; moduleId?: string },
  client?: TypedSupabaseClient
): Promise<Tables<"training_progress">[]> {
  const supabase = await getClient(client)
  let q = supabase.from("training_progress").select("*")

  if (filters.employeeId) {
    q = q.eq("employee_id", filters.employeeId)
  }
  if (filters.moduleId) {
    q = q.eq("training_module_id", filters.moduleId)
  }

  const { data, error } = await q
  if (error || !data) return []
  return data
}

export async function listTrainingProgressForBusinessModules(
  moduleIds: string[],
  client?: TypedSupabaseClient
): Promise<Tables<"training_progress">[]> {
  if (moduleIds.length === 0) return []
  const supabase = await getClient(client)
  const { data, error } = await supabase
    .from("training_progress")
    .select("*")
    .in("training_module_id", moduleIds)

  if (error || !data) return []
  return data
}

export async function fetchTrainingModuleDeep(
  moduleId: string,
  client?: TypedSupabaseClient
): Promise<TrainingModuleDeep | null> {
  const supabase = await getClient(client)
  const { data, error } = await supabase
    .from("training_modules")
    .select("*, training_items(*, standards(id, title, status, category, estimated_time_minutes))")
    .eq("id", moduleId)
    .maybeSingle()

  if (error || !data) return null
  const row = data as unknown as TrainingModuleDeep
  const items = [...(row.training_items ?? [])].sort((a, b) =>
    (a.created_at ?? "").localeCompare(b.created_at ?? "")
  )
  return { ...row, training_items: items }
}

export async function listTrainingModulesDeepForBusiness(
  businessId: string,
  client?: TypedSupabaseClient
): Promise<TrainingModuleDeep[]> {
  const supabase = await getClient(client)
  const { data, error } = await supabase
    .from("training_modules")
    .select("*, training_items(*, standards(id, title, status, category, estimated_time_minutes))")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })

  if (error || !data) return []
  return (data as unknown as TrainingModuleDeep[]).map((m) => ({
    ...m,
    training_items: [...(m.training_items ?? [])].sort((a, b) =>
      (a.created_at ?? "").localeCompare(b.created_at ?? "")
    ),
  }))
}

export async function listTrainingSopCompletionsForEmployeeIds(
  employeeIds: string[],
  client?: TypedSupabaseClient
): Promise<Tables<"employee_training_sop_completions">[]> {
  if (employeeIds.length === 0) return []
  const supabase = await getClient(client)
  const { data, error } = await supabase
    .from("employee_training_sop_completions")
    .select("*")
    .in("employee_id", employeeIds)

  if (error || !data) return []
  return data
}

export async function listEmployeeModuleCertificationsForEmployeeIds(
  employeeIds: string[],
  client?: TypedSupabaseClient
): Promise<Tables<"employee_module_certifications">[]> {
  if (employeeIds.length === 0) return []
  const supabase = await getClient(client)
  const { data, error } = await supabase
    .from("employee_module_certifications")
    .select("*")
    .in("employee_id", employeeIds)

  if (error || !data) return []
  return data
}

export async function listManagerObservationsForEmployeeIds(
  employeeIds: string[],
  client?: TypedSupabaseClient
): Promise<Tables<"employee_manager_observations">[]> {
  if (employeeIds.length === 0) return []
  const supabase = await getClient(client)
  const { data, error } = await supabase
    .from("employee_manager_observations")
    .select("*")
    .in("employee_id", employeeIds)
    .order("observed_at", { ascending: false })

  if (error || !data) return []
  return data
}

export async function listEmployeeStandardQuizCompletionsForEmployeeIds(
  employeeIds: string[],
  client?: TypedSupabaseClient
): Promise<Tables<"employee_standard_quiz_completions">[]> {
  if (employeeIds.length === 0) return []
  const supabase = await getClient(client)
  const { data, error } = await supabase
    .from("employee_standard_quiz_completions")
    .select("*")
    .in("employee_id", employeeIds)

  if (error || !data) return []
  return data
}

export async function listEmployeeStandardQuizCompletions(
  employeeId: string,
  client?: TypedSupabaseClient
): Promise<Tables<"employee_standard_quiz_completions">[]> {
  return listEmployeeStandardQuizCompletionsForEmployeeIds([employeeId], client)
}

export async function resolveTrainingInviteByToken(
  token: string,
  client?: TypedSupabaseClient
) {
  const supabase = await getClient(client)
  const { data, error } = await supabase.rpc("resolve_training_invite", { p_token: token })
  if (error) return null
  return data
}

export async function listTrainingSopProgressForEmployee(
  employeeId: string,
  client?: TypedSupabaseClient
): Promise<Tables<"training_sop_progress">[]> {
  const supabase = await getClient(client)
  const { data, error } = await supabase
    .from("training_sop_progress")
    .select("*")
    .eq("employee_id", employeeId)

  if (error || !data) return []
  return data
}

export async function listTrainingPortalInvitesForModule(
  moduleId: string,
  client?: TypedSupabaseClient
): Promise<Tables<"training_portal_invites">[]> {
  const supabase = await getClient(client)
  const { data, error } = await supabase
    .from("training_portal_invites")
    .select("*")
    .eq("training_module_id", moduleId)
    .order("created_at", { ascending: false })

  if (error || !data) return []
  return data
}

export async function fetchSopsWithStepsForIds(
  sopIds: string[],
  client?: TypedSupabaseClient
): Promise<StandardWithSteps[]> {
  if (sopIds.length === 0) return []
  const supabase = await getClient(client)
  const { data, error } = await supabase
    .from("standards")
    .select("*, standard_steps(*), standard_media(*)")
    .in("id", sopIds)

  if (error || !data) return []
  return (data as unknown as StandardWithSteps[]).map((row) => ({
    ...row,
    standard_steps: [...(row.standard_steps ?? [])].sort((a, b) => a.step_order - b.step_order),
    standard_media: [...(row.standard_media ?? [])].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ),
  }))
}

export async function listEmployeeReadinessForBusiness(
  businessId: string,
  client?: TypedSupabaseClient
): Promise<Tables<"employee_readiness">[]> {
  const supabase = await getClient(client)
  const { data, error } = await supabase
    .from("employee_readiness")
    .select("*")
    .eq("business_id", businessId)

  if (error || !data) return []
  return data
}

/** Owner-only: creates default readiness rows for team members missing one. */
export async function ensureEmployeeReadinessRows(
  businessId: string,
  client?: TypedSupabaseClient
): Promise<void> {
  const supabase = await getClient(client)
  const profiles = await fetchProfilesForCurrentBusiness(supabase)
  const { data: biz } = await supabase
    .from("businesses")
    .select("owner_id")
    .eq("id", businessId)
    .maybeSingle()
  const ownerId = biz?.owner_id as string | undefined
  const team = profiles.filter(
    (p) => p.business_id === businessId || (ownerId && p.id === ownerId)
  )
  const dedup = new Map(team.map((p) => [p.id, p]))
  const uniqueTeam = [...dedup.values()]
  if (uniqueTeam.length === 0) return

  const { data: existing } = await supabase
    .from("employee_readiness")
    .select("employee_id")
    .eq("business_id", businessId)

  const have = new Set((existing ?? []).map((r) => r.employee_id))
  const missing = uniqueTeam.filter((p) => !have.has(p.id))
  if (missing.length === 0) return

  await supabase.from("employee_readiness").insert(
    missing.map((p) => ({
      business_id: businessId,
      employee_id: p.id,
      open_alone: "not_ready" as ReadinessBadge,
      close_alone: "not_ready" as ReadinessBadge,
      train_others: "not_ready" as ReadinessBadge,
      handle_complaints: "not_ready" as ReadinessBadge,
    }))
  )
}

/** Completed shift runs per employee — for readiness shift-observation signal. */
export async function countCompletedExecutionRecordsByEmployee(
  businessId: string,
  client?: TypedSupabaseClient
): Promise<Map<string, number>> {
  const supabase = await getClient(client)
  const { data, error } = await supabase
    .from("execution_records")
    .select("employee_id")
    .eq("business_id", businessId)
    .eq("status", "completed")

  const counts = new Map<string, number>()
  if (error || !data) return counts
  for (const row of data) {
    const id = row.employee_id as string
    counts.set(id, (counts.get(id) ?? 0) + 1)
  }
  return counts
}

export async function syncEmployeeTrainingModuleProgress(
  moduleId: string,
  employeeId: string,
  client?: TypedSupabaseClient
): Promise<void> {
  const supabase = await getClient(client)
  const trainingModule = await fetchTrainingModuleWithItems(moduleId, supabase)
  if (!trainingModule) return

  const requiredItems = (trainingModule.training_items ?? []).filter((t) => t.required)
  const requiredIds = requiredItems.map((t) => t.id)

  if (requiredIds.length === 0) {
    await supabase
      .from("training_progress")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("employee_id", employeeId)
      .eq("training_module_id", moduleId)

    const { data: progressRow } = await supabase
      .from("training_progress")
      .select("business_id")
      .eq("employee_id", employeeId)
      .eq("training_module_id", moduleId)
      .maybeSingle()

    if (progressRow?.business_id) {
      await syncEmployeeModuleCertification(supabase, {
        businessId: progressRow.business_id as string,
        employeeId,
        moduleId,
      })
    }
    return
  }

  const { data: completions } = await supabase
    .from("employee_training_sop_completions")
    .select("training_item_id")
    .eq("employee_id", employeeId)
    .in("training_item_id", requiredIds)

  const done = new Set((completions ?? []).map((c) => c.training_item_id))
  const n = requiredIds.filter((id) => done.has(id)).length

  let status: TrainingProgressStatus = "not_started"
  if (n === requiredIds.length) status = "completed"
  else if (n > 0) status = "in_progress"

  await supabase
    .from("training_progress")
    .update({
      status,
      completed_at: status === "completed" ? new Date().toISOString() : null,
    })
    .eq("employee_id", employeeId)
    .eq("training_module_id", moduleId)

  const { data: progressRow } = await supabase
    .from("training_progress")
    .select("business_id")
    .eq("employee_id", employeeId)
    .eq("training_module_id", moduleId)
    .maybeSingle()

  if (progressRow?.business_id) {
    await syncEmployeeModuleCertification(supabase, {
      businessId: progressRow.business_id as string,
      employeeId,
      moduleId,
    })
  }
}

export async function listDailyChecklistsForBusiness(
  businessId: string,
  options?: { type?: DailyChecklistType },
  client?: TypedSupabaseClient
): Promise<Tables<"daily_checklists">[]> {
  const supabase = await getClient(client)
  let q = supabase
    .from("daily_checklists")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })

  if (options?.type) {
    q = q.eq("type", options.type)
  }

  const { data, error } = await q
  if (error || !data) return []
  return data
}

export async function fetchDailyChecklistWithItems(
  checklistId: string,
  client?: TypedSupabaseClient
): Promise<DailyChecklistWithItems | null> {
  const supabase = await getClient(client)
  const { data, error } = await supabase
    .from("daily_checklists")
    .select("*, daily_checklist_items(*)")
    .eq("id", checklistId)
    .maybeSingle()

  if (error || !data) return null

  const row = data as unknown as DailyChecklistWithItems
  const items = [...(row.daily_checklist_items ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order
  )
  return { ...row, daily_checklist_items: items }
}

export async function listDailyRunsForBusiness(
  businessId: string,
  options?: { limit?: number },
  client?: TypedSupabaseClient
): Promise<Tables<"execution_records">[]> {
  const supabase = await getClient(client)
  let q = supabase
    .from("execution_records")
    .select("*")
    .eq("business_id", businessId)
    .order("started_at", { ascending: false })

  if (options?.limit) {
    q = q.limit(options.limit)
  }

  const { data, error } = await q
  if (error || !data) return []
  return data
}

export type RecentExecutionProofRow = {
  id: string
  completed_at: string | null
  shift_date: string
  checklist_title: string | null
  checklist_type: string | null
}

/** Completed execution records (daily runs), most recent first — for dashboard execution proof. */
export async function listRecentCompletedExecutionRecords(
  businessId: string,
  limit: number,
  client?: TypedSupabaseClient
): Promise<RecentExecutionProofRow[]> {
  const supabase = await getClient(client)
  const { data: runs, error: runErr } = await supabase
    .from("execution_records")
    .select("id, completed_at, shift_date, checklist_id")
    .eq("business_id", businessId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(limit)

  if (runErr || !runs?.length) return []

  const checklistIds = [...new Set(runs.map((r) => r.checklist_id as string))]
  const { data: cls } = await supabase
    .from("daily_checklists")
    .select("id, title, type")
    .in("id", checklistIds)

  const byId = new Map((cls ?? []).map((c) => [c.id as string, c]))

  return runs.map((r) => {
    const cl = byId.get(r.checklist_id as string)
    return {
      id: r.id as string,
      completed_at: r.completed_at,
      shift_date: r.shift_date as string,
      checklist_title: cl?.title ?? null,
      checklist_type: cl?.type ?? null,
    }
  })
}

export async function listIssuesForBusiness(
  businessId: string,
  options?: {
    status?: IssueStatus
    limit?: number
    executionRecordId?: string
    ownerRequired?: boolean
    /** Open or in_progress */
    unresolved?: boolean
    /** Status resolved only */
    resolvedOnly?: boolean
  },
  client?: TypedSupabaseClient
): Promise<Tables<"bottlenecks">[]> {
  const supabase = await getClient(client)
  let q = supabase
    .from("bottlenecks")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })

  if (options?.status) {
    q = q.eq("status", options.status)
  }
  if (options?.unresolved) {
    q = q.in("status", ["not_started", "investigating", "fix_in_progress"])
  }
  if (options?.resolvedOnly) {
    q = q.eq("status", "resolved")
  }
  if (options?.ownerRequired) {
    q = q.eq("owner_required", true)
  }
  if (options?.executionRecordId) {
    q = q.eq("execution_record_id", options.executionRecordId)
  }
  if (options?.limit) {
    q = q.limit(options.limit)
  }

  const { data, error } = await q
  if (error || !data) return []
  return data
}

export async function fetchIssueById(
  issueId: string,
  client?: TypedSupabaseClient
): Promise<Tables<"bottlenecks"> | null> {
  const supabase = await getClient(client)
  const { data, error } = await supabase.from("bottlenecks").select("*").eq("id", issueId).maybeSingle()

  if (error) return null
  return data
}

export async function listIssueLinksForBottleneck(
  bottleneckId: string,
  client?: TypedSupabaseClient
): Promise<Tables<"issue_links">[]> {
  const supabase = await getClient(client)
  const { data, error } = await supabase
    .from("issue_links")
    .select("*")
    .eq("bottleneck_id", bottleneckId)
    .order("created_at", { ascending: true })

  if (error || !data) return []
  return data
}

export async function listIssueLinksForBottleneckIds(
  bottleneckIds: string[],
  client?: TypedSupabaseClient
): Promise<Tables<"issue_links">[]> {
  if (bottleneckIds.length === 0) return []
  const supabase = await getClient(client)
  const { data, error } = await supabase
    .from("issue_links")
    .select("*")
    .in("bottleneck_id", bottleneckIds)
    .order("created_at", { ascending: true })

  if (error || !data) return []
  return data
}

export async function insertIssueLink(
  row: TablesInsert<"issue_links">,
  client?: TypedSupabaseClient
): Promise<Tables<"issue_links"> | null> {
  const supabase = await getClient(client)
  const { data, error } = await supabase.from("issue_links").insert(row).select("*").maybeSingle()

  if (error) return null
  return data
}

export async function deleteIssueLinkById(
  linkId: string,
  client?: TypedSupabaseClient
): Promise<boolean> {
  const supabase = await getClient(client)
  const { error } = await supabase.from("issue_links").delete().eq("id", linkId)

  return !error
}

export async function listIssueLifecycleEvents(
  bottleneckId: string,
  client?: TypedSupabaseClient
): Promise<Tables<"issue_lifecycle_events">[]> {
  const supabase = await getClient(client)
  const { data, error } = await supabase
    .from("issue_lifecycle_events")
    .select("*")
    .eq("bottleneck_id", bottleneckId)
    .order("created_at", { ascending: true })

  if (error || !data) return []
  return data
}

export async function upsertIssueLifecycleEvent(
  row: Omit<TablesInsert<"issue_lifecycle_events">, "id" | "created_at">,
  client?: TypedSupabaseClient
): Promise<void> {
  const supabase = await getClient(client)
  await supabase.from("issue_lifecycle_events").upsert(row, {
    onConflict: "bottleneck_id,stage",
  })
}

export async function recordIssueLifecycleLogged(
  bottleneckId: string,
  businessId: string,
  detail?: string,
  client?: TypedSupabaseClient
): Promise<void> {
  await upsertIssueLifecycleEvent(
    {
      bottleneck_id: bottleneckId,
      business_id: businessId,
      stage: "logged",
      detail: detail ?? "Issue captured.",
    },
    client
  )
}

export async function recordIssueLifecycleStage(
  bottleneckId: string,
  businessId: string,
  stage: IssueLifecycleStage,
  detail?: string,
  client?: TypedSupabaseClient
): Promise<void> {
  if (stage === "logged") {
    await recordIssueLifecycleLogged(bottleneckId, businessId, detail, client)
    return
  }
  await upsertIssueLifecycleEvent(
    {
      bottleneck_id: bottleneckId,
      business_id: businessId,
      stage,
      detail: detail ?? null,
    },
    client
  )
}

/** Count issues where the owner was flagged, created on/after `sinceIso` (inclusive). */
export async function countOwnerRequiredIssuesSince(
  businessId: string,
  sinceIso: string,
  client?: TypedSupabaseClient
): Promise<number> {
  const supabase = await getClient(client)
  const { count, error } = await supabase
    .from("bottlenecks")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("owner_required", true)
    .gte("created_at", sinceIso)

  if (error || count === null) return 0
  return count
}

export async function fetchLatestDependencyAssessment(
  businessId: string,
  client?: TypedSupabaseClient
): Promise<Tables<"reality_checks"> | null> {
  const supabase = await getClient(client)
  const { data, error } = await supabase
    .from("reality_checks")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return null
  return data
}

/** Insert a draft standard; `created_by` must match the signed-in user (enforced in RLS). */
export async function insertSop(
  row: Omit<TablesInsert<"standards">, "created_by">,
  client?: TypedSupabaseClient
): Promise<Tables<"standards"> | null> {
  const supabase = await getClient(client)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from("standards")
    .insert({ ...row, created_by: user.id })
    .select("*")
    .single()

  if (error) return null
  return data
}

export async function updateSopStatus(
  sopId: string,
  status: StandardStatus,
  client?: TypedSupabaseClient
): Promise<boolean> {
  const supabase = await getClient(client)
  const { error } = await supabase.from("standards").update({ status }).eq("id", sopId)

  return !error
}

export async function insertIssue(
  row: Omit<TablesInsert<"bottlenecks">, "reported_by">,
  client?: TypedSupabaseClient
): Promise<Tables<"bottlenecks"> | null> {
  const supabase = await getClient(client)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from("bottlenecks")
    .insert({ ...row, reported_by: user.id })
    .select("*")
    .single()

  if (error) return null
  return data
}

export async function insertDependencyAssessment(
  row: TablesInsert<"reality_checks">,
  client?: TypedSupabaseClient
): Promise<Tables<"reality_checks"> | null> {
  const supabase = await getClient(client)
  const { data, error } = await supabase
    .from("reality_checks")
    .insert(row)
    .select("*")
    .single()

  if (error) return null
  return data
}

/** Oldest checklist of a type is treated as the canonical store template. */
export async function fetchOldestDailyChecklistWithItemsByType(
  businessId: string,
  type: DailyChecklistType,
  client?: TypedSupabaseClient
): Promise<DailyChecklistWithItems | null> {
  const supabase = await getClient(client)
  const { data: lists, error } = await supabase
    .from("daily_checklists")
    .select("id")
    .eq("business_id", businessId)
    .eq("type", type)
    .order("created_at", { ascending: true })
    .limit(1)

  if (error || !lists?.[0]) return null
  return fetchDailyChecklistWithItems(lists[0].id, supabase)
}

/** Seeds default opening/closing templates when missing; any business member may run. */
export async function ensureDefaultDailyChecklists(
  businessId: string,
  client?: TypedSupabaseClient
): Promise<void> {
  const supabase = await getClient(client)

  const opening = await listDailyChecklistsForBusiness(businessId, { type: "opening" }, supabase)
  if (opening.length === 0) {
    const { data: cl, error: cErr } = await supabase
      .from("daily_checklists")
      .insert({
        business_id: businessId,
        title: "Opening",
        type: "opening",
      })
      .select("id")
      .single()
    if (cErr || !cl) return
    const checklistId = cl.id as string
    await supabase.from("daily_checklist_items").insert(
      DEFAULT_OPENING_CHECKLIST_ITEMS.map((row) => ({
        ...row,
        checklist_id: checklistId,
      }))
    )
  }

  const closing = await listDailyChecklistsForBusiness(businessId, { type: "closing" }, supabase)
  if (closing.length === 0) {
    const { data: cl, error: cErr } = await supabase
      .from("daily_checklists")
      .insert({
        business_id: businessId,
        title: "Closing",
        type: "closing",
      })
      .select("id")
      .single()
    if (cErr || !cl) return
    const checklistId = cl.id as string
    await supabase.from("daily_checklist_items").insert(
      DEFAULT_CLOSING_CHECKLIST_ITEMS.map((row) => ({
        ...row,
        checklist_id: checklistId,
      }))
    )
  }
}

export async function listDailyRunsForChecklistOnDate(
  checklistId: string,
  businessId: string,
  shiftDate: string,
  client?: TypedSupabaseClient
): Promise<Tables<"execution_records">[]> {
  const supabase = await getClient(client)
  const { data, error } = await supabase
    .from("execution_records")
    .select("*")
    .eq("checklist_id", checklistId)
    .eq("business_id", businessId)
    .eq("shift_date", shiftDate)
    .order("started_at", { ascending: false })

  if (error || !data) return []
  return data
}

export type DailyRunItemWithLine = Tables<"execution_record_items"> & {
  line: Tables<"daily_checklist_items">
}

export async function fetchDailyRunItemsWithLines(
  runId: string,
  client?: TypedSupabaseClient
): Promise<DailyRunItemWithLine[]> {
  const supabase = await getClient(client)
  const { data, error } = await supabase
    .from("execution_record_items")
    .select(
      "id, execution_record_id, checklist_item_id, completed, photo_url, note, completed_at, completed_by, daily_checklist_items (*)"
    )
    .eq("execution_record_id", runId)

  if (error || !data) return []

  type Row = Tables<"execution_record_items"> & {
    daily_checklist_items: Tables<"daily_checklist_items">
  }

  return (data as unknown as Row[])
    .map((row) => {
      const { daily_checklist_items: line, ...rest } = row
      return { ...rest, line } as DailyRunItemWithLine
    })
    .sort((a, b) => a.line.sort_order - b.line.sort_order)
}

export async function fetchActiveOwnerEscapePlan(
  businessId: string,
  client?: TypedSupabaseClient
): Promise<Tables<"owner_escape_plans"> | null> {
  const supabase = await getClient(client)
  const { data, error } = await supabase
    .from("owner_escape_plans")
    .select("*")
    .eq("business_id", businessId)
    .eq("status", "active")
    .maybeSingle()

  if (error) return null
  return data
}

/** Active plan, or the most recent completed plan so the journey stays visible after the arc ends. */
export async function fetchPrimaryOwnerEscapePlan(
  businessId: string,
  client?: TypedSupabaseClient
): Promise<Tables<"owner_escape_plans"> | null> {
  const active = await fetchActiveOwnerEscapePlan(businessId, client)
  if (active) return active

  const supabase = await getClient(client)
  const { data, error } = await supabase
    .from("owner_escape_plans")
    .select("*")
    .eq("business_id", businessId)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return null
  return data
}

export async function listOwnerEscapePlanTasks(
  planId: string,
  client?: TypedSupabaseClient
): Promise<Tables<"owner_escape_plan_tasks">[]> {
  const supabase = await getClient(client)
  const { data, error } = await supabase
    .from("owner_escape_plan_tasks")
    .select("*")
    .eq("plan_id", planId)
    .order("week_number", { ascending: true })
    .order("sort_order", { ascending: true })

  if (error || !data) return []
  return data
}

export async function archiveActiveOwnerEscapePlans(
  businessId: string,
  client?: TypedSupabaseClient
): Promise<void> {
  const supabase = await getClient(client)
  await supabase
    .from("owner_escape_plans")
    .update({ status: "archived" as EscapePlanStatus })
    .eq("business_id", businessId)
    .eq("status", "active")
}

export async function countIncompleteOwnerEscapePlanTasks(
  planId: string,
  client?: TypedSupabaseClient
): Promise<number> {
  const supabase = await getClient(client)
  const { count, error } = await supabase
    .from("owner_escape_plan_tasks")
    .select("id", { count: "exact", head: true })
    .eq("plan_id", planId)
    .is("completed_at", null)

  if (error || count === null) return 0
  return count
}

export async function fetchOwnerEscapePlanById(
  planId: string,
  client?: TypedSupabaseClient
): Promise<Tables<"owner_escape_plans"> | null> {
  const supabase = await getClient(client)
  const { data, error } = await supabase
    .from("owner_escape_plans")
    .select("*")
    .eq("id", planId)
    .maybeSingle()

  if (error) return null
  return data
}

export async function listOwnerInterruptionsForBusinessSince(
  businessId: string,
  sinceIso: string,
  client?: TypedSupabaseClient
): Promise<Tables<"owner_interruptions">[]> {
  const supabase = await getClient(client)
  const { data, error } = await supabase
    .from("owner_interruptions")
    .select("*")
    .eq("business_id", businessId)
    .gte("occurred_at", sinceIso)
    .order("occurred_at", { ascending: false })
    .limit(800)

  if (error || !data) return []
  return data
}

export async function listOwnerInterruptionsForBusiness(
  businessId: string,
  options?: { limit?: number },
  client?: TypedSupabaseClient
): Promise<Tables<"owner_interruptions">[]> {
  const supabase = await getClient(client)
  let q = supabase
    .from("owner_interruptions")
    .select("*")
    .eq("business_id", businessId)
    .order("occurred_at", { ascending: false })

  if (options?.limit) {
    q = q.limit(options.limit)
  } else {
    q = q.limit(200)
  }

  const { data, error } = await q
  if (error || !data) return []
  return data
}

type OwnerInterruptionRowInsert = TablesInsert<"owner_interruptions">
export type OwnerInterruptionInsertSelf = Omit<OwnerInterruptionRowInsert, "logged_by">

export async function insertOwnerInterruption(
  row: OwnerInterruptionInsertSelf,
  client?: TypedSupabaseClient
): Promise<Tables<"owner_interruptions"> | null> {
  const supabase = await getClient(client)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from("owner_interruptions")
    .insert({ ...row, logged_by: user.id })
    .select("*")
    .single()

  if (error) return null
  return data
}

export async function fetchOwnerInterruptionById(
  id: string,
  client?: TypedSupabaseClient
): Promise<Tables<"owner_interruptions"> | null> {
  const supabase = await getClient(client)
  const { data, error } = await supabase.from("owner_interruptions").select("*").eq("id", id).maybeSingle()
  if (error || !data) return null
  return data
}

type InterruptionActionPlanInsert = TablesInsert<"interruption_action_plans">

export async function insertInterruptionActionPlan(
  row: Omit<InterruptionActionPlanInsert, "id" | "created_at" | "updated_at">,
  client?: TypedSupabaseClient
): Promise<Tables<"interruption_action_plans"> | null> {
  const supabase = await getClient(client)
  const { data, error } = await supabase.from("interruption_action_plans").insert(row).select("*").single()
  if (error) return null
  return data
}

export async function updateInterruptionActionPlan(
  id: string,
  patch: TablesUpdate<"interruption_action_plans">,
  client?: TypedSupabaseClient
): Promise<Tables<"interruption_action_plans"> | null> {
  const supabase = await getClient(client)
  const { data, error } = await supabase
    .from("interruption_action_plans")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single()
  if (error) return null
  return data
}

export async function listInterruptionActionPlansForBusiness(
  businessId: string,
  client?: TypedSupabaseClient
): Promise<Tables<"interruption_action_plans">[]> {
  const supabase = await getClient(client)
  const { data, error } = await supabase
    .from("interruption_action_plans")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
  if (error) return []
  return data ?? []
}

/** Standard IDs that have at least one row in `standard_media`. */
export async function listStandardIdsWithMediaForBusiness(
  businessId: string,
  client?: TypedSupabaseClient
): Promise<Set<string>> {
  const supabase = await getClient(client)
  const { data: standards, error: standardsError } = await supabase
    .from("standards")
    .select("id")
    .eq("business_id", businessId)
  if (standardsError || !standards?.length) return new Set()

  const ids = standards.map((s) => s.id)
  const { data: media, error: mediaError } = await supabase
    .from("standard_media")
    .select("standard_id")
    .in("standard_id", ids)
  if (mediaError) return new Set()

  return new Set((media ?? []).map((m) => m.standard_id))
}

export async function fetchInterruptionActionPlanByInterruptionId(
  interruptionId: string,
  client?: TypedSupabaseClient
): Promise<Tables<"interruption_action_plans"> | null> {
  const supabase = await getClient(client)
  const { data, error } = await supabase
    .from("interruption_action_plans")
    .select("*")
    .eq("interruption_id", interruptionId)
    .maybeSingle()
  if (error || !data) return null
  return data
}

export async function listStandardsWithStepsForBusiness(
  businessId: string,
  client?: TypedSupabaseClient
): Promise<StandardWithSteps[]> {
  const supabase = await getClient(client)
  const { data, error } = await supabase
    .from("standards")
    .select("*, standard_steps(*)")
    .eq("business_id", businessId)
    .order("updated_at", { ascending: false })

  if (error || !data) return []
  return (data as unknown as StandardWithSteps[]).map((row) => ({
    ...row,
    standard_steps: [...(row.standard_steps ?? [])].sort((a, b) => a.step_order - b.step_order),
  }))
}

export async function listStandardMediaForBusiness(
  businessId: string,
  client?: TypedSupabaseClient
): Promise<Tables<"standard_media">[]> {
  const supabase = await getClient(client)
  const { data, error } = await supabase
    .from("standard_media")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })

  if (error || !data) return []
  return data
}

export async function listRivetAskQueriesForBusinessSearch(
  businessId: string,
  limit = 150,
  client?: TypedSupabaseClient
): Promise<
  Pick<
    Tables<"rivet_ask_queries">,
    "id" | "question_text" | "standard_id" | "response" | "created_at"
  >[]
> {
  const supabase = await getClient(client)
  const { data, error } = await supabase
    .from("rivet_ask_queries")
    .select("id, question_text, standard_id, response, created_at")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error || !data) return []
  return data
}

export async function listTeamSuccessionRolesForBusiness(
  businessId: string,
  client?: TypedSupabaseClient
): Promise<Tables<"team_succession_roles">[]> {
  const supabase = await getClient(client)
  const { data, error } = await supabase
    .from("team_succession_roles")
    .select("*")
    .eq("business_id", businessId)
    .order("sort_order", { ascending: true })
    .order("role_label", { ascending: true })

  if (error || !data) return []
  return data
}

export async function listEmployeeModuleCertificationsForBusiness(
  businessId: string,
  client?: TypedSupabaseClient
): Promise<Tables<"employee_module_certifications">[]> {
  const supabase = await getClient(client)
  const { data, error } = await supabase
    .from("employee_module_certifications")
    .select("*")
    .eq("business_id", businessId)

  if (error || !data) return []
  return data
}

export async function listAskQueriesForBusinessSince(
  businessId: string,
  sinceIso: string,
  client?: TypedSupabaseClient
): Promise<
  Pick<
    Tables<"rivet_ask_queries">,
    "question_text" | "normalized_question" | "standard_id" | "response" | "created_at"
  >[]
> {
  const supabase = await getClient(client)
  const { data, error } = await supabase
    .from("rivet_ask_queries")
    .select("question_text, normalized_question, standard_id, response, created_at")
    .eq("business_id", businessId)
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false })
  if (error) return []
  return data ?? []
}

type StandardPlayViewInsert = TablesInsert<"standard_play_views">

export async function insertStandardPlayView(
  row: Omit<StandardPlayViewInsert, "id" | "created_at">,
  client?: TypedSupabaseClient
): Promise<void> {
  const supabase = await getClient(client)
  await supabase.from("standard_play_views").insert(row)
}

export async function listStandardPlayViewsForBusinessSince(
  businessId: string,
  sinceIso: string,
  client?: TypedSupabaseClient
): Promise<Pick<Tables<"standard_play_views">, "standard_id" | "viewed_by" | "created_at">[]> {
  const supabase = await getClient(client)
  const { data, error } = await supabase
    .from("standard_play_views")
    .select("standard_id, viewed_by, created_at")
    .eq("business_id", businessId)
    .gte("created_at", sinceIso)
  if (error) return []
  return data ?? []
}
