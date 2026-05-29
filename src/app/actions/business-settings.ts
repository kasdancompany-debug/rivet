"use server"

import { revalidatePath } from "next/cache"

import { requireWorkspacePermission } from "@/lib/ops/workspace-auth"
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

    const gate = await requireWorkspacePermission(supabase, "manage_workspace_settings")
    if (!gate.ok) return gate
    if (gate.business.id !== payload.businessId) {
      return { ok: false, message: "No business linked." }
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
