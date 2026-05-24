"use server"

import { revalidatePath } from "next/cache"

import { assignTrainingModule } from "@/app/actions/training"
import {
  fetchBusinessForCurrentUser,
  fetchIssueById,
  insertIssueLink,
  recordIssueLifecycleStage,
} from "@/lib/db/queries"
import { createClient } from "@/lib/supabase/server"

function revalidateIssue(issueId: string) {
  revalidatePath("/issues")
  revalidatePath(`/issues/${issueId}`)
  revalidatePath("/dashboard")
  revalidatePath("/training")
}

export async function assignIssueLifecycleTraining(payload: {
  businessId: string
  issueId: string
  moduleId: string
  employeeId: string
}): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const supabase = await createClient()
    const business = await fetchBusinessForCurrentUser(supabase)
    if (!business || business.id !== payload.businessId) {
      return { ok: false, message: "No business linked." }
    }

    const issue = await fetchIssueById(payload.issueId, supabase)
    if (!issue || issue.business_id !== payload.businessId) {
      return { ok: false, message: "Issue not found." }
    }

    const assigned = await assignTrainingModule({
      employeeId: payload.employeeId,
      trainingModuleId: payload.moduleId,
    })
    if (!assigned.ok) return assigned

    await insertIssueLink(
      {
        bottleneck_id: issue.id,
        business_id: business.id,
        kind: "training_module",
        target_id: payload.moduleId,
      },
      supabase
    )

    await recordIssueLifecycleStage(
      issue.id,
      business.id,
      "training_assigned",
      "Training module assigned from issue workflow.",
      supabase
    )

    revalidateIssue(issue.id)
    return { ok: true }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}

export async function syncIssuePatternDetected(payload: {
  businessId: string
  issueId: string
  repeatCount: number
}): Promise<void> {
  if (payload.repeatCount < 2) return
  const supabase = await createClient()
  await recordIssueLifecycleStage(
    payload.issueId,
    payload.businessId,
    "pattern_detected",
    `${payload.repeatCount} repeats in 30 days.`,
    supabase
  )
}
