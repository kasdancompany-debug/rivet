import type { InvitableWorkspaceRole } from "@/lib/workspace-invites/constants"
import { normalizeMemberRole, type WorkspaceRole } from "@/lib/ops/workspace-role-types"

export type ResolvedWorkspaceInvite = {
  valid: boolean
  reason?: "not_found" | "expired" | "revoked" | "already_accepted"
  inviteId?: string
  businessId?: string
  businessName?: string
  email?: string
  role?: WorkspaceRole
}

export function parseResolvedWorkspaceInvite(raw: unknown): ResolvedWorkspaceInvite {
  if (!raw || typeof raw !== "object") {
    return { valid: false, reason: "not_found" }
  }
  const o = raw as Record<string, unknown>
  if (o.valid !== true) {
    const reason = o.reason
    return {
      valid: false,
      reason:
        reason === "expired" ||
        reason === "revoked" ||
        reason === "already_accepted" ||
        reason === "not_found"
          ? reason
          : "not_found",
      inviteId: typeof o.inviteId === "string" ? o.inviteId : undefined,
      businessId: typeof o.businessId === "string" ? o.businessId : undefined,
    }
  }

  const role = normalizeMemberRole(typeof o.role === "string" ? o.role : null)
  const invitable: InvitableWorkspaceRole =
    role === "manager" || role === "trainer" ? role : "staff"

  return {
    valid: true,
    inviteId: typeof o.inviteId === "string" ? o.inviteId : undefined,
    businessId: typeof o.businessId === "string" ? o.businessId : undefined,
    businessName: typeof o.businessName === "string" ? o.businessName : undefined,
    email: typeof o.email === "string" ? o.email : undefined,
    role: invitable,
  }
}
