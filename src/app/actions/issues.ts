"use server"

import { revalidatePath } from "next/cache"

import {
  fetchBusinessForCurrentUser,
  fetchIssueById,
  fetchProfilesForCurrentBusiness,
  insertIssue,
  recordIssueLifecycleLogged,
  recordIssueLifecycleStage,
} from "@/lib/db/queries"
import {
  isAllowedIssueCategory,
  isAllowedIssueSeverity,
  isAllowedIssueStatus,
} from "@/lib/issues/constants"
import { createClient } from "@/lib/supabase/server"
import type { IssueStatus, TablesUpdate } from "@/types/database"

function revalidateIssues(issueId?: string) {
  revalidatePath("/issues")
  revalidatePath("/dashboard")
  if (issueId) revalidatePath(`/issues/${issueId}`)
}

async function validateOwnerId(
  ownerId: string | null | undefined,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<string | null> {
  if (ownerId == null || ownerId === "") return null
  const profiles = await fetchProfilesForCurrentBusiness(supabase)
  if (!profiles.some((p) => p.id === ownerId)) {
    throw new Error("Pick an owner from your team roster.")
  }
  return ownerId
}

function normalizeDueDate(value: string | null | undefined): string | null {
  if (value == null || value.trim() === "") return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    throw new Error("Use a valid due date.")
  }
  return value.trim()
}

export async function createIssue(payload: {
  businessId: string
  title: string
  description: string | null
  category: string
  severity: string
  ownerRequired: boolean
  status?: IssueStatus
  ownerId?: string | null
  dueDate?: string | null
}): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
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

    const title = payload.title.trim()
    if (!title) return { ok: false, message: "Add a title." }

    if (!isAllowedIssueCategory(payload.category)) {
      return { ok: false, message: "Pick a category from the list." }
    }
    if (!isAllowedIssueSeverity(payload.severity)) {
      return { ok: false, message: "Pick a severity from the list." }
    }

    const status = payload.status ?? "not_started"
    if (!isAllowedIssueStatus(status)) {
      return { ok: false, message: "Invalid status." }
    }

    const ownerId = await validateOwnerId(payload.ownerId, supabase)
    const dueDate = normalizeDueDate(payload.dueDate)

    const row = await insertIssue(
      {
        business_id: payload.businessId,
        category: payload.category,
        severity: payload.severity,
        title,
        description: payload.description?.trim() || null,
        status,
        owner_required: Boolean(payload.ownerRequired),
        owner_id: ownerId,
        due_date: dueDate,
        resolved_at: status === "resolved" ? new Date().toISOString() : null,
      },
      supabase
    )

    if (!row) return { ok: false, message: "Could not create issue." }
    await recordIssueLifecycleLogged(row.id, payload.businessId, undefined, supabase)
    revalidateIssues(row.id)
    return { ok: true, id: row.id }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}

export async function updateIssue(
  issueId: string,
  payload: {
    title?: string
    description?: string | null
    category?: string
    severity?: string
    ownerRequired?: boolean
    status?: IssueStatus
    ownerId?: string | null
    dueDate?: string | null
  }
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, message: "You need to be signed in." }

    const existing = await fetchIssueById(issueId, supabase)
    if (!existing) return { ok: false, message: "Issue not found." }

    const business = await fetchBusinessForCurrentUser(supabase)
    if (!business || business.id !== existing.business_id) {
      return { ok: false, message: "No business linked." }
    }

    const patch: TablesUpdate<"bottlenecks"> = {}

    if (payload.title !== undefined) {
      const t = payload.title.trim()
      if (!t) return { ok: false, message: "Title cannot be empty." }
      patch.title = t
    }
    if (payload.description !== undefined) {
      patch.description = payload.description?.trim() || null
    }
    if (payload.category !== undefined) {
      if (!isAllowedIssueCategory(payload.category)) {
        return { ok: false, message: "Invalid category." }
      }
      patch.category = payload.category
    }
    if (payload.severity !== undefined) {
      if (!isAllowedIssueSeverity(payload.severity)) {
        return { ok: false, message: "Invalid severity." }
      }
      patch.severity = payload.severity
    }
    if (payload.ownerRequired !== undefined) {
      patch.owner_required = payload.ownerRequired
    }
    if (payload.ownerId !== undefined) {
      patch.owner_id = await validateOwnerId(payload.ownerId, supabase)
    }
    if (payload.dueDate !== undefined) {
      patch.due_date = normalizeDueDate(payload.dueDate)
    }
    if (payload.status !== undefined) {
      if (!isAllowedIssueStatus(payload.status)) {
        return { ok: false, message: "Invalid status." }
      }
      patch.status = payload.status
      if (payload.status === "resolved") {
        patch.resolved_at = existing.resolved_at ?? new Date().toISOString()
      } else {
        patch.resolved_at = null
      }
    }

    if (Object.keys(patch).length === 0) {
      return { ok: true }
    }

    const { error } = await supabase.from("bottlenecks").update(patch).eq("id", issueId)
    if (error) return { ok: false, message: error.message }

    if (patch.status === "resolved") {
      await recordIssueLifecycleStage(
        issueId,
        existing.business_id,
        "progress_tracked",
        "Issue marked resolved.",
        supabase
      )
      await recordIssueLifecycleStage(
        issueId,
        existing.business_id,
        "dependency_updated",
        "Closing the loop updates owner dependency.",
        supabase
      )
    } else if (patch.status && patch.status !== "not_started") {
      await recordIssueLifecycleStage(
        issueId,
        existing.business_id,
        "progress_tracked",
        `Status: ${patch.status.replace(/_/g, " ")}.`,
        supabase
      )
    }

    revalidateIssues(issueId)
    return { ok: true }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}
