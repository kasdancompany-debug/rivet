"use server"

import { revalidatePath } from "next/cache"

import { fetchBusinessForCurrentUser, insertStandardPlayView } from "@/lib/db/queries"
import { createClient } from "@/lib/supabase/server"

export async function logStandardPlayView(payload: {
  standardId: string
  source?: "portal" | "owner" | "training"
}): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, message: "Sign in required." }

    const business = await fetchBusinessForCurrentUser(supabase)
    if (!business) return { ok: false, message: "No business linked." }

    const { data: standard } = await supabase
      .from("standards")
      .select("id, business_id")
      .eq("id", payload.standardId)
      .maybeSingle()

    if (!standard || standard.business_id !== business.id) {
      return { ok: false, message: "Play not found." }
    }

    await insertStandardPlayView(
      {
        business_id: business.id,
        standard_id: payload.standardId,
        viewed_by: user.id,
        source: payload.source ?? "portal",
      },
      supabase
    )

    revalidatePath("/alerts")
    revalidatePath("/dashboard")
    revalidatePath("/ask")

    return { ok: true }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}
