"use server"

import { revalidatePath } from "next/cache"

import { fetchBusinessForCurrentUser, fetchCurrentProfile } from "@/lib/db/queries"
import { syncEmployeeModuleCertification } from "@/lib/training/certifications/sync"
import { isWorkspaceOwner } from "@/lib/ops/workspace-role"
import { createClient } from "@/lib/supabase/server"

function revalidateCertifications(moduleId?: string) {
  revalidatePath("/training")
  revalidatePath("/learn")
  if (moduleId) revalidatePath(`/learn/${moduleId}`)
}

export async function signOffModuleCertification(payload: {
  businessId: string
  employeeId: string
  moduleId: string
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
      return { ok: false, message: "Only the business owner can sign off certifications." }
    }

    const { data: assignment } = await supabase
      .from("training_progress")
      .select("id")
      .eq("employee_id", payload.employeeId)
      .eq("training_module_id", payload.moduleId)
      .maybeSingle()

    if (!assignment) {
      return { ok: false, message: "This module is not assigned to that person." }
    }

    await syncEmployeeModuleCertification(
      supabase,
      {
        businessId: payload.businessId,
        employeeId: payload.employeeId,
        moduleId: payload.moduleId,
      },
      user.id
    )

    revalidateCertifications(payload.moduleId)
    return { ok: true }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}
