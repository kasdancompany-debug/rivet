import { describe, expect, it } from "vitest"

import {
  WORKSPACE_INVITE_STATUS_LABEL,
  workspaceInviteDisplayStatus,
} from "@/lib/workspace-invites/display-status"
import { workspaceInviteUrl } from "@/lib/workspace-invites/invite-url"
import {
  isValidInviteEmail,
  normalizeInviteEmail,
} from "@/lib/workspace-invites/normalize-email"
import { parseResolvedWorkspaceInvite } from "@/lib/workspace-invites/parse-resolved-invite"

describe("normalizeInviteEmail", () => {
  it("trims and lowercases", () => {
    expect(normalizeInviteEmail("  Crew@Shop.COM  ")).toBe("crew@shop.com")
  })
})

describe("isValidInviteEmail", () => {
  it("accepts common work emails", () => {
    expect(isValidInviteEmail("crew@shop.com")).toBe(true)
  })

  it("rejects malformed addresses", () => {
    expect(isValidInviteEmail("not-an-email")).toBe(false)
    expect(isValidInviteEmail("@shop.com")).toBe(false)
  })
})

describe("workspaceInviteDisplayStatus", () => {
  const now = new Date("2026-05-25T12:00:00.000Z")

  it("returns accepted and revoked from status", () => {
    expect(
      workspaceInviteDisplayStatus(
        { status: "accepted", expires_at: "2099-01-01T00:00:00.000Z" },
        now
      )
    ).toBe("accepted")
    expect(
      workspaceInviteDisplayStatus(
        { status: "revoked", expires_at: "2099-01-01T00:00:00.000Z" },
        now
      )
    ).toBe("revoked")
  })

  it("returns expired when past expires_at while pending", () => {
    expect(
      workspaceInviteDisplayStatus(
        { status: "pending", expires_at: "2026-05-24T00:00:00.000Z" },
        now
      )
    ).toBe("expired")
  })

  it("returns pending for active invites", () => {
    expect(
      workspaceInviteDisplayStatus(
        { status: "pending", expires_at: "2026-06-01T00:00:00.000Z" },
        now
      )
    ).toBe("pending")
  })
})

describe("WORKSPACE_INVITE_STATUS_LABEL", () => {
  it("maps display statuses for the settings UI", () => {
    expect(WORKSPACE_INVITE_STATUS_LABEL.pending).toBe("Pending")
    expect(WORKSPACE_INVITE_STATUS_LABEL.accepted).toBe("Accepted")
    expect(WORKSPACE_INVITE_STATUS_LABEL.expired).toBe("Expired")
  })
})

describe("parseResolvedWorkspaceInvite", () => {
  it("parses a valid invite payload", () => {
    expect(
      parseResolvedWorkspaceInvite({
        valid: true,
        inviteId: "inv-1",
        businessId: "biz-1",
        businessName: "Main St Bakery",
        email: "crew@shop.com",
        role: "trainer",
      })
    ).toEqual({
      valid: true,
      inviteId: "inv-1",
      businessId: "biz-1",
      businessName: "Main St Bakery",
      email: "crew@shop.com",
      role: "trainer",
    })
  })

  it("maps invalid reasons", () => {
    expect(parseResolvedWorkspaceInvite({ valid: false, reason: "expired" })).toMatchObject({
      valid: false,
      reason: "expired",
    })
    expect(parseResolvedWorkspaceInvite(null)).toEqual({
      valid: false,
      reason: "not_found",
    })
  })

  it("defaults unknown roles to staff", () => {
    expect(parseResolvedWorkspaceInvite({ valid: true, role: "bogus" }).role).toBe("staff")
  })
})

describe("workspaceInviteUrl", () => {
  it("builds a join URL from origin and token", () => {
    expect(workspaceInviteUrl("abc123", "https://app.rivet.test")).toBe(
      "https://app.rivet.test/join/abc123"
    )
  })
})
