import type { NavItem } from "@/lib/nav"
import { mainNav } from "@/lib/nav"
import type { WorkspaceRole } from "@/lib/ops/workspace-role-types"

export type WorkspacePermission =
  | "view_owner_dashboard"
  | "manage_workspace_settings"
  | "manage_billing"
  | "view_reality_check"
  | "view_plays"
  | "capture_plays"
  | "edit_plays"
  | "view_escape_plan"
  | "view_owner_interruptions"
  | "manage_owner_interruptions"
  | "view_operational_alerts"
  | "manage_issues"
  | "view_training_center"
  | "manage_team_training"
  | "manage_training_modules"
  | "sign_off_training"
  | "record_manager_observations"

const OWNER: WorkspacePermission[] = [
  "view_owner_dashboard",
  "manage_workspace_settings",
  "manage_billing",
  "view_reality_check",
  "view_plays",
  "capture_plays",
  "edit_plays",
  "view_escape_plan",
  "view_owner_interruptions",
  "manage_owner_interruptions",
  "view_operational_alerts",
  "manage_issues",
  "view_training_center",
  "manage_team_training",
  "manage_training_modules",
  "sign_off_training",
  "record_manager_observations",
]

const MANAGER: WorkspacePermission[] = [
  "view_owner_dashboard",
  "view_reality_check",
  "view_plays",
  "capture_plays",
  "edit_plays",
  "view_escape_plan",
  "view_owner_interruptions",
  "manage_owner_interruptions",
  "view_operational_alerts",
  "manage_issues",
  "view_training_center",
  "manage_team_training",
  "manage_training_modules",
  "sign_off_training",
  "record_manager_observations",
]

const TRAINER: WorkspacePermission[] = [
  "view_training_center",
  "manage_team_training",
  "manage_training_modules",
  "sign_off_training",
  "record_manager_observations",
  "view_operational_alerts",
  "view_plays",
  "edit_plays",
]

const STAFF: WorkspacePermission[] = ["view_plays"]

const BY_ROLE: Record<WorkspaceRole, ReadonlySet<WorkspacePermission>> = {
  owner: new Set(OWNER),
  manager: new Set(MANAGER),
  trainer: new Set(TRAINER),
  staff: new Set(STAFF),
}

export function permissionsForRole(role: WorkspaceRole): ReadonlySet<WorkspacePermission> {
  return BY_ROLE[role]
}

export function hasWorkspacePermission(
  role: WorkspaceRole,
  permission: WorkspacePermission
): boolean {
  return permissionsForRole(role).has(permission)
}

/** First path segment groups used for middleware route checks. */
const PATH_PERMISSION: Record<string, WorkspacePermission | WorkspacePermission[]> = {
  "/dashboard": "view_owner_dashboard",
  "/questions-prevented": "view_owner_dashboard",
  "/brain": "view_owner_dashboard",
  "/onboarding": "view_reality_check",
  "/sops/capture": "capture_plays",
  "/escape-plan": "view_escape_plan",
  "/interruptions": "view_owner_interruptions",
  "/training": "view_training_center",
  "/training/matrix": "view_training_center",
  "/training/succession": "view_training_center",
  "/alerts": "view_operational_alerts",
  "/issues": "manage_issues",
  "/settings": "manage_workspace_settings",
  "/subscribe": "manage_billing",
}

function permissionForAppPath(pathname: string): WorkspacePermission | null {
  if (pathname === "/sops" || pathname.startsWith("/sops/")) {
    if (pathname.startsWith("/sops/capture")) return "capture_plays"
    if (pathname.match(/^\/sops\/[^/]+\/(edit|compose)/)) return "edit_plays"
    return "view_plays"
  }
  const exact = PATH_PERMISSION[pathname]
  if (exact) return Array.isArray(exact) ? exact[0]! : exact
  for (const [prefix, perm] of Object.entries(PATH_PERMISSION)) {
    if (prefix !== "/sops" && pathname.startsWith(prefix + "/")) {
      return Array.isArray(perm) ? perm[0]! : perm
    }
  }
  if (pathname.startsWith("/ask")) return null
  if (pathname.startsWith("/search")) return "view_plays"
  if (pathname.startsWith("/learn")) return null
  return null
}

export function canAccessAppPath(role: WorkspaceRole, pathname: string): boolean {
  const perm = permissionForAppPath(pathname)
  if (!perm) return true
  return hasWorkspacePermission(role, perm)
}

export function defaultHomePathForRole(role: WorkspaceRole): string {
  if (role === "staff") return "/learn"
  if (role === "trainer") return "/training"
  return "/dashboard"
}

const NAV_HREF_PERMISSION: Record<string, WorkspacePermission> = {
  "/dashboard": "view_owner_dashboard",
  "/brain": "view_owner_dashboard",
  "/onboarding": "view_reality_check",
  "/sops": "view_plays",
  "/sops/capture": "capture_plays",
  "/ask": "view_plays",
  "/search": "view_plays",
  "/alerts": "view_operational_alerts",
  "/training": "view_training_center",
  "/learn": "view_plays",
  "/interruptions": "view_owner_interruptions",
  "/issues": "manage_issues",
  "/escape-plan": "view_escape_plan",
  "/settings": "manage_workspace_settings",
}

export function filterNavForRole(role: WorkspaceRole, items: NavItem[] = mainNav): NavItem[] {
  return items.filter((item) => {
    const perm = NAV_HREF_PERMISSION[item.href]
    if (!perm) return true
    return hasWorkspacePermission(role, perm)
  })
}

export function permissionDeniedMessage(permission: WorkspacePermission): string {
  switch (permission) {
    case "manage_workspace_settings":
      return "Only the workspace owner can change account and billing settings."
    case "manage_billing":
      return "Only the workspace owner can manage billing."
    case "sign_off_training":
      return "You do not have permission to sign off training steps."
    case "manage_team_training":
      return "You do not have permission to manage team training."
    case "manage_training_modules":
      return "You do not have permission to edit training modules."
    case "capture_plays":
      return "You do not have permission to capture or create plays."
    case "view_owner_dashboard":
      return "This overview is for owners and managers."
    case "view_escape_plan":
    case "view_owner_interruptions":
    case "manage_owner_interruptions":
      return "This area is for owners and managers."
    default:
      return "You do not have permission to do that."
  }
}
