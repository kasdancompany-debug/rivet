"use server"

import { revalidatePath } from "next/cache"

import {
  fetchBusinessForCurrentUser,
  insertOwnerInterruption,
  type OwnerInterruptionInsertSelf,
} from "@/lib/db/queries"
import { isOwnerInterruptionKind } from "@/lib/owner-interruptions/kinds"
import { createClient } from "@/lib/supabase/server"

export async function logOwnerInterruption(payload: {
  businessId: string
  kind: string
  summary: string
  detail?: string | null
  estimatedMinutes?: number
  relatedIssueId?: string | null
  occurredAt?: string | null
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

    if (!isOwnerInterruptionKind(payload.kind)) {
      return { ok: false, message: "Pick a type from the list." }
    }

    const summary = payload.summary.trim()
    if (!summary) return { ok: false, message: "Add a short label—what pulled the owner in?" }
    if (summary.length > 280) return { ok: false, message: "Keep the label under 280 characters." }

    let minutes = payload.estimatedMinutes ?? 15
    if (!Number.isFinite(minutes)) minutes = 15
    minutes = Math.round(minutes)
    if (minutes < 1 || minutes > 240) {
      return { ok: false, message: "Time estimate should be between 1 and 240 minutes." }
    }

    const row: OwnerInterruptionInsertSelf = {
      business_id: payload.businessId,
      kind: payload.kind,
      summary,
      detail: payload.detail?.trim() || null,
      estimated_minutes: minutes,
      related_bottleneck_id: payload.relatedIssueId?.trim() || null,
      occurred_at: payload.occurredAt?.trim() || new Date().toISOString(),
    }

    const created = await insertOwnerInterruption(row, supabase)
    if (!created) return { ok: false, message: "Could not save—try again." }

    revalidatePath("/interruptions")
    revalidatePath("/interruptions/log")
    revalidatePath("/dashboard")
    return { ok: true, id: created.id }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}
