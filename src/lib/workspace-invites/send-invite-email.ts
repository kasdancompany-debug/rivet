import { Resend } from "resend"

import { WORKSPACE_ROLE_LABELS } from "@/lib/ops/workspace-role-types"
import type { InvitableWorkspaceRole } from "@/lib/workspace-invites/constants"
import { normalizeMemberRole } from "@/lib/ops/workspace-role-types"

export type SendWorkspaceInviteEmailInput = {
  to: string
  businessName: string
  inviteUrl: string
  role: InvitableWorkspaceRole
  inviterName?: string | null
}

export type SendWorkspaceInviteEmailResult =
  | { ok: true; provider: "resend" | "mock"; providerMessageId?: string }
  | { ok: false; error: string; provider: "resend" | "mock" }

function buildHtml(input: SendWorkspaceInviteEmailInput): string {
  const roleLabel = WORKSPACE_ROLE_LABELS[normalizeMemberRole(input.role)]
  const inviter = input.inviterName?.trim()
  const intro = inviter
    ? `${inviter} invited you to join <strong>${input.businessName}</strong> on Rivet.`
    : `You have been invited to join <strong>${input.businessName}</strong> on Rivet.`

  return `<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;line-height:1.5;color:#18181b;max-width:560px;margin:0 auto;padding:24px">
  <p style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#71717a">Rivet team invite</p>
  <p>${intro}</p>
  <p>Your role: <strong>${roleLabel}</strong></p>
  <p style="margin:24px 0"><a href="${input.inviteUrl}" style="display:inline-block;background:#18181b;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Accept invite</a></p>
  <p style="font-size:13px;color:#52525b">This link expires in 7 days. If you already have a Rivet account, sign in with this email address.</p>
  <p style="font-size:12px;color:#a1a1aa;margin-top:32px">${input.inviteUrl}</p>
</body>
</html>`
}

export async function sendWorkspaceInviteEmail(
  input: SendWorkspaceInviteEmailInput
): Promise<SendWorkspaceInviteEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const from =
    process.env.RESEND_FROM_EMAIL?.trim() ?? "Rivet Team <team@rivet.app>"
  const roleLabel = WORKSPACE_ROLE_LABELS[normalizeMemberRole(input.role)]
  const subject = `Join ${input.businessName} on Rivet (${roleLabel})`

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      return { ok: false, error: "RESEND_API_KEY is not configured.", provider: "mock" }
    }
    console.info("[workspace invite email mock]", input.to, input.inviteUrl)
    return { ok: true, provider: "mock", providerMessageId: `mock-invite-${Date.now()}` }
  }

  const resend = new Resend(apiKey)
  const { data, error } = await resend.emails.send({
    from,
    to: input.to,
    subject,
    html: buildHtml(input),
  })

  if (error) {
    return { ok: false, error: error.message, provider: "resend" }
  }

  return { ok: true, provider: "resend", providerMessageId: data?.id }
}
