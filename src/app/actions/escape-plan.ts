"use server"

import { revalidatePath } from "next/cache"

import {
  archiveActiveOwnerEscapePlans,
  countIncompleteOwnerEscapePlanTasks,
  fetchBusinessForCurrentUser,
  fetchOwnerEscapePlanById,
} from "@/lib/db/queries"
import { buildGuidedRoadmapSeeds } from "@/lib/escape-plan/build-guided-roadmap"
import { defaultEscapePlanIntake, type EscapePlanIntake } from "@/lib/escape-plan/guided-types"
import { createClient } from "@/lib/supabase/server"
import type { EscapePlanStatus, Json, TablesUpdate } from "@/types/database"

function revalidateEscapePlan() {
  revalidatePath("/escape-plan")
}

function utcTodayYmd(): string {
  const n = new Date()
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()))
    .toISOString()
    .slice(0, 10)
}

async function assertPlanInBusiness(
  supabase: Awaited<ReturnType<typeof createClient>>,
  planId: string,
  businessId: string
) {
  const plan = await fetchOwnerEscapePlanById(planId, supabase)
  if (!plan || plan.business_id !== businessId) return null
  return plan
}

async function syncPlanCompletionStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  planId: string
) {
  const remaining = await countIncompleteOwnerEscapePlanTasks(planId, supabase)
  const patch: TablesUpdate<"owner_escape_plans"> = {}
  if (remaining === 0) {
    patch.status = "completed" as EscapePlanStatus
  } else {
    const plan = await fetchOwnerEscapePlanById(planId, supabase)
    if (plan?.status === "completed") {
      patch.status = "active" as EscapePlanStatus
    }
  }
  if (Object.keys(patch).length > 0) {
    await supabase.from("owner_escape_plans").update(patch).eq("id", planId)
  }
}

export async function createOwnerEscapePlan(payload?: {
  startedOn?: string
  intake?: EscapePlanIntake
}): Promise<{ ok: true; planId: string } | { ok: false; message: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, message: "You need to be signed in." }

    const business = await fetchBusinessForCurrentUser(supabase)
    if (!business) return { ok: false, message: "No business linked." }

    const startedOn = payload?.startedOn?.trim() || utcTodayYmd()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startedOn)) {
      return { ok: false, message: "Use a start date in YYYY-MM-DD format." }
    }

    const intake = payload?.intake ?? defaultEscapePlanIntake()

    await archiveActiveOwnerEscapePlans(business.id, supabase)

    const { data: plan, error: pErr } = await supabase
      .from("owner_escape_plans")
      .insert({
        business_id: business.id,
        created_by: user.id,
        started_on: startedOn,
        status: "active",
        plan_version: 2,
        intake_json: intake as unknown as Json,
      })
      .select("id")
      .single()

    if (pErr || !plan) {
      return { ok: false, message: pErr?.message ?? "Could not create plan." }
    }

    const seeds = buildGuidedRoadmapSeeds(intake).map((row) => ({
      ...row,
      plan_id: plan.id as string,
    }))

    const { error: tErr } = await supabase.from("owner_escape_plan_tasks").insert(seeds)
    if (tErr) {
      await supabase.from("owner_escape_plans").delete().eq("id", plan.id)
      return { ok: false, message: tErr.message }
    }

    revalidateEscapePlan()
    return { ok: true, planId: plan.id as string }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}

export async function toggleOwnerEscapePlanTask(
  taskId: string,
  completed: boolean
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, message: "You need to be signed in." }

    const business = await fetchBusinessForCurrentUser(supabase)
    if (!business) return { ok: false, message: "No business linked." }

    const { data: task, error: tErr } = await supabase
      .from("owner_escape_plan_tasks")
      .select("id, plan_id")
      .eq("id", taskId)
      .maybeSingle()

    if (tErr || !task) return { ok: false, message: "Milestone not found." }

    const plan = await assertPlanInBusiness(supabase, task.plan_id, business.id)
    if (!plan) return { ok: false, message: "Plan not found." }

    const { error } = await supabase
      .from("owner_escape_plan_tasks")
      .update({
        completed_at: completed ? new Date().toISOString() : null,
        completed_by: completed ? user.id : null,
      })
      .eq("id", taskId)

    if (error) return { ok: false, message: error.message }

    await syncPlanCompletionStatus(supabase, task.plan_id)
    revalidateEscapePlan()
    return { ok: true }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}

export async function updateOwnerEscapePlanTask(payload: {
  taskId: string
  title?: string
  description?: string | null
  notes?: string | null
}): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, message: "You need to be signed in." }

    const business = await fetchBusinessForCurrentUser(supabase)
    if (!business) return { ok: false, message: "No business linked." }

    const { data: task } = await supabase
      .from("owner_escape_plan_tasks")
      .select("plan_id")
      .eq("id", payload.taskId)
      .maybeSingle()

    if (!task) return { ok: false, message: "Milestone not found." }

    const plan = await assertPlanInBusiness(supabase, task.plan_id, business.id)
    if (!plan) return { ok: false, message: "Plan not found." }

    const patch: TablesUpdate<"owner_escape_plan_tasks"> = {}
    if (payload.title !== undefined) {
      const t = payload.title.trim()
      if (!t) return { ok: false, message: "Title cannot be empty." }
      patch.title = t
    }
    if (payload.description !== undefined) {
      patch.description = payload.description?.trim() || null
    }
    if (payload.notes !== undefined) {
      patch.notes = payload.notes?.trim() || null
    }

    if (Object.keys(patch).length === 0) return { ok: true }

    const { error } = await supabase
      .from("owner_escape_plan_tasks")
      .update(patch)
      .eq("id", payload.taskId)

    if (error) return { ok: false, message: error.message }
    revalidateEscapePlan()
    return { ok: true }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}

export async function addOwnerEscapePlanMilestone(payload: {
  planId: string
  weekNumber: 1 | 2 | 3 | 4 | 5 | 6
  title: string
  description?: string | null
}): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, message: "You need to be signed in." }

    const business = await fetchBusinessForCurrentUser(supabase)
    if (!business) return { ok: false, message: "No business linked." }

    const plan = await assertPlanInBusiness(supabase, payload.planId, business.id)
    if (!plan || plan.status !== "active") {
      return { ok: false, message: "Active plan not found." }
    }

    const title = payload.title.trim()
    if (!title) return { ok: false, message: "Add a title." }

    const { data: last } = await supabase
      .from("owner_escape_plan_tasks")
      .select("sort_order")
      .eq("plan_id", payload.planId)
      .eq("week_number", payload.weekNumber)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle()

    const sortOrder = (last?.sort_order ?? -1) + 1
    const taskKey = `custom_${Date.now()}`

    const { data: row, error } = await supabase
      .from("owner_escape_plan_tasks")
      .insert({
        plan_id: payload.planId,
        week_number: payload.weekNumber,
        task_key: taskKey,
        title,
        description: payload.description?.trim() || null,
        sort_order: sortOrder,
        item_kind: "operational_task",
      })
      .select("id")
      .single()

    if (error || !row) return { ok: false, message: error?.message ?? "Could not add milestone." }

    await syncPlanCompletionStatus(supabase, payload.planId)
    revalidateEscapePlan()
    return { ok: true, id: row.id as string }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}

export async function deleteOwnerEscapePlanMilestone(
  taskId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, message: "You need to be signed in." }

    const business = await fetchBusinessForCurrentUser(supabase)
    if (!business) return { ok: false, message: "No business linked." }

    const { data: task } = await supabase
      .from("owner_escape_plan_tasks")
      .select("plan_id")
      .eq("id", taskId)
      .maybeSingle()

    if (!task) return { ok: false, message: "Milestone not found." }

    const plan = await assertPlanInBusiness(supabase, task.plan_id, business.id)
    if (!plan) return { ok: false, message: "Plan not found." }

    const { error } = await supabase.from("owner_escape_plan_tasks").delete().eq("id", taskId)
    if (error) return { ok: false, message: error.message }

    await syncPlanCompletionStatus(supabase, task.plan_id)
    revalidateEscapePlan()
    return { ok: true }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}

export async function markOwnerEscapePlanStatus(
  planId: string,
  status: EscapePlanStatus
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, message: "You need to be signed in." }

    const business = await fetchBusinessForCurrentUser(supabase)
    if (!business) return { ok: false, message: "No business linked." }

    const plan = await assertPlanInBusiness(supabase, planId, business.id)
    if (!plan) return { ok: false, message: "Plan not found." }

    if (!["active", "completed", "archived"].includes(status)) {
      return { ok: false, message: "Invalid status." }
    }

    const { error } = await supabase.from("owner_escape_plans").update({ status }).eq("id", planId)
    if (error) return { ok: false, message: error.message }

    revalidateEscapePlan()
    return { ok: true }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}
