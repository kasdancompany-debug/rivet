import {
  fetchBusinessForCurrentUser,
  fetchBusinessMemberForUser,
  fetchCurrentProfile,
} from "@/lib/db/queries"
import {
  buildWorkspaceAccess,
  loadWorkspaceAccess,
  resolveWorkspaceRole,
} from "@/lib/ops/load-workspace-access"
import type { WorkspacePermission } from "@/lib/ops/workspace-permissions"
import { permissionDeniedMessage } from "@/lib/ops/workspace-permissions"
import type { TypedSupabaseClient } from "@/types/database"

export async function requireWorkspacePermission(
  supabase: TypedSupabaseClient,
  permission: WorkspacePermission
): Promise<
  | {
      ok: true
      user: { id: string }
      business: NonNullable<Awaited<ReturnType<typeof fetchBusinessForCurrentUser>>>
      access: ReturnType<typeof buildWorkspaceAccess>
    }
  | { ok: false; message: string }
> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: "You need to be signed in." }

  const business = await fetchBusinessForCurrentUser(supabase)
  if (!business) return { ok: false, message: "No business linked." }

  const access = await loadWorkspaceAccess(supabase, user.id)
  if (!access?.can(permission)) {
    return { ok: false, message: permissionDeniedMessage(permission) }
  }

  return { ok: true, user, business, access }
}

/** Staff may only act on their own training; trainers+ may act on assigned employees. */
export async function canManageEmployeeTraining(
  supabase: TypedSupabaseClient,
  employeeId: string
): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false
  if (user.id === employeeId) return true

  const access = await loadWorkspaceAccess(supabase, user.id)
  return Boolean(access?.can("manage_team_training"))
}

export async function requireManageEmployeeTraining(
  supabase: TypedSupabaseClient,
  employeeId: string
): Promise<
  | { ok: true; user: { id: string }; businessId: string }
  | { ok: false; message: string }
> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: "You need to be signed in." }

  if (user.id === employeeId) {
    const business = await fetchBusinessForCurrentUser(supabase)
    if (!business) return { ok: false, message: "No business linked." }
    return { ok: true, user, businessId: business.id }
  }

  const gate = await requireWorkspacePermission(supabase, "manage_team_training")
  if (!gate.ok) return gate
  return { ok: true, user: gate.user, businessId: gate.business.id }
}

export async function getWorkspaceRoleForUser(
  supabase: TypedSupabaseClient,
  userId: string
) {
  const business = await fetchBusinessForCurrentUser(supabase)
  if (!business) return null
  const [profile, member] = await Promise.all([
    fetchCurrentProfile(supabase),
    fetchBusinessMemberForUser(userId, supabase),
  ])
  return resolveWorkspaceRole({
    userId,
    businessOwnerId: business.owner_id,
    memberRole: member?.role,
    profileIsOwner: profile?.id === userId ? profile.is_owner : undefined,
  })
}
