"use server"

import { revalidatePath } from "next/cache"

import {
  fetchBusinessForCurrentUser,
  fetchProfilesForCurrentBusiness,
  insertIssue,
  insertIssueLink,
  recordIssueLifecycleLogged,
} from "@/lib/db/queries"
import {
  buildQuickCaptureDescription,
  ownerRequiredFromTimeLost,
  severityFromTimeLostMinutes,
  titleFromQuickCapture,
} from "@/lib/issues/quick-capture/helpers"
import { createClient } from "@/lib/supabase/server"

function revalidateIssues(issueId?: string) {
  revalidatePath("/issues")
  revalidatePath("/dashboard")
  if (issueId) revalidatePath(`/issues/${issueId}`)
}

export async function quickCaptureIssue(payload: {
  businessId: string
  whatHappened: string
  peopleInvolvedIds?: string[]
  timeLostMinutes: number
  voiceNoteTranscript?: string | null
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

    const whatHappened = payload.whatHappened.trim()
    if (!whatHappened) return { ok: false, message: "Say what happened." }

    const timeLostMinutes = Math.max(1, Math.round(payload.timeLostMinutes))
    const profiles = await fetchProfilesForCurrentBusiness(supabase)
    const selectedIds = (payload.peopleInvolvedIds ?? []).filter((id) =>
      profiles.some((p) => p.id === id)
    )
    const peopleLabels = selectedIds.map(
      (id) => profiles.find((p) => p.id === id)?.full_name?.trim() || "Team member"
    )

    const title = titleFromQuickCapture(whatHappened)
    if (!title) return { ok: false, message: "Say what happened." }

    const severity = severityFromTimeLostMinutes(timeLostMinutes)
    const ownerRequired = ownerRequiredFromTimeLost(timeLostMinutes)

    const row = await insertIssue(
      {
        business_id: payload.businessId,
        category: "other",
        severity,
        title,
        description: buildQuickCaptureDescription({
          whatHappened,
          timeLostMinutes,
          peopleLabels,
          voiceNoteTranscript: payload.voiceNoteTranscript,
        }),
        status: "not_started",
        owner_required: ownerRequired,
        owner_id: null,
        due_date: null,
        resolved_at: null,
      },
      supabase
    )

    if (!row) return { ok: false, message: "Could not save." }

    await recordIssueLifecycleLogged(row.id, business.id, "Quick capture.", supabase)

    for (const profileId of selectedIds) {
      await insertIssueLink(
        {
          bottleneck_id: row.id,
          business_id: business.id,
          kind: "staff_member",
          target_id: profileId,
        },
        supabase
      )
    }

    revalidateIssues(row.id)
    return { ok: true, id: row.id }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}
