"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { fetchCurrentProfile, listBusinessMembersForCurrentBusiness } from "@/lib/db/queries"
import { requireWorkspacePermission } from "@/lib/ops/workspace-auth"
import { defaultHomePathForRole } from "@/lib/ops/workspace-permissions"
import { memberRoleFromWorkspace } from "@/lib/ops/workspace-role-types"
import { getPublicOriginForRequest } from "@/lib/site-public-url"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import {
  INVITABLE_WORKSPACE_ROLES,
  WORKSPACE_INVITE_TTL_DAYS,
  type InvitableWorkspaceRole,
} from "@/lib/workspace-invites/constants"
import { workspaceInviteDisplayStatus } from "@/lib/workspace-invites/display-status"
import { workspaceInviteUrl } from "@/lib/workspace-invites/invite-url"
import {
  isValidInviteEmail,
  normalizeInviteEmail,
} from "@/lib/workspace-invites/normalize-email"
import { parseResolvedWorkspaceInvite } from "@/lib/workspace-invites/parse-resolved-invite"
import { sendWorkspaceInviteEmail } from "@/lib/workspace-invites/send-invite-email"
import { generateWorkspaceInviteToken } from "@/lib/workspace-invites/token"
import type { Tables } from "@/types/database"

function inviteExpiresAt(from = new Date()): string {
  const d = new Date(from)
  d.setUTCDate(d.getUTCDate() + WORKSPACE_INVITE_TTL_DAYS)
  return d.toISOString()
}

function revalidateTeamInvites() {
  revalidatePath("/settings")
  revalidatePath("/dashboard")
}

async function resolveInviteToken(token: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("resolve_workspace_invite", { p_token: token })
  if (error) return parseResolvedWorkspaceInvite(null)
  return parseResolvedWorkspaceInvite(data)
}

async function emailAlreadyMember(
  businessId: string,
  email: string,
  members: { user_id: string }[],
  ownerId: string,
  profiles: { id: string; email: string }[]
): Promise<boolean> {
  const normalized = normalizeInviteEmail(email)
  const memberIds = new Set([...members.map((m) => m.user_id), ownerId])
  return profiles.some(
    (p) => memberIds.has(p.id) && normalizeInviteEmail(p.email) === normalized
  )
}

async function deliverInviteEmail(params: {
  to: string
  businessName: string
  token: string
  role: InvitableWorkspaceRole
  inviterName?: string | null
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const origin = await getPublicOriginForRequest()
  const result = await sendWorkspaceInviteEmail({
    to: params.to,
    businessName: params.businessName,
    inviteUrl: workspaceInviteUrl(params.token, origin),
    role: params.role,
    inviterName: params.inviterName,
  })

  if (!result.ok) {
    return {
      ok: false,
      message:
        result.error ??
        "Could not send invite email. Copy the invite link from Settings or try again.",
    }
  }

  return { ok: true }
}

export type WorkspaceInviteListItem = {
  id: string
  email: string
  role: InvitableWorkspaceRole
  displayStatus: ReturnType<typeof workspaceInviteDisplayStatus>
  expiresAt: string
  acceptedAt: string | null
  lastSentAt: string | null
  sendCount: number
  createdAt: string
}

export async function listWorkspaceInvites(): Promise<
  { ok: true; invites: WorkspaceInviteListItem[] } | { ok: false; message: string }
> {
  const supabase = await createClient()
  const gate = await requireWorkspacePermission(supabase, "manage_workspace_settings")
  if (!gate.ok) return gate

  const { data, error } = await supabase
    .from("workspace_invites")
    .select("*")
    .eq("business_id", gate.business.id)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) return { ok: false, message: error.message }

  const invites: WorkspaceInviteListItem[] = (data ?? []).map((row) => {
    const r = row as Tables<"workspace_invites">
    const role = r.role as InvitableWorkspaceRole
    return {
      id: r.id,
      email: r.email,
      role,
      displayStatus: workspaceInviteDisplayStatus(r),
      expiresAt: r.expires_at,
      acceptedAt: r.accepted_at,
      lastSentAt: r.last_sent_at,
      sendCount: r.send_count,
      createdAt: r.created_at,
    }
  })

  return { ok: true, invites }
}

export async function createWorkspaceInvite(payload: {
  email: string
  role: InvitableWorkspaceRole
}): Promise<{ ok: true; inviteId: string } | { ok: false; message: string }> {
  const email = normalizeInviteEmail(payload.email)
  if (!isValidInviteEmail(email)) {
    return { ok: false, message: "Enter a valid work email address." }
  }

  if (!INVITABLE_WORKSPACE_ROLES.includes(payload.role)) {
    return { ok: false, message: "Choose Manager, Trainer, or Staff for this invite." }
  }

  const supabase = await createClient()
  const gate = await requireWorkspacePermission(supabase, "manage_workspace_settings")
  if (!gate.ok) return gate

  const members = await listBusinessMembersForCurrentBusiness(supabase)
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("business_id", gate.business.id)

  if (
    await emailAlreadyMember(
      gate.business.id,
      email,
      members,
      gate.business.owner_id,
      profiles ?? []
    )
  ) {
    return { ok: false, message: "That email is already on your team." }
  }

  const { data: pending } = await supabase
    .from("workspace_invites")
    .select("id")
    .eq("business_id", gate.business.id)
    .eq("status", "pending")
    .ilike("email", email)
    .maybeSingle()

  if (pending?.id) {
    return {
      ok: false,
      message: "An invite is already pending for that email. Resend it from the list below.",
    }
  }

  const token = generateWorkspaceInviteToken()
  const now = new Date().toISOString()
  const profile = await fetchCurrentProfile(supabase)

  const { data: inserted, error } = await supabase
    .from("workspace_invites")
    .insert({
      business_id: gate.business.id,
      email,
      role: memberRoleFromWorkspace(payload.role),
      token,
      status: "pending",
      invited_by: gate.user.id,
      expires_at: inviteExpiresAt(),
      last_sent_at: now,
      send_count: 1,
      updated_at: now,
    })
    .select("id")
    .single()

  if (error || !inserted?.id) {
    return { ok: false, message: error?.message ?? "Could not create invite." }
  }

  const sent = await deliverInviteEmail({
    to: email,
    businessName: gate.business.name,
    token,
    role: payload.role,
    inviterName: profile?.full_name,
  })

  if (!sent.ok) {
    return sent
  }

  revalidateTeamInvites()
  return { ok: true, inviteId: inserted.id as string }
}

export async function resendWorkspaceInvite(
  inviteId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = await createClient()
  const gate = await requireWorkspacePermission(supabase, "manage_workspace_settings")
  if (!gate.ok) return gate

  const { data: row, error } = await supabase
    .from("workspace_invites")
    .select("*")
    .eq("id", inviteId)
    .eq("business_id", gate.business.id)
    .maybeSingle()

  if (error || !row) {
    return { ok: false, message: "Invite not found." }
  }

  const invite = row as Tables<"workspace_invites">
  if (invite.status === "accepted") {
    return { ok: false, message: "This invite was already accepted." }
  }
  if (invite.status === "revoked") {
    return { ok: false, message: "This invite was revoked. Send a new invite instead." }
  }

  const token = generateWorkspaceInviteToken()
  const now = new Date().toISOString()
  const role = invite.role as InvitableWorkspaceRole
  const profile = await fetchCurrentProfile(supabase)

  const { error: updateErr } = await supabase
    .from("workspace_invites")
    .update({
      token,
      status: "pending",
      expires_at: inviteExpiresAt(),
      last_sent_at: now,
      send_count: invite.send_count + 1,
      updated_at: now,
    })
    .eq("id", inviteId)

  if (updateErr) return { ok: false, message: updateErr.message }

  const sent = await deliverInviteEmail({
    to: invite.email,
    businessName: gate.business.name,
    token,
    role,
    inviterName: profile?.full_name,
  })

  if (!sent.ok) return sent

  revalidateTeamInvites()
  return { ok: true }
}

export async function revokeWorkspaceInvite(
  inviteId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = await createClient()
  const gate = await requireWorkspacePermission(supabase, "manage_workspace_settings")
  if (!gate.ok) return gate

  const now = new Date().toISOString()
  const { error } = await supabase
    .from("workspace_invites")
    .update({
      status: "revoked",
      revoked_at: now,
      updated_at: now,
    })
    .eq("id", inviteId)
    .eq("business_id", gate.business.id)
    .eq("status", "pending")

  if (error) return { ok: false, message: error.message }

  revalidateTeamInvites()
  return { ok: true }
}

export async function acceptWorkspaceInvite(token: string): Promise<never> {
  const trimmed = token.trim()
  if (!trimmed) redirect("/login?error=invalid_invite")

  const invite = await resolveInviteToken(trimmed)
  if (!invite.valid || !invite.businessId || !invite.role || !invite.email) {
    redirect(`/join/${encodeURIComponent(trimmed)}?error=invalid`)
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(`/join/${trimmed}`)}`)

  const userEmail = user.email?.trim().toLowerCase()
  const inviteEmail = normalizeInviteEmail(invite.email)
  if (!userEmail || userEmail !== inviteEmail) {
    redirect(
      `/join/${encodeURIComponent(trimmed)}?error=email_mismatch&expected=${encodeURIComponent(invite.email)}`
    )
  }

  const profile = await fetchCurrentProfile(supabase)
  if (profile?.business_id && profile.business_id !== invite.businessId) {
    redirect(`/join/${encodeURIComponent(trimmed)}?error=other_workspace`)
  }

  const admin = createAdminClient()
  const now = new Date().toISOString()

  const { error: memberErr } = await admin.from("business_members").upsert(
    {
      business_id: invite.businessId,
      user_id: user.id,
      role: memberRoleFromWorkspace(invite.role),
      updated_at: now,
    },
    { onConflict: "business_id,user_id" }
  )
  if (memberErr) {
    redirect(`/join/${encodeURIComponent(trimmed)}?error=join_failed`)
  }

  const { error: profileErr } = await admin
    .from("profiles")
    .update({
      business_id: invite.businessId,
      is_owner: false,
      updated_at: now,
    })
    .eq("id", user.id)

  if (profileErr) {
    redirect(`/join/${encodeURIComponent(trimmed)}?error=join_failed`)
  }

  const { data: inviteRow } = await admin
    .from("workspace_invites")
    .select("id")
    .eq("token", trimmed)
    .maybeSingle()

  if (inviteRow?.id) {
    await admin
      .from("workspace_invites")
      .update({
        status: "accepted",
        accepted_at: now,
        accepted_by_user_id: user.id,
        updated_at: now,
      })
      .eq("id", inviteRow.id)
  }

  revalidateTeamInvites()
  redirect(defaultHomePathForRole(invite.role))
}

export async function getWorkspaceInvitePreview(token: string) {
  return resolveInviteToken(token)
}
