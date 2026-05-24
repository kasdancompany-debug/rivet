"use server"

import { revalidatePath } from "next/cache"

import { quickCaptureAndSaveDraft } from "@/app/actions/quick-capture"
import { saveTrainingModule } from "@/app/actions/training"
import {
  analyzeInterruptionForActionPlan,
  resolveAffectedPeople,
} from "@/lib/owner-interruptions/action-plan/analyze-interruption"
import { buildInterruptionActionPlanView } from "@/lib/owner-interruptions/action-plan/build-action-plan-view"
import type { InterruptionActionPlanView } from "@/lib/owner-interruptions/action-plan/types"
import {
  fetchBusinessForCurrentUser,
  fetchCurrentProfile,
  fetchOwnerInterruptionById,
  fetchProfilesForCurrentBusiness,
  insertInterruptionActionPlan,
  listOwnerInterruptionsForBusinessSince,
  listSopsForBusiness,
  listTrainingModulesForBusiness,
  updateInterruptionActionPlan,
} from "@/lib/db/queries"
import { isWorkspaceOwner } from "@/lib/ops/workspace-role"
import { utcDaysAgoMidnightIso } from "@/lib/time/utc-week"
import { createClient } from "@/lib/supabase/server"
import type { Json } from "@/types/database"

function revalidateInterruptionPaths() {
  revalidatePath("/interruptions")
  revalidatePath("/interruptions/log")
  revalidatePath("/dashboard")
  revalidatePath("/sops")
  revalidatePath("/training")
}

export async function createInterruptionActionPlan(payload: {
  businessId: string
  interruptionId: string
}): Promise<{ ok: true; plan: InterruptionActionPlanView } | { ok: false; message: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, message: "You need to be signed in." }

    const business = await fetchBusinessForCurrentUser(supabase)
    if (!business || business.id !== payload.businessId) {
      return { ok: false, message: "No business linked." }
    }

    const interruption = await fetchOwnerInterruptionById(payload.interruptionId, supabase)
    if (!interruption || interruption.business_id !== payload.businessId) {
      return { ok: false, message: "Could not find that pull." }
    }

    const [historyRows, standards, modules, profiles, profile] = await Promise.all([
      listOwnerInterruptionsForBusinessSince(payload.businessId, utcDaysAgoMidnightIso(20), supabase),
      listSopsForBusiness(payload.businessId, undefined, supabase),
      listTrainingModulesForBusiness(payload.businessId, supabase),
      fetchProfilesForCurrentBusiness(supabase),
      fetchCurrentProfile(supabase),
    ])

    const loggerProfile = profiles.find((p) => p.id === interruption.logged_by) ?? null
    const analysis = analyzeInterruptionForActionPlan({
      interruption,
      historyRows,
      standards,
      modules,
      loggerProfile,
    })

    const affectedPeople = resolveAffectedPeople({
      profiles: profiles.filter((p) => p.business_id === business.id || p.id === business.owner_id),
      businessOwnerId: business.owner_id,
      loggerId: interruption.logged_by,
      loggerRole: loggerProfile?.role ?? null,
      inferredRoles: analysis.inferredRoles,
    })

    const isOwner = isWorkspaceOwner(user.id, business, profile)
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
        } as Json,
      },
      supabase
    )

    if (!inserted) return { ok: false, message: "Could not save the action plan." }

    revalidateInterruptionPaths()

    return {
      ok: true,
      plan: buildInterruptionActionPlanView({
        plan: inserted,
        relatedStandard: analysis.relatedStandard,
        relatedModule: analysis.relatedModule,
        isOwner,
      }),
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

    const updated = await updateInterruptionActionPlan(
      planId,
      {
        status: "published",
        published_at: new Date().toISOString(),
      },
      supabase
    )
    if (!updated) return { ok: false, message: "Could not publish." }

    revalidateInterruptionPaths()

    const view = buildInterruptionActionPlanView({
      plan: updated,
      relatedStandard: null,
      relatedModule: null,
      isOwner: true,
    })

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

    revalidateInterruptionPaths()

    return {
      ok: true,
      plan: buildInterruptionActionPlanView({
        plan: updated,
        relatedStandard: null,
        relatedModule: null,
        isOwner: true,
      }),
    }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}
