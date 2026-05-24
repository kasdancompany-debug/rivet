"use server"

import { revalidatePath } from "next/cache"
import type { User } from "@supabase/supabase-js"

import { fetchBusinessForCurrentUser, fetchCurrentProfile } from "@/lib/db/queries"
import { createClient } from "@/lib/supabase/server"
import { tryCreateAdminClient } from "@/lib/supabase/try-admin-client"
import { isDevAuthBypassEnabled, shouldSkipSupabaseNetwork } from "@/lib/dev-auth-bypass"
import {
  DEV_WORKSPACE_BUSINESS_ID,
  setDevWorkspaceCookie,
} from "@/lib/dev-workspace"
import { COPY } from "@/lib/interface-copy"

const INDUSTRY_PACK_IDS = new Set([
  "cafes",
  "restaurant",
  "cleaning",
  "bakeries",
  "salons",
  "retail",
  "service",
  "contractors",
  "auto_dealership",
  "office",
])

function ownerDisplayName(user: User): string {
  const meta = user.user_metadata as { full_name?: string } | undefined
  return meta?.full_name?.trim() || user.email?.split("@")[0] || "Owner"
}

function workspaceSetupErrorMessage(raw: string | undefined): string {
  const message = raw?.trim() || "Could not create the workspace."
  if (message.includes("row-level security policy") && message.includes("businesses")) {
    return `${message} Run the latest Supabase migration (provision_business_workspace) on the project linked to this app, then try again.`
  }
  if (message.includes("Could not find the function") || message.includes("schema cache")) {
    return `${message} Apply supabase/migrations/20260621120000_businesses_create_workspace_rpc.sql and 20260622120000_provision_business_workspace.sql on your Supabase project.`
  }
  return message
}

async function provisionViaAdminClient(
  user: User,
  trimmed: string,
  industry: string
): Promise<{ ok: true; businessId: string } | { ok: false; message: string }> {
  const admin = tryCreateAdminClient()
  if (!admin) {
    return { ok: false, message: "Could not create the workspace." }
  }

  const displayName = ownerDisplayName(user)
  const email = user.email?.trim() || `${user.id.slice(0, 8)}@placeholder.local`

  const { data: business, error: bErr } = await admin
    .from("businesses")
    .insert({ name: trimmed, industry, owner_id: user.id })
    .select("id")
    .single()

  if (bErr || !business?.id) {
    return { ok: false, message: workspaceSetupErrorMessage(bErr?.message) }
  }

  const businessId = business.id as string

  const { error: memberErr } = await admin.from("business_members").upsert(
    {
      business_id: businessId,
      user_id: user.id,
      role: "owner" as const,
    },
    { onConflict: "business_id,user_id" }
  )
  if (memberErr) {
    await admin.from("businesses").delete().eq("id", businessId)
    return { ok: false, message: memberErr.message }
  }

  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle()

  if (existingProfile) {
    const { error: uErr } = await admin
      .from("profiles")
      .update({ business_id: businessId, is_owner: true })
      .eq("id", user.id)
    if (uErr) {
      await admin.from("businesses").delete().eq("id", businessId)
      return { ok: false, message: uErr.message }
    }
  } else {
    const { error: iErr } = await admin.from("profiles").insert({
      id: user.id,
      full_name: displayName,
      email,
      business_id: businessId,
      is_owner: true,
    })
    if (iErr) {
      await admin.from("businesses").delete().eq("id", businessId)
      return { ok: false, message: iErr.message }
    }
  }

  const { data: existingTm } = await admin
    .from("team_members")
    .select("id")
    .eq("business_id", businessId)
    .eq("profile_id", user.id)
    .maybeSingle()

  if (!existingTm) {
    await admin.from("team_members").insert({
      business_id: businessId,
      profile_id: user.id,
      display_name: displayName,
    })
  }

  return { ok: true, businessId }
}

export async function createWorkspaceForCurrentUser(
  name: string,
  industryPackId?: string
): Promise<{ ok: true; businessId: string } | { ok: false; message: string }> {
  const trimmed = name.trim()
  if (trimmed.length < 2) {
    return { ok: false, message: "Enter a business name (at least 2 characters)." }
  }
  if (trimmed.length > 120) {
    return { ok: false, message: "Use a shorter business name (120 characters max)." }
  }

  const industry =
    industryPackId && INDUSTRY_PACK_IDS.has(industryPackId) ? industryPackId : "general"

  if (shouldSkipSupabaseNetwork()) {
    await setDevWorkspaceCookie(trimmed, industry)
    revalidatePath("/", "layout")
    revalidatePath("/dashboard")
    revalidatePath("/settings")
    revalidatePath("/setup")
    revalidatePath("/onboarding")
    return { ok: true, businessId: DEV_WORKSPACE_BUSINESS_ID }
  }

  try {
    const supabase = await createClient()
    let user = (await supabase.auth.getUser()).data.user
    if (!user) {
      const session = (await supabase.auth.getSession()).data.session
      user = session?.user ?? null
    }
    if (!user) {
      return {
        ok: false,
        message: isDevAuthBypassEnabled()
          ? COPY.settingsWorkspace.serverSessionRequiredBypass
          : COPY.settingsWorkspace.serverSessionRequired,
      }
    }

    const existing = await fetchBusinessForCurrentUser(supabase)
    if (existing) {
      return { ok: true, businessId: existing.id }
    }

    const displayName =
      (await fetchCurrentProfile(supabase))?.full_name?.trim() || ownerDisplayName(user)

    const { data: provisionedId, error: provisionErr } = await supabase.rpc(
      "provision_business_workspace",
      {
        p_name: trimmed,
        p_industry: industry,
        p_display_name: displayName,
      }
    )

    if (!provisionErr && provisionedId) {
      revalidatePath("/", "layout")
      revalidatePath("/dashboard")
      revalidatePath("/settings")
      revalidatePath("/setup")
      revalidatePath("/subscribe")
      return { ok: true, businessId: provisionedId as string }
    }

    const { data: createdBusinessId, error: legacyErr } = await supabase.rpc(
      "create_business_workspace",
      {
        p_name: trimmed,
        p_industry: industry,
      }
    )

    if (!legacyErr && createdBusinessId) {
      const businessId = createdBusinessId as string
      const profile = await fetchCurrentProfile(supabase)
      const ensureMembershipAndTeam = async (teamDisplayName: string) => {
        await supabase.from("business_members").upsert(
          {
            business_id: businessId,
            user_id: user!.id,
            role: "owner" as const,
          },
          { onConflict: "business_id,user_id" }
        )
        const { data: existingTm } = await supabase
          .from("team_members")
          .select("id")
          .eq("business_id", businessId)
          .eq("profile_id", user!.id)
          .maybeSingle()
        if (!existingTm) {
          await supabase.from("team_members").insert({
            business_id: businessId,
            profile_id: user!.id,
            display_name: teamDisplayName,
          })
        }
      }

      if (profile) {
        const { error: uErr } = await supabase
          .from("profiles")
          .update({ business_id: businessId, is_owner: true })
          .eq("id", user.id)
        if (uErr) {
          const adminFallback = await provisionViaAdminClient(user, trimmed, industry)
          if (adminFallback.ok) {
            revalidatePath("/", "layout")
            revalidatePath("/dashboard")
            revalidatePath("/settings")
            revalidatePath("/setup")
            revalidatePath("/subscribe")
            return adminFallback
          }
          return { ok: false, message: workspaceSetupErrorMessage(uErr.message) }
        }
        await ensureMembershipAndTeam(profile.full_name?.trim() || displayName)
      } else {
        const email = user.email?.trim() || `${user.id.slice(0, 8)}@placeholder.local`
        const { error: iErr } = await supabase.from("profiles").insert({
          id: user.id,
          full_name: displayName,
          email,
          business_id: businessId,
          is_owner: true,
        })
        if (iErr) {
          const adminFallback = await provisionViaAdminClient(user, trimmed, industry)
          if (adminFallback.ok) {
            revalidatePath("/", "layout")
            revalidatePath("/dashboard")
            revalidatePath("/settings")
            revalidatePath("/setup")
            revalidatePath("/subscribe")
            return adminFallback
          }
          return { ok: false, message: workspaceSetupErrorMessage(iErr.message) }
        }
        await ensureMembershipAndTeam(displayName)
      }

      revalidatePath("/", "layout")
      revalidatePath("/dashboard")
      revalidatePath("/settings")
      revalidatePath("/setup")
      revalidatePath("/subscribe")
      return { ok: true, businessId }
    }

    const adminResult = await provisionViaAdminClient(user, trimmed, industry)
    if (adminResult.ok) {
      revalidatePath("/", "layout")
      revalidatePath("/dashboard")
      revalidatePath("/settings")
      revalidatePath("/setup")
      revalidatePath("/subscribe")
      return adminResult
    }

    const rpcMessage = provisionErr?.message ?? legacyErr?.message
    return { ok: false, message: workspaceSetupErrorMessage(rpcMessage) }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}
