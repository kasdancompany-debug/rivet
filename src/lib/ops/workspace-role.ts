import type { WorkspaceRole } from "@/lib/ops/workspace-role-types"
import { normalizeMemberRole } from "@/lib/ops/workspace-role-types"
import { hasWorkspacePermission } from "@/lib/ops/workspace-permissions"
import { resolveWorkspaceRole } from "@/lib/ops/load-workspace-access"
import type { BusinessMemberRole, Tables } from "@/types/database"

export function isWorkspaceOwner(
  userId: string,
  business: Tables<"businesses"> | null,
  profile: Tables<"profiles"> | null,
  memberRole?: BusinessMemberRole | string | null
): boolean {
  if (!business) return false
  const role = resolveWorkspaceRole({
    userId,
    businessOwnerId: business.owner_id,
    memberRole: memberRole ?? (profile?.id === userId && profile.is_owner ? "owner" : null),
    profileIsOwner: profile?.id === userId ? profile.is_owner : false,
  })
  return role === "owner"
}

export function resolveRoleFromContext(
  userId: string,
  business: Tables<"businesses"> | null,
  profile: Tables<"profiles"> | null,
  memberRole?: BusinessMemberRole | string | null
): WorkspaceRole {
  if (!business) return "staff"
  return resolveWorkspaceRole({
    userId,
    businessOwnerId: business.owner_id,
    memberRole: memberRole ?? null,
    profileIsOwner: profile?.id === userId ? profile.is_owner : false,
  })
}

export function isManagerOrAbove(role: WorkspaceRole): boolean {
  return role === "owner" || role === "manager"
}

export function canManageTrainingRole(role: WorkspaceRole): boolean {
  return hasWorkspacePermission(role, "manage_team_training")
}

export { normalizeMemberRole, type WorkspaceRole }
