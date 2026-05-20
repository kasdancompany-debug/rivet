"use server"

import { revalidatePath } from "next/cache"

import {
  fetchBusinessForCurrentUser,
  fetchDailyChecklistWithItems,
  insertIssue,
  listDailyRunsForChecklistOnDate,
} from "@/lib/db/queries"
import type { DailyChecklistWithItems } from "@/lib/db/queries"
import { PHOTO_PLACEHOLDER_VALUE } from "@/lib/daily-ops/photos"
import { utcShiftDate } from "@/lib/daily-ops/shift-date"
import { createClient } from "@/lib/supabase/server"
import type { TypedSupabaseClient } from "@/types/database"

async function syncMissingRunItems(
  supabase: TypedSupabaseClient,
  runId: string,
  checklist: DailyChecklistWithItems
) {
  const { data: existing } = await supabase
    .from("execution_record_items")
    .select("checklist_item_id")
    .eq("execution_record_id", runId)

  const have = new Set((existing ?? []).map((r) => r.checklist_item_id))
  const missing = checklist.daily_checklist_items.filter((li) => !have.has(li.id))
  if (missing.length === 0) return

  await supabase.from("execution_record_items").insert(
    missing.map((li) => ({
      execution_record_id: runId,
      checklist_item_id: li.id,
      completed: false,
    }))
  )
}

function revalidateOps() {
  revalidatePath("/dashboard")
}

export async function startTodayRun(
  checklistId: string
): Promise<{ ok: true; runId: string } | { ok: false; message: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, message: "You need to be signed in." }

    const business = await fetchBusinessForCurrentUser(supabase)
    if (!business) return { ok: false, message: "No business linked." }

    const checklist = await fetchDailyChecklistWithItems(checklistId, supabase)
    if (!checklist || checklist.business_id !== business.id) {
      return { ok: false, message: "Checklist not found." }
    }

    const shiftDate = utcShiftDate()
    const existing = await listDailyRunsForChecklistOnDate(
      checklistId,
      business.id,
      shiftDate,
      supabase
    )
    const inProg = existing.find((r) => r.status === "in_progress")
    if (inProg) {
      await syncMissingRunItems(supabase, inProg.id, checklist)
      revalidateOps()
      return { ok: true, runId: inProg.id }
    }

    const { data: run, error } = await supabase
      .from("execution_records")
      .insert({
        checklist_id: checklistId,
        employee_id: user.id,
        business_id: business.id,
        status: "in_progress",
        shift_date: shiftDate,
      })
      .select("id")
      .single()

    if (error) {
      if (error.code === "23505") {
        const again = await listDailyRunsForChecklistOnDate(
          checklistId,
          business.id,
          shiftDate,
          supabase
        )
        const recovered = again.find((r) => r.status === "in_progress")
        if (recovered) {
          await syncMissingRunItems(supabase, recovered.id, checklist)
          revalidateOps()
          return { ok: true, runId: recovered.id }
        }
      }
      return { ok: false, message: error.message }
    }

    if (!run) return { ok: false, message: "Could not start run." }

    await syncMissingRunItems(supabase, run.id as string, checklist)
    revalidateOps()
    return { ok: true, runId: run.id as string }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Something went wrong."
    return { ok: false, message: msg }
  }
}

export async function toggleRunItem(
  runItemId: string,
  completed: boolean
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, message: "You need to be signed in." }

    const patch = completed
      ? {
          completed: true,
          completed_at: new Date().toISOString(),
          completed_by: user.id,
        }
      : {
          completed: false,
          completed_at: null,
          completed_by: null,
        }

    const { error } = await supabase.from("execution_record_items").update(patch).eq("id", runItemId)

    if (error) return { ok: false, message: error.message }
    revalidateOps()
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Something went wrong."
    return { ok: false, message: msg }
  }
}

export async function updateRunItemNote(
  runItemId: string,
  note: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, message: "You need to be signed in." }

    const { error } = await supabase
      .from("execution_record_items")
      .update({ note: note.trim() === "" ? null : note.trim() })
      .eq("id", runItemId)

    if (error) return { ok: false, message: error.message }
    revalidateOps()
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Something went wrong."
    return { ok: false, message: msg }
  }
}

export async function setRunItemPhotoPlaceholder(
  runItemId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, message: "You need to be signed in." }

    const { error } = await supabase
      .from("execution_record_items")
      .update({ photo_url: PHOTO_PLACEHOLDER_VALUE })
      .eq("id", runItemId)

    if (error) return { ok: false, message: error.message }
    revalidateOps()
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Something went wrong."
    return { ok: false, message: msg }
  }
}

export async function clearRunItemPhoto(
  runItemId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, message: "You need to be signed in." }

    const { error } = await supabase.from("execution_record_items").update({ photo_url: null }).eq("id", runItemId)

    if (error) return { ok: false, message: error.message }
    revalidateOps()
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Something went wrong."
    return { ok: false, message: msg }
  }
}

export async function updateRunShiftNotes(
  runId: string,
  notes: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, message: "You need to be signed in." }

    const { error } = await supabase
      .from("execution_records")
      .update({ notes: notes.trim() === "" ? null : notes.trim() })
      .eq("id", runId)

    if (error) return { ok: false, message: error.message }
    revalidateOps()
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Something went wrong."
    return { ok: false, message: msg }
  }
}

export async function reportShiftIssue(payload: {
  runId: string
  title: string
  description?: string
}): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const supabase = await createClient()
    const business = await fetchBusinessForCurrentUser(supabase)
    if (!business) return { ok: false, message: "No business linked." }

    const title = payload.title.trim()
    if (!title) return { ok: false, message: "Add a short title." }

    const row = await insertIssue(
      {
        business_id: business.id,
        category: "shift",
        severity: "medium",
        title,
        description: payload.description?.trim() || null,
        status: "open",
        owner_required: false,
        execution_record_id: payload.runId,
      },
      supabase
    )

    if (!row) return { ok: false, message: "Could not save issue." }
    revalidateOps()
    revalidatePath("/issues")
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Something went wrong."
    return { ok: false, message: msg }
  }
}

export async function completeShift(
  runId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, message: "You need to be signed in." }

    const { error } = await supabase
      .from("execution_records")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", runId)
      .eq("status", "in_progress")

    if (error) return { ok: false, message: error.message }
    revalidateOps()
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Something went wrong."
    return { ok: false, message: msg }
  }
}
