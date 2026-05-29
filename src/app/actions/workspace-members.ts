"use server"

import { revalidatePath } from "next/cache"

import {
  fetchBusinessForCurrentUser,
  listBusinessMembersForCurrentBusiness,
} from "@/lib/db/queries"
import { requireWorkspacePermission } from "@/lib/ops/workspace-auth"
import {
  memberRoleFromWorkspace,
  type WorkspaceRole,
} from "@/lib/ops/workspace-role-types"
import { createClient } from "@/lib/supabase/server"

function revalidateTeam() {
  revalidatePath("/settings")
  revalidatePath("/training")
}

export async function updateWorkspaceMemberRole(payload: {
  businessId: string
  userId: string
  role: WorkspaceRole
}): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const supabase = await createClient()
    const gate = await requireWorkspacePermission(supabase, "manage_workspace_settings")
    if (!gate.ok) return gate

    if (gate.business.id !== payload.businessId) {
      return { ok: false, message: "No business linked." }
    }

    if (payload.userId === gate.user.id && payload.role !== "owner") {
      return { ok: false, message: "You cannot change your own role away from owner." }
    }

    if (gate.business.owner_id === payload.userId && payload.role !== "owner") {
      return { ok: false, message: "The workspace owner must keep the Owner role." }
    }

    const members = await listBusinessMembersForCurrentBusiness(supabase)
    const target = members.find((m) => m.user_id === payload.userId)
    if (!target) {
      return { ok: false, message: "That person is not a member of this workspace." }
    }

    if (gate.access.role === "manager" && payload.role === "owner") {
      return { ok: false, message: "Only the workspace owner can assign the Owner role." }
    }

    const { error } = await supabase
      .from("business_members")
      .update({
        role: memberRoleFromWorkspace(payload.role),
        updated_at: new Date().toISOString(),
      })
      .eq("business_id", payload.businessId)
      .eq("user_id", payload.userId)

    if (error) return { ok: false, message: error.message }

    if (payload.role === "owner") {
      await supabase.from("profiles").update({ is_owner: true }).eq("id", payload.userId)
    } else if (target.role === "owner") {
      await supabase.from("profiles").update({ is_owner: false }).eq("id", payload.userId)
    }

    revalidateTeam()
    return { ok: true }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}
