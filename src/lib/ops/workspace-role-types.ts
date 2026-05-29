import type { BusinessMemberRole } from "@/types/database"

/** Canonical workspace roles for permissions and UI. */
export type WorkspaceRole = "owner" | "manager" | "trainer" | "staff"

export const WORKSPACE_ROLES: WorkspaceRole[] = ["owner", "manager", "trainer", "staff"]

export const WORKSPACE_ROLE_LABELS: Record<WorkspaceRole, string> = {
  owner: "Owner",
  manager: "Manager",
  trainer: "Trainer",
  staff: "Staff",
}

/** Maps DB enum (incl. legacy admin/member) to a workspace role. */
export function normalizeMemberRole(role: BusinessMemberRole | string | null | undefined): WorkspaceRole {
  switch (role) {
    case "owner":
      return "owner"
    case "manager":
    case "admin":
      return "manager"
    case "trainer":
      return "trainer"
    case "staff":
    case "member":
      return "staff"
    default:
      return "staff"
  }
}

export function workspaceRoleRank(role: WorkspaceRole): number {
  switch (role) {
    case "owner":
      return 4
    case "manager":
      return 3
    case "trainer":
      return 2
    case "staff":
      return 1
  }
}

export function memberRoleFromWorkspace(role: WorkspaceRole): BusinessMemberRole {
  return role
}
