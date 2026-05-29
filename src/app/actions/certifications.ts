"use server"

import { revalidatePath } from "next/cache"

import { syncEmployeeModuleCertification } from "@/lib/training/certifications/sync"
import { requireWorkspacePermission } from "@/lib/ops/workspace-auth"
import { createClient } from "@/lib/supabase/server"

function revalidateCertifications(moduleId?: string, employeeId?: string) {
  revalidatePath("/training")
  revalidatePath("/learn")
  revalidatePath("/learn/certifications")
  if (moduleId) {
    revalidatePath(`/learn/${moduleId}`)
    revalidatePath(`/learn/certifications/${moduleId}`)
  }
  if (employeeId && moduleId) {
    revalidatePath(`/training/certificates/${employeeId}/${moduleId}`)
  }
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

    const gate = await requireWorkspacePermission(supabase, "sign_off_training")
    if (!gate.ok) return gate
    if (gate.business.id !== payload.businessId) {
      return { ok: false, message: "No business linked." }
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

    revalidateCertifications(payload.moduleId, payload.employeeId)
    return { ok: true }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}
