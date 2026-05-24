"use server"

import { revalidatePath } from "next/cache"

import {
  deleteIssueLinkById,
  fetchBusinessForCurrentUser,
  fetchIssueById,
  fetchProfilesForCurrentBusiness,
  insertIssueLink,
  listIssueLinksForBottleneck,
  listOwnerInterruptionsForBusiness,
  listSopsForBusiness,
  listTrainingModulesForBusiness,
} from "@/lib/db/queries"
import { isAllowedIssueLinkKind } from "@/lib/issues/links/constants"
import { createClient } from "@/lib/supabase/server"
import type { IssueLinkKind } from "@/types/database"

function revalidateIssue(issueId: string) {
  revalidatePath("/issues")
  revalidatePath(`/issues/${issueId}`)
}

async function validateLinkTarget(
  kind: IssueLinkKind,
  targetId: string,
  businessId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<boolean> {
  switch (kind) {
    case "standard": {
      const standards = await listSopsForBusiness(businessId, undefined, supabase)
      return standards.some((s) => s.id === targetId)
    }
    case "training_module": {
      const modules = await listTrainingModulesForBusiness(businessId, supabase)
      return modules.some((m) => m.id === targetId)
    }
    case "owner_interruption": {
      const rows = await listOwnerInterruptionsForBusiness(businessId, undefined, supabase)
      return rows.some((r) => r.id === targetId)
    }
    case "staff_member": {
      const profiles = await fetchProfilesForCurrentBusiness(supabase)
      return profiles.some((p) => p.id === targetId)
    }
    default:
      return false
  }
}

export async function addIssueLink(payload: {
  issueId: string
  kind: string
  targetId: string
}): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    if (!isAllowedIssueLinkKind(payload.kind)) {
      return { ok: false, message: "Invalid link type." }
    }
    const targetId = payload.targetId.trim()
    if (!targetId) return { ok: false, message: "Pick something to link." }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, message: "You need to be signed in." }

    const issue = await fetchIssueById(payload.issueId, supabase)
    if (!issue) return { ok: false, message: "Issue not found." }

    const business = await fetchBusinessForCurrentUser(supabase)
    if (!business || business.id !== issue.business_id) {
      return { ok: false, message: "No business linked." }
    }

    const valid = await validateLinkTarget(payload.kind, targetId, business.id, supabase)
    if (!valid) return { ok: false, message: "That item is not in your workspace." }

    const existing = await listIssueLinksForBottleneck(issue.id, supabase)
    if (existing.some((l) => l.kind === payload.kind && l.target_id === targetId)) {
      return { ok: false, message: "Already linked." }
    }

    const row = await insertIssueLink(
      {
        bottleneck_id: issue.id,
        business_id: business.id,
        kind: payload.kind,
        target_id: targetId,
      },
      supabase
    )
    if (!row) return { ok: false, message: "Could not add link." }

    revalidateIssue(issue.id)
    return { ok: true }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}

export async function removeIssueLink(
  linkId: string,
  issueId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, message: "You need to be signed in." }

    const issue = await fetchIssueById(issueId, supabase)
    if (!issue) return { ok: false, message: "Issue not found." }

    const business = await fetchBusinessForCurrentUser(supabase)
    if (!business || business.id !== issue.business_id) {
      return { ok: false, message: "No business linked." }
    }

    const links = await listIssueLinksForBottleneck(issueId, supabase)
    if (!links.some((l) => l.id === linkId)) {
      return { ok: false, message: "Link not found." }
    }

    const ok = await deleteIssueLinkById(linkId, supabase)
    if (!ok) return { ok: false, message: "Could not remove link." }

    revalidateIssue(issueId)
    return { ok: true }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}
