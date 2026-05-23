"use server"

import { revalidatePath } from "next/cache"

import { fetchBusinessForCurrentUser, fetchCurrentProfile } from "@/lib/db/queries"
import { createClient } from "@/lib/supabase/server"
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

    const { data: createdBusinessId, error: bErr } = await supabase.rpc("create_business_workspace", {
      p_name: trimmed,
      p_industry: industry,
    })

    if (bErr || !createdBusinessId) {
      return { ok: false, message: bErr?.message ?? "Could not create the workspace." }
    }

    const businessId = createdBusinessId as string
    const biz = { id: businessId }
    const profile = await fetchCurrentProfile(supabase)

    const ensureMembershipAndTeam = async (displayName: string) => {
      await supabase.from("business_members").upsert(
        {
          business_id: businessId,
          user_id: user.id,
          role: "owner" as const,
        },
        { onConflict: "business_id,user_id" }
      )
      const { data: existingTm } = await supabase
        .from("team_members")
        .select("id")
        .eq("business_id", businessId)
        .eq("profile_id", user.id)
        .maybeSingle()
      if (!existingTm) {
        await supabase.from("team_members").insert({
          business_id: businessId,
          profile_id: user.id,
          display_name: displayName,
        })
      }
    }

    if (profile) {
      const { error: uErr } = await supabase
        .from("profiles")
        .update({ business_id: businessId, is_owner: true })
        .eq("id", user.id)
      if (uErr) {
        await supabase.from("businesses").delete().eq("id", businessId)
        return { ok: false, message: uErr.message }
      }
      await ensureMembershipAndTeam(profile.full_name?.trim() || user.email?.split("@")[0] || "Owner")
    } else {
      const meta = user.user_metadata as { full_name?: string } | undefined
      const fullName = meta?.full_name?.trim() || user.email?.split("@")[0] || "Owner"
      const email = user.email?.trim() || `${user.id.slice(0, 8)}@placeholder.local`
      const { error: iErr } = await supabase.from("profiles").insert({
        id: user.id,
        full_name: fullName,
        email,
        business_id: businessId,
        is_owner: true,
      })
      if (iErr) {
        await supabase.from("businesses").delete().eq("id", businessId)
        return { ok: false, message: iErr.message }
      }
      await ensureMembershipAndTeam(fullName)
    }

    revalidatePath("/", "layout")
    revalidatePath("/dashboard")
    revalidatePath("/settings")
    revalidatePath("/setup")
    return { ok: true, businessId }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}
