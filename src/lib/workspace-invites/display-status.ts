export type WorkspaceInviteDisplayStatus = "pending" | "accepted" | "expired" | "revoked"

export type WorkspaceInviteRowLike = {
  status: string
  expires_at: string
  accepted_at?: string | null
}

export function workspaceInviteDisplayStatus(
  row: WorkspaceInviteRowLike,
  now: Date = new Date()
): WorkspaceInviteDisplayStatus {
  if (row.status === "accepted") return "accepted"
  if (row.status === "revoked") return "revoked"
  const expires = Date.parse(row.expires_at)
  if (!Number.isNaN(expires) && expires < now.getTime()) return "expired"
  return "pending"
}

export const WORKSPACE_INVITE_STATUS_LABEL: Record<WorkspaceInviteDisplayStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  expired: "Expired",
  revoked: "Revoked",
}
