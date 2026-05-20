"use server"

import { revalidatePath } from "next/cache"

import { fetchBusinessForCurrentUser } from "@/lib/db/queries"
import { INSTALLED_TEMPLATE_FOOTER } from "@/lib/sop-templates/installed-copy"
import { getIndustryPack } from "@/lib/sop-templates/industries"
import { getStarterTemplateById } from "@/lib/sop-templates/starter-templates"
import { createClient } from "@/lib/supabase/server"

export async function installStarterTemplate(
  templateId: string
): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  try {
    const template = getStarterTemplateById(templateId)
    if (!template) {
      return { ok: false, message: "That template was not found." }
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { ok: false, message: "You need to be signed in." }
    }

    const business = await fetchBusinessForCurrentUser(supabase)
    if (!business) {
      return { ok: false, message: "Link your business in Settings before installing templates." }
    }

    const description = [
      template.shortDescription.trim(),
      "",
      INSTALLED_TEMPLATE_FOOTER,
    ].join("\n")

    const { data: created, error: cErr } = await supabase
      .from("standards")
      .insert({
        business_id: business.id,
        title: template.title,
        description,
        category: template.category,
        importance_level: template.importance_level,
        owner_dependency_level: template.owner_dependency_level,
        estimated_time_minutes: template.estimated_time_minutes,
        status: "draft",
        created_by: user.id,
      })
      .select("id")
      .single()

    if (cErr || !created) {
      return { ok: false, message: cErr?.message ?? "Could not create SOP from template." }
    }

    const id = created.id as string

    const rows = template.steps.map((s, index) => ({
      standard_id: id,
      step_order: index,
      title: s.title.trim() || `Step ${index + 1}`,
      instructions: s.instructions.trim(),
      media_url: null as string | null,
      requires_photo_confirmation: Boolean(s.requires_photo_confirmation),
    }))

    if (rows.length > 0) {
      const { error: insErr } = await supabase.from("standard_steps").insert(rows)
      if (insErr) {
        await supabase.from("standards").delete().eq("id", id)
        return { ok: false, message: insErr.message }
      }
    }

    revalidatePath("/sops")
    revalidatePath("/sops/templates")
    revalidatePath(`/sops/${id}`)
    revalidatePath(`/sops/${id}/edit`)
    revalidatePath("/dashboard")
    return { ok: true, id }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Something went wrong."
    return { ok: false, message: msg }
  }
}

export async function installIndustryStarterPack(
  industryId: string
): Promise<{ ok: true; ids: string[] } | { ok: false; message: string }> {
  const pack = getIndustryPack(industryId)
  if (!pack) {
    return { ok: false, message: "That industry pack was not found." }
  }

  const ids: string[] = []
  for (const templateId of pack.templateIds) {
    const res = await installStarterTemplate(templateId)
    if (!res.ok) {
      return {
        ok: false,
        message:
          ids.length > 0
            ? `${res.message} (Installed ${ids.length} of ${pack.templateIds.length} before stopping.)`
            : res.message,
      }
    }
    ids.push(res.id)
  }

  return { ok: true, ids }
}
