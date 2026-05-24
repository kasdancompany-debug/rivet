"use server"

import { revalidatePath } from "next/cache"

import { fetchBusinessForCurrentUser, fetchCurrentProfile } from "@/lib/db/queries"
import { isWorkspaceOwner } from "@/lib/ops/workspace-role"
import { createClient } from "@/lib/supabase/server"

export async function updateOwnerHourlyValue(payload: {
  businessId: string
  hourlyValueCad: number | null
}): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, message: "You need to be signed in." }

    const business = await fetchBusinessForCurrentUser(supabase)
    const profile = await fetchCurrentProfile(supabase)
    if (!business || business.id !== payload.businessId) {
      return { ok: false, message: "No business linked." }
    }
    if (!isWorkspaceOwner(user.id, business, profile)) {
      return { ok: false, message: "Only the business owner can update this." }
    }

    const value = payload.hourlyValueCad
    if (value != null && (!Number.isFinite(value) || value < 0 || value > 999_999)) {
      return { ok: false, message: "Enter a valid hourly value (0 or greater)." }
    }

    const { error } = await supabase
      .from("businesses")
      .update({
        owner_hourly_value_cad: value,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payload.businessId)

    if (error) return { ok: false, message: error.message }

    revalidatePath("/interruptions")
    revalidatePath("/settings")
    revalidatePath("/dashboard")
    return { ok: true }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}
