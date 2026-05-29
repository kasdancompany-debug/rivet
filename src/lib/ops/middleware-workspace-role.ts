import { normalizeMemberRole, type WorkspaceRole } from "@/lib/ops/workspace-role-types"
import type { BusinessMemberRole } from "@/types/database"

/** Resolve role from middleware fetches (no dev bypass). */
export function resolveMiddlewareWorkspaceRole(input: {
  userId: string
  businessOwnerId: string | null
  memberRole: BusinessMemberRole | null | undefined
  profileIsOwner: boolean | null | undefined
}): WorkspaceRole {
  if (input.businessOwnerId && input.businessOwnerId === input.userId) return "owner"
  if (input.profileIsOwner) return "owner"
  if (input.memberRole) return normalizeMemberRole(input.memberRole)
  return "staff"
}
