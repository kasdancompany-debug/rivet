import { describe, expect, it } from "vitest"

import {
  canAccessAppPath,
  filterNavForRole,
  hasWorkspacePermission,
} from "@/lib/ops/workspace-permissions"
import { mainNav } from "@/lib/nav"

describe("workspace permissions", () => {
  it("staff cannot access owner dashboard or settings", () => {
    expect(hasWorkspacePermission("staff", "view_owner_dashboard")).toBe(false)
    expect(hasWorkspacePermission("staff", "manage_workspace_settings")).toBe(false)
    expect(canAccessAppPath("staff", "/dashboard")).toBe(false)
    expect(canAccessAppPath("staff", "/settings")).toBe(false)
  })

  it("staff can view plays and learn portal", () => {
    expect(canAccessAppPath("staff", "/sops")).toBe(true)
    expect(canAccessAppPath("staff", "/learn/training")).toBe(true)
    expect(canAccessAppPath("staff", "/sops/capture")).toBe(false)
  })

  it("trainer sees training nav but not escape plan", () => {
    const nav = filterNavForRole("trainer", mainNav)
    expect(nav.some((i) => i.href === "/training")).toBe(true)
    expect(nav.some((i) => i.href === "/escape-plan")).toBe(false)
    expect(hasWorkspacePermission("trainer", "sign_off_training")).toBe(true)
  })

  it("manager sees operations surfaces", () => {
    expect(hasWorkspacePermission("manager", "view_escape_plan")).toBe(true)
    expect(hasWorkspacePermission("manager", "manage_workspace_settings")).toBe(false)
  })
})
