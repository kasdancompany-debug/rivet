import { cookies } from "next/headers"

import { getDevBypassMockUser, shouldSkipSupabaseNetwork } from "@/lib/dev-auth-bypass"
import type { Tables } from "@/types/database"

export const DEV_WORKSPACE_BUSINESS_ID = "00000000-0000-4000-8000-000000000002"

const COOKIE_NAME = "rivet_dev_workspace"

type DevWorkspaceCookie = {
  name: string
  industry: string
  templateInstalledAt: string | null
}

function parseCookie(raw: string | undefined): DevWorkspaceCookie | null {
  if (!raw) return null
  try {
    const p = JSON.parse(raw) as DevWorkspaceCookie
    if (typeof p.name !== "string" || p.name.trim().length < 2) return null
    return {
      name: p.name.trim(),
      industry: typeof p.industry === "string" ? p.industry : "general",
      templateInstalledAt:
        typeof p.templateInstalledAt === "string" ? p.templateInstalledAt : null,
    }
  } catch {
    return null
  }
}

function toBusinessRow(payload: DevWorkspaceCookie): Tables<"businesses"> {
  const now = new Date().toISOString()
  return {
    id: DEV_WORKSPACE_BUSINESS_ID,
    name: payload.name,
    industry: payload.industry,
    industry_template_id: null,
    template_installed_at: payload.templateInstalledAt,
    owner_id: getDevBypassMockUser().id,
    created_at: now,
    updated_at: now,
  }
}

/** Local dev workspace when Supabase is not configured (httpOnly cookie). */
export async function getDevWorkspaceBusiness(): Promise<Tables<"businesses"> | null> {
  if (!shouldSkipSupabaseNetwork()) return null
  const payload = parseCookie((await cookies()).get(COOKIE_NAME)?.value)
  if (!payload) return null
  return toBusinessRow(payload)
}

export async function setDevWorkspaceCookie(name: string, industry = "general") {
  const existing = parseCookie((await cookies()).get(COOKIE_NAME)?.value)
  const payload: DevWorkspaceCookie = {
    name: name.trim(),
    industry,
    templateInstalledAt: existing?.templateInstalledAt ?? null,
  }
  const store = await cookies()
  store.set(COOKIE_NAME, JSON.stringify(payload), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  })
}

export async function markDevWorkspaceTemplateInstalled() {
  const existing = parseCookie((await cookies()).get(COOKIE_NAME)?.value)
  if (!existing) return
  const payload: DevWorkspaceCookie = {
    ...existing,
    templateInstalledAt: new Date().toISOString(),
  }
  const store = await cookies()
  store.set(COOKIE_NAME, JSON.stringify(payload), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  })
}
