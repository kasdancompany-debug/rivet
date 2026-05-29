import {
  fetchBusinessForCurrentUser,
  fetchBusinessMemberForUser,
  fetchCurrentProfile,
} from "@/lib/db/queries"
import type { WorkspacePermission } from "@/lib/ops/workspace-permissions"
import {
  hasWorkspacePermission,
  permissionsForRole,
} from "@/lib/ops/workspace-permissions"
import { normalizeMemberRole, type WorkspaceRole } from "@/lib/ops/workspace-role-types"
import { isDevAuthBypassEnabled } from "@/lib/dev-auth-bypass"
import type { TypedSupabaseClient } from "@/types/database"

export type WorkspaceAccess = {
  role: WorkspaceRole
  permissions: ReadonlySet<WorkspacePermission>
  can: (permission: WorkspacePermission) => boolean
}

export function resolveWorkspaceRole(input: {
  userId: string
  businessOwnerId: string
  memberRole: string | null | undefined
  profileIsOwner?: boolean
}): WorkspaceRole {
  if (input.businessOwnerId === input.userId) return "owner"
  if (input.profileIsOwner) return "owner"
  if (input.memberRole) return normalizeMemberRole(input.memberRole)
  return "staff"
}

export function buildWorkspaceAccess(role: WorkspaceRole): WorkspaceAccess {
  const permissions = permissionsForRole(role)
  return {
    role,
    permissions,
    can: (permission) => permissions.has(permission),
  }
}

export async function loadWorkspaceAccess(
  supabase: TypedSupabaseClient,
  userId: string
): Promise<WorkspaceAccess | null> {
  if (isDevAuthBypassEnabled()) {
    return buildWorkspaceAccess("owner")
  }

  const [business, profile, member] = await Promise.all([
    fetchBusinessForCurrentUser(supabase),
    fetchCurrentProfile(supabase),
    fetchBusinessMemberForUser(userId, supabase),
  ])

  if (!business) return null

  const role = resolveWorkspaceRole({
    userId,
    businessOwnerId: business.owner_id,
    memberRole: member?.role,
    profileIsOwner: profile?.is_owner,
  })

  return buildWorkspaceAccess(role)
}
