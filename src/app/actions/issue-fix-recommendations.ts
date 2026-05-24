"use server"

import { revalidatePath } from "next/cache"

import { quickCaptureAndSaveDraft } from "@/app/actions/quick-capture"
import { saveTrainingModule } from "@/app/actions/training"
import { analyzeIssueFixRecommendation } from "@/lib/issues/fix-recommendation/analyze-issue-fix"
import type { IssueFixRecommendation } from "@/lib/issues/fix-recommendation/types"
import {
  fetchBusinessForCurrentUser,
  fetchCurrentProfile,
  fetchIssueById,
  fetchProfilesForCurrentBusiness,
  listIssuesForBusiness,
  listSopsForBusiness,
  listTrainingModulesForBusiness,
  insertIssueLink,
  recordIssueLifecycleStage,
} from "@/lib/db/queries"
import { isWorkspaceOwner } from "@/lib/ops/workspace-role"
import { createClient } from "@/lib/supabase/server"

function revalidateIssuePaths() {
  revalidatePath("/issues")
  revalidatePath("/sops")
  revalidatePath("/training")
  revalidatePath("/dashboard")
}

export async function createIssueFix(payload: {
  businessId: string
  issueId: string
}): Promise<
  | { ok: true; editHref: string; fixType: IssueFixRecommendation["primaryFixType"] }
  | { ok: false; message: string }
> {
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

    const issue = await fetchIssueById(payload.issueId, supabase)
    if (!issue || issue.business_id !== payload.businessId) {
      return { ok: false, message: "Could not find that issue." }
    }

    const [history, standards, modules, profiles, profile] = await Promise.all([
      listIssuesForBusiness(payload.businessId, {}, supabase),
      listSopsForBusiness(payload.businessId, undefined, supabase),
      listTrainingModulesForBusiness(payload.businessId, supabase),
      fetchProfilesForCurrentBusiness(supabase),
      fetchCurrentProfile(supabase),
    ])

    const recommendation = analyzeIssueFixRecommendation({
      issue,
      history,
      profiles,
      standards,
      modules,
      businessOwnerId: business.owner_id,
    })

    if (!recommendation.isRepeated) {
      return { ok: false, message: "Fix recommendations appear after an issue repeats." }
    }

    const isOwner = isWorkspaceOwner(user.id, business, profile)

    if (recommendation.primaryFixType === "training_module") {
      if (!isOwner) {
        return { ok: false, message: "Only the owner can create training modules." }
      }
      const draft = recommendation.suggestedTraining ?? {
        title: recommendation.suggestedPlay?.title ?? issue.title,
        description: recommendation.suggestedPlay?.description ?? recommendation.rootCause,
      }
      const module = await saveTrainingModule({
        businessId: payload.businessId,
        title: draft.title,
        description: draft.description,
        assignedRole: recommendation.suggestedOwner?.role ?? null,
      })
      if (!module.ok) return { ok: false, message: module.message }

      await insertIssueLink(
        {
          bottleneck_id: issue.id,
          business_id: business.id,
          kind: "training_module",
          target_id: module.id,
        },
        supabase
      )
      await recordIssueLifecycleStage(
        issue.id,
        business.id,
        "fix_suggested",
        `Training module draft: ${draft.title}`,
        supabase
      )

      revalidateIssuePaths()
      return { ok: true, editHref: `/training/modules/${module.id}`, fixType: "training_module" }
    }

    const draft = await quickCaptureAndSaveDraft({
      businessId: payload.businessId,
      text: recommendation.capturePrompt,
    })
    if (!draft.ok) return { ok: false, message: draft.message }

    await insertIssueLink(
      {
        bottleneck_id: issue.id,
        business_id: business.id,
        kind: "standard",
        target_id: draft.id,
      },
      supabase
    )
    await recordIssueLifecycleStage(
      issue.id,
      business.id,
      "fix_suggested",
      "Standard draft created from repeated issue.",
      supabase
    )

    revalidateIssuePaths()
    return { ok: true, editHref: `/sops/capture/${draft.id}`, fixType: "sop" }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}
