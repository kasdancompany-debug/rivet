"use server"

import { revalidatePath } from "next/cache"

import { quickCaptureAndSaveDraft } from "@/app/actions/quick-capture"
import { saveTrainingModule } from "@/app/actions/training"
import {
  analyzeInterruptionForActionPlan,
  resolveAffectedPeople,
} from "@/lib/owner-interruptions/action-plan/analyze-interruption"
import { enrichInterruptionActionPlanView } from "@/lib/owner-interruptions/action-plan/enrich-action-plan-view"
import type { InterruptionActionPlanView } from "@/lib/owner-interruptions/action-plan/types"
import { normalizeSummaryKey } from "@/lib/owner-interruptions/normalize-summary"
import {
  fetchBusinessForCurrentUser,
  fetchCurrentProfile,
  fetchOwnerInterruptionById,
  fetchProfilesForCurrentBusiness,
  insertInterruptionActionPlan,
  listAskQueriesForBusinessSince,
  listOwnerInterruptionsForBusinessSince,
  listSopsForBusiness,
  listStandardIdsWithMediaForBusiness,
  listTrainingModulesForBusiness,
  listTrainingProgressForBusinessModules,
  updateInterruptionActionPlan,
} from "@/lib/db/queries"
import { isWorkspaceOwner } from "@/lib/ops/workspace-role"
import { utcDaysAgoMidnightIso } from "@/lib/time/utc-week"
import { createClient } from "@/lib/supabase/server"
import type { Json, Tables } from "@/types/database"

function revalidateInterruptionPaths() {
  revalidatePath("/interruptions")
  revalidatePath("/interruptions/log")
  revalidatePath("/dashboard")
  revalidatePath("/sops")
  revalidatePath("/training")
  revalidatePath("/ask")
}

async function loadActionPlanContext(businessId: string, interruptionId: string) {
  const supabase = await createClient()
  const historySinceIso = utcDaysAgoMidnightIso(60)

  const [interruption, historyRows, standards, modules, profiles, profile, askQueries, standardIdsWithMedia] =
    await Promise.all([
      fetchOwnerInterruptionById(interruptionId, supabase),
      listOwnerInterruptionsForBusinessSince(businessId, historySinceIso, supabase),
      listSopsForBusiness(businessId, undefined, supabase),
      listTrainingModulesForBusiness(businessId, supabase),
      fetchProfilesForCurrentBusiness(supabase),
      fetchCurrentProfile(supabase),
      listAskQueriesForBusinessSince(businessId, utcDaysAgoMidnightIso(90), supabase),
      listStandardIdsWithMediaForBusiness(businessId, supabase),
    ])

  const business = await fetchBusinessForCurrentUser(supabase)
  if (!business || business.id !== businessId || !interruption) {
    return null
  }

  const moduleIds = modules.map((m) => m.id)
  const trainingProgress =
    moduleIds.length > 0
      ? await listTrainingProgressForBusinessModules(moduleIds, supabase)
      : []

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return {
    supabase,
    business,
    user,
    profile,
    interruption,
    historyRows,
    standards,
    modules,
    trainingProgress,
    askQueries,
    standardIdsWithMedia,
    profiles,
    isOwner: user ? isWorkspaceOwner(user.id, business, profile) : false,
  }
}

function viewFromContext(
  ctx: NonNullable<Awaited<ReturnType<typeof loadActionPlanContext>>>,
  plan: Tables<"interruption_action_plans">
): InterruptionActionPlanView {
  return enrichInterruptionActionPlanView({
    plan,
    interruption: ctx.interruption,
    historyRows: ctx.historyRows,
    standards: ctx.standards.map((s) => ({ id: s.id, title: s.title, status: s.status })),
    modules: ctx.modules.map((m) => ({ id: m.id, title: m.title })),
    trainingProgress: ctx.trainingProgress,
    askQueries: ctx.askQueries,
    standardIdsWithMedia: ctx.standardIdsWithMedia,
    isOwner: ctx.isOwner,
  })
}

export async function createInterruptionActionPlan(payload: {
  businessId: string
  interruptionId: string
}): Promise<{ ok: true; plan: InterruptionActionPlanView } | { ok: false; message: string }> {
  try {
    const ctx = await loadActionPlanContext(payload.businessId, payload.interruptionId)
    if (!ctx) return { ok: false, message: "Could not find that pull." }

    const { interruption, historyRows, standards, modules, profiles, isOwner, supabase } = ctx

    const loggerProfile = profiles.find((p) => p.id === interruption.logged_by) ?? null
    const analysis = analyzeInterruptionForActionPlan({
      interruption,
      historyRows,
      standards,
      modules,
      loggerProfile,
    })

    const affectedPeople = resolveAffectedPeople({
      profiles: profiles.filter((p) => p.business_id === ctx.business.id || p.id === ctx.business.owner_id),
      businessOwnerId: ctx.business.owner_id,
      loggerId: interruption.logged_by,
      loggerRole: loggerProfile?.role ?? null,
      inferredRoles: analysis.inferredRoles,
    })

    let draftStandardId: string | null = null
    let draftModuleId: string | null = null

    if (analysis.fixType === "sop") {
      const draft = await quickCaptureAndSaveDraft({
        businessId: payload.businessId,
        text: analysis.capturePrompt,
      })
      if (draft.ok) draftStandardId = draft.id
    } else if (isOwner) {
      const module = await saveTrainingModule({
        businessId: payload.businessId,
        title: analysis.suggestedTitle,
        description: analysis.suggestedDescription,
        assignedRole: analysis.inferredRoles[0] ?? null,
      })
      if (module.ok) draftModuleId = module.id
    }

    const patternKey = normalizeSummaryKey(interruption.summary)

    const inserted = await insertInterruptionActionPlan(
      {
        business_id: payload.businessId,
        interruption_id: payload.interruptionId,
        status: "draft",
        fix_type: analysis.fixType,
        root_cause: analysis.rootCause,
        suggested_title: analysis.suggestedTitle,
        suggested_description: analysis.suggestedDescription,
        related_standard_id: analysis.relatedStandard?.id ?? null,
        related_module_id: analysis.relatedModule?.id ?? null,
        draft_standard_id: draftStandardId,
        draft_module_id: draftModuleId,
        affected_people: affectedPeople as unknown as Json,
        ai_payload: {
          capturePrompt: analysis.capturePrompt,
          repeatCount: analysis.repeatCount,
          inferredRoles: analysis.inferredRoles,
          relatedStandard: analysis.relatedStandard,
          relatedModule: analysis.relatedModule,
          patternKey,
        } as Json,
      },
      supabase
    )

    if (!inserted) return { ok: false, message: "Could not save the action plan." }

    revalidateInterruptionPaths()

    return {
      ok: true,
      plan: viewFromContext(ctx, inserted),
    }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}

export async function approveInterruptionActionPlan(
  planId: string
): Promise<{ ok: true; plan: InterruptionActionPlanView } | { ok: false; message: string }> {
  return updatePlanStatus(planId, "approved")
}

export async function publishInterruptionActionPlan(
  planId: string
): Promise<{ ok: true; plan: InterruptionActionPlanView; editHref: string | null } | { ok: false; message: string }> {
  try {
    const supabase = await createClient()
    const gate = await requireOwner(supabase)
    if (!gate.ok) return gate

    const existing = await fetchActionPlanForBusiness(planId, gate.business.id, supabase)
    if (!existing) return { ok: false, message: "Action plan not found." }
    if (existing.status !== "approved") {
      return { ok: false, message: "Approve the fix plan before publishing." }
    }

    const ctx = await loadActionPlanContext(gate.business.id, existing.interruption_id)
    if (!ctx) return { ok: false, message: "Could not load interruption context." }

    const patternKey = normalizeSummaryKey(ctx.interruption.summary)
    const publishedAt = new Date()
    const beforeWindowStart = new Date(publishedAt)
    beforeWindowStart.setUTCDate(beforeWindowStart.getUTCDate() - 14)

    const baselineRepeatCount = ctx.historyRows.filter((row) => {
      if (normalizeSummaryKey(row.summary) !== patternKey) return false
      const at = new Date(row.occurred_at)
      return at >= beforeWindowStart && at <= publishedAt
    }).length

    const priorPayload =
      existing.ai_payload && typeof existing.ai_payload === "object" && !Array.isArray(existing.ai_payload)
        ? (existing.ai_payload as Record<string, unknown>)
        : {}

    const updated = await updateInterruptionActionPlan(
      planId,
      {
        status: "published",
        published_at: publishedAt.toISOString(),
        ai_payload: {
          ...priorPayload,
          patternKey,
          baselineRepeatCount,
        } as Json,
      },
      supabase
    )
    if (!updated) return { ok: false, message: "Could not publish." }

    revalidateInterruptionPaths()

    const view = viewFromContext(ctx, updated)

    return {
      ok: true,
      plan: view,
      editHref: view.draftEditHref,
    }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}

export async function dismissInterruptionActionPlan(
  planId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const supabase = await createClient()
    const gate = await requireOwner(supabase)
    if (!gate.ok) return gate

    const existing = await fetchActionPlanForBusiness(planId, gate.business.id, supabase)
    if (!existing) return { ok: false, message: "Action plan not found." }

    const updated = await updateInterruptionActionPlan(planId, { status: "dismissed" }, supabase)
    if (!updated) return { ok: false, message: "Could not dismiss." }

    revalidateInterruptionPaths()
    return { ok: true }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}

async function requireOwner(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, message: "You need to be signed in." }
  const business = await fetchBusinessForCurrentUser(supabase)
  const profile = await fetchCurrentProfile(supabase)
  if (!business) return { ok: false as const, message: "No business linked." }
  if (!isWorkspaceOwner(user.id, business, profile)) {
    return { ok: false as const, message: "Only the owner can do that." }
  }
  return { ok: true as const, user, business, profile }
}

async function fetchActionPlanForBusiness(
  planId: string,
  businessId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const { data, error } = await supabase
    .from("interruption_action_plans")
    .select("*")
    .eq("id", planId)
    .eq("business_id", businessId)
    .maybeSingle()
  if (error || !data) return null
  return data
}

async function updatePlanStatus(
  planId: string,
  status: "approved"
): Promise<{ ok: true; plan: InterruptionActionPlanView } | { ok: false; message: string }> {
  try {
    const supabase = await createClient()
    const gate = await requireOwner(supabase)
    if (!gate.ok) return gate

    const existing = await fetchActionPlanForBusiness(planId, gate.business.id, supabase)
    if (!existing) return { ok: false, message: "Action plan not found." }
    if (existing.status !== "draft") {
      return { ok: false, message: "This plan was already reviewed." }
    }

    const updated = await updateInterruptionActionPlan(
      planId,
      {
        status,
        approved_by: gate.user.id,
        approved_at: new Date().toISOString(),
      },
      supabase
    )
    if (!updated) return { ok: false, message: "Could not approve." }

    const ctx = await loadActionPlanContext(gate.business.id, existing.interruption_id)
    if (!ctx) return { ok: false, message: "Could not load interruption context." }

    revalidateInterruptionPaths()

    return {
      ok: true,
      plan: viewFromContext(ctx, updated),
    }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}
