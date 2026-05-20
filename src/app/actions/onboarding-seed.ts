"use server"

import { installIndustryTemplateBundle } from "@/app/actions/industry-templates"
import { fetchBusinessForCurrentUser } from "@/lib/db/queries"
import { isRivetIndustryTemplateId } from "@/lib/industry-templates"
import { createClient } from "@/lib/supabase/server"

/**
 * Legacy hook after reality check — ensures template bundle exists when industry is known.
 */
export async function seedStarterStandardsIfEmpty(): Promise<
  { ok: true; seeded: boolean } | { ok: false; message: string }
> {
  try {
    const supabase = await createClient()
    const business = await fetchBusinessForCurrentUser(supabase)
    if (!business) {
      return { ok: false, message: "No workspace linked." }
    }

    if (business.template_installed_at) {
      return { ok: true, seeded: false }
    }

    const templateId = business.industry_template_id
    if (templateId && isRivetIndustryTemplateId(templateId)) {
      const res = await installIndustryTemplateBundle(templateId)
      if (!res.ok) {
        return { ok: false, message: res.message }
      }
      return { ok: true, seeded: !res.alreadyInstalled }
    }

    return { ok: true, seeded: false }
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Could not install starter standards.",
    }
  }
}
