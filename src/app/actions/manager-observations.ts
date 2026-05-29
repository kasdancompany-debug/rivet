"use server"

import { revalidatePath } from "next/cache"

import { requireWorkspacePermission } from "@/lib/ops/workspace-auth"
import { createClient } from "@/lib/supabase/server"
import type { ManagerObservationType } from "@/types/database"

const OBSERVATION_TYPES = new Set<ManagerObservationType>(["positive", "improvement", "critical"])

function revalidateObservations() {
  revalidatePath("/training")
  revalidatePath("/dashboard")
}

export async function createManagerObservation(payload: {
  businessId: string
  employeeId: string
  observationType: ManagerObservationType
  notes: string
}): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, message: "You need to be signed in." }

    const gate = await requireWorkspacePermission(supabase, "record_manager_observations")
    if (!gate.ok) return gate
    if (gate.business.id !== payload.businessId) {
      return { ok: false, message: "No business linked." }
    }

    if (!OBSERVATION_TYPES.has(payload.observationType)) {
      return { ok: false, message: "Invalid observation type." }
    }

    const notes = payload.notes.trim()
    if (notes.length < 3) {
      return { ok: false, message: "Add a short note (at least 3 characters)." }
    }

    const { data: employeeProfile } = await supabase
      .from("profiles")
      .select("id, business_id")
      .eq("id", payload.employeeId)
      .maybeSingle()

    if (
      !employeeProfile ||
      (employeeProfile.business_id !== payload.businessId &&
        employeeProfile.id !== gate.business.owner_id)
    ) {
      return { ok: false, message: "That person is not on this workspace." }
    }

    const { error } = await supabase.from("employee_manager_observations").insert({
      business_id: payload.businessId,
      employee_id: payload.employeeId,
      observed_by: user.id,
      observation_type: payload.observationType,
      notes,
    })

    if (error) return { ok: false, message: error.message }

    revalidateObservations()
    return { ok: true }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}
