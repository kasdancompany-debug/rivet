/** How long an invite link stays valid after send or resend. */
export const WORKSPACE_INVITE_TTL_DAYS = 7

export const WORKSPACE_INVITE_TOKEN_BYTES = 32

/** Roles assignable via team invite (not owner). */
export const INVITABLE_WORKSPACE_ROLES = ["manager", "trainer", "staff"] as const

export type InvitableWorkspaceRole = (typeof INVITABLE_WORKSPACE_ROLES)[number]
