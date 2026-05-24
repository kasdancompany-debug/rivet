"use server"

import { revalidatePath } from "next/cache"

import {
  fetchBusinessForCurrentUser,
  fetchCurrentProfile,
  listTrainingItemsForModule,
  syncEmployeeTrainingModuleProgress,
} from "@/lib/db/queries"
import { isWorkspaceOwner } from "@/lib/ops/workspace-role"
import { createClient } from "@/lib/supabase/server"
import type { DelegationReadinessStatus, ReadinessBadge, TablesUpdate, TypedSupabaseClient } from "@/types/database"

const READINESS_VALUES = new Set<ReadinessBadge>([
  "not_ready",
  "learning",
  "ready_with_support",
  "fully_ready",
])

async function requireWorkspaceOwner(supabase: TypedSupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, message: "You need to be signed in." }
  const business = await fetchBusinessForCurrentUser(supabase)
  const profile = await fetchCurrentProfile(supabase)
  if (!business) return { ok: false as const, message: "No business linked." }
  if (!isWorkspaceOwner(user.id, business, profile)) {
    return { ok: false as const, message: "Only the business owner can do that." }
  }
  return { ok: true as const, user, business }
}

function revalidateTraining() {
  revalidatePath("/training")
  revalidatePath("/dashboard")
}

export async function saveTrainingModule(payload: {
  businessId: string
  moduleId?: string
  title: string
  description: string | null
  assignedRole: string | null
}): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  try {
    const supabase = await createClient()
    const gate = await requireWorkspaceOwner(supabase)
    if (!gate.ok) return gate

    const title = payload.title.trim()
    if (!title) return { ok: false, message: "Add a module title." }

    if (payload.moduleId) {
      const { error } = await supabase
        .from("training_modules")
        .update({
          title,
          description: payload.description?.trim() || null,
          assigned_role: payload.assignedRole?.trim() || null,
        })
        .eq("id", payload.moduleId)
        .eq("business_id", payload.businessId)

      if (error) return { ok: false, message: error.message }
      revalidateTraining()
      revalidatePath(`/training/modules/${payload.moduleId}`)
      return { ok: true, id: payload.moduleId }
    }

    const { data, error } = await supabase
      .from("training_modules")
      .insert({
        business_id: payload.businessId,
        title,
        description: payload.description?.trim() || null,
        assigned_role: payload.assignedRole?.trim() || null,
      })
      .select("id")
      .single()

    if (error || !data) return { ok: false, message: error?.message ?? "Could not create module." }
    revalidateTraining()
    return { ok: true, id: data.id as string }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}

export async function deleteTrainingModule(
  moduleId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const supabase = await createClient()
    const gate = await requireWorkspaceOwner(supabase)
    if (!gate.ok) return gate

    const { error } = await supabase.from("training_modules").delete().eq("id", moduleId)
    if (error) return { ok: false, message: error.message }
    revalidateTraining()
    return { ok: true }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}

export async function addSopToTrainingModule(payload: {
  moduleId: string
  sopId: string
}): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const supabase = await createClient()
    const gate = await requireWorkspaceOwner(supabase)
    if (!gate.ok) return gate

    const { error } = await supabase.from("training_items").insert({
      module_id: payload.moduleId,
      standard_id: payload.sopId,
      required: true,
    })
    if (error) {
      if (error.code === "23505") return { ok: false, message: "That SOP is already in this module." }
      return { ok: false, message: error.message }
    }
    revalidateTraining()
    revalidatePath(`/training/modules/${payload.moduleId}`)
    return { ok: true }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}

export async function removeSopFromTrainingModule(payload: {
  moduleId: string
  trainingItemId: string
}): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const supabase = await createClient()
    const gate = await requireWorkspaceOwner(supabase)
    if (!gate.ok) return gate

    const { error } = await supabase.from("training_items").delete().eq("id", payload.trainingItemId)
    if (error) return { ok: false, message: error.message }
    revalidateTraining()
    revalidatePath(`/training/modules/${payload.moduleId}`)
    return { ok: true }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}

export async function assignTrainingModule(payload: {
  employeeId: string
  trainingModuleId: string
}): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const supabase = await createClient()
    const gate = await requireWorkspaceOwner(supabase)
    if (!gate.ok) return gate

    const { error } = await supabase.from("training_progress").insert({
      business_id: gate.business.id,
      employee_id: payload.employeeId,
      training_module_id: payload.trainingModuleId,
      status: "not_started",
    })
    if (error) {
      if (error.code === "23505") return { ok: true }
      return { ok: false, message: error.message }
    }
    revalidateTraining()
    return { ok: true }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}

export async function unassignTrainingModule(payload: {
  progressId: string
  employeeId: string
  moduleId: string
}): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const supabase = await createClient()
    const gate = await requireWorkspaceOwner(supabase)
    if (!gate.ok) return gate

    const items = await listTrainingItemsForModule(payload.moduleId, supabase)
    const itemIds = items.map((i) => i.id)
    if (itemIds.length > 0) {
      await supabase
        .from("employee_training_sop_completions")
        .delete()
        .eq("employee_id", payload.employeeId)
        .in("training_item_id", itemIds)
    }

    const { error } = await supabase.from("training_progress").delete().eq("id", payload.progressId)
    if (error) return { ok: false, message: error.message }
    revalidateTraining()
    return { ok: true }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}

export async function toggleTrainingSopCompletion(payload: {
  employeeId: string
  trainingItemId: string
  moduleId: string
  complete: boolean
}): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, message: "You need to be signed in." }

    const business = await fetchBusinessForCurrentUser(supabase)
    const profile = await fetchCurrentProfile(supabase)
    if (!business) return { ok: false, message: "No business linked." }

    const owner = isWorkspaceOwner(user.id, business, profile)
    if (payload.employeeId !== user.id && !owner) {
      return { ok: false, message: "You can only update your own training checklist." }
    }

    const { data: assignment } = await supabase
      .from("training_progress")
      .select("id")
      .eq("employee_id", payload.employeeId)
      .eq("training_module_id", payload.moduleId)
      .maybeSingle()

    if (!assignment) return { ok: false, message: "This module is not assigned to that person." }

    if (payload.complete) {
      const { error } = await supabase.from("employee_training_sop_completions").insert({
        employee_id: payload.employeeId,
        training_item_id: payload.trainingItemId,
      })
      if (error) {
        if (error.code === "23505") return { ok: true }
        return { ok: false, message: error.message }
      }
    } else {
      const { error } = await supabase
        .from("employee_training_sop_completions")
        .delete()
        .eq("employee_id", payload.employeeId)
        .eq("training_item_id", payload.trainingItemId)
      if (error) return { ok: false, message: error.message }
    }

    await syncEmployeeTrainingModuleProgress(payload.moduleId, payload.employeeId, supabase)
    revalidateTraining()
    revalidatePath(`/training/modules/${payload.moduleId}`)
    return { ok: true }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}

export async function setReadinessOverride(payload: {
  businessId: string
  employeeId: string
  field: "open_alone" | "close_alone" | "train_others" | "handle_complaints"
  value: "ready" | "needs_work" | null
}): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const supabase = await createClient()
    const gate = await requireWorkspaceOwner(supabase)
    if (!gate.ok) return gate

    const column = `${payload.field}_override` as
      | "open_alone_override"
      | "close_alone_override"
      | "train_others_override"
      | "handle_complaints_override"

    const patch: TablesUpdate<"employee_readiness"> = {
      updated_at: new Date().toISOString(),
      [column]: payload.value,
    }

    const { error } = await supabase
      .from("employee_readiness")
      .update(patch)
      .eq("business_id", payload.businessId)
      .eq("employee_id", payload.employeeId)

    if (error) return { ok: false, message: error.message }
    revalidateTraining()
    return { ok: true }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}

/** @deprecated Manual badge dropdown — use setReadinessOverride with calculated scores. */
export async function updateEmployeeReadiness(payload: {
  businessId: string
  employeeId: string
  field: "open_alone" | "close_alone" | "train_others" | "handle_complaints"
  value: ReadinessBadge
}): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const supabase = await createClient()
    const gate = await requireWorkspaceOwner(supabase)
    if (!gate.ok) return gate

    if (!READINESS_VALUES.has(payload.value)) {
      return { ok: false, message: "Invalid readiness value." }
    }

    const patch: TablesUpdate<"employee_readiness"> = {
      updated_at: new Date().toISOString(),
    }
    if (payload.field === "open_alone") patch.open_alone = payload.value
    if (payload.field === "close_alone") patch.close_alone = payload.value
    if (payload.field === "train_others") patch.train_others = payload.value
    if (payload.field === "handle_complaints") patch.handle_complaints = payload.value

    const { error } = await supabase
      .from("employee_readiness")
      .update(patch)
      .eq("business_id", payload.businessId)
      .eq("employee_id", payload.employeeId)

    if (error) return { ok: false, message: error.message }
    revalidateTraining()
    return { ok: true }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}
