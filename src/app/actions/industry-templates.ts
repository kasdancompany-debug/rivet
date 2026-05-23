"use server"

import { revalidatePath } from "next/cache"

import { fetchBusinessForCurrentUser } from "@/lib/db/queries"
import {
  FOUNDATION_INTERRUPTION_COUNT,
  FOUNDATION_ISSUE_COUNT,
  FOUNDATION_SOP_COUNT,
  FOUNDATION_TRAINING_COUNT,
  getIndustryTemplateBundle,
  isRivetIndustryTemplateId,
  rivetIndustryToSopPackId,
  type IndustryTemplateInstallCounts,
  type RivetIndustryTemplateId,
} from "@/lib/industry-templates"
import { INSTALLED_TEMPLATE_FOOTER } from "@/lib/sop-templates/installed-copy"
import { getStarterTemplateById } from "@/lib/sop-templates/starter-templates"
import { shouldSkipSupabaseNetwork } from "@/lib/dev-auth-bypass"
import {
  getDevWorkspaceBusiness,
  markDevWorkspaceTemplateInstalled,
} from "@/lib/dev-workspace"
import { createClient } from "@/lib/supabase/server"
import type { StandardStatus } from "@/types/database"

export type InstallIndustryTemplateResult =
  | { ok: true; counts: IndustryTemplateInstallCounts; alreadyInstalled: boolean }
  | { ok: false; message: string }

function foundationInstallCounts(): IndustryTemplateInstallCounts {
  return {
    sops: FOUNDATION_SOP_COUNT,
    trainingModules: FOUNDATION_TRAINING_COUNT,
    interruptionWorkflows: FOUNDATION_INTERRUPTION_COUNT,
    issueWorkflows: FOUNDATION_ISSUE_COUNT,
  }
}

function statusForTemplate(templateId: string, category: string): StandardStatus {
  if (category === "opening" || category === "closing") return "active"
  if (templateId.includes("-opening") || templateId.includes("-open") || templateId.includes("-day-open")) {
    return "active"
  }
  if (templateId.includes("-closing") || templateId.includes("-close") || templateId.includes("-day-end")) {
    return "active"
  }
  return "draft"
}

export async function installIndustryTemplateBundle(
  industryId: RivetIndustryTemplateId
): Promise<InstallIndustryTemplateResult> {
  if (!isRivetIndustryTemplateId(industryId)) {
    return { ok: false, message: "Pick a business type to continue." }
  }

  const bundle = getIndustryTemplateBundle(industryId)
  if (!bundle) {
    return { ok: false, message: "That industry template was not found." }
  }

  if (shouldSkipSupabaseNetwork()) {
    const business = await getDevWorkspaceBusiness()
    if (!business) {
      return { ok: false, message: "Create your workspace first." }
    }
    await markDevWorkspaceTemplateInstalled()
    revalidatePath("/onboarding")
    revalidatePath("/setup")
    return {
      ok: true,
      alreadyInstalled: Boolean(business.template_installed_at),
      counts: foundationInstallCounts(),
    }
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { ok: false, message: "You need to be signed in." }
    }

    const business = await fetchBusinessForCurrentUser(supabase)
    if (!business) {
      return { ok: false, message: "Create your workspace first." }
    }

    if (business.template_installed_at) {
      const counts = await countInstalledAssets(supabase, business.id)
      return { ok: true, counts, alreadyInstalled: true }
    }

    const templateIdToStandardId = new Map<string, string>()

    for (const templateId of bundle.sopTemplateIds) {
      const template = getStarterTemplateById(templateId)
      if (!template) {
        return { ok: false, message: `Missing template: ${templateId}` }
      }

      const description = [template.shortDescription.trim(), "", INSTALLED_TEMPLATE_FOOTER].join("\n")
      const status = statusForTemplate(templateId, template.category)

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
          status,
          created_by: user.id,
        })
        .select("id")
        .single()

      if (cErr || !created) {
        return { ok: false, message: cErr?.message ?? `Could not install ${template.title}.` }
      }

      const standardId = created.id as string
      templateIdToStandardId.set(templateId, standardId)

      const rows = template.steps.map((s, index) => ({
        standard_id: standardId,
        step_order: index,
        title: s.title.trim() || `Step ${index + 1}`,
        instructions: s.instructions.trim(),
        media_url: null as string | null,
        requires_photo_confirmation: Boolean(s.requires_photo_confirmation),
      }))

      if (rows.length > 0) {
        const { error: insErr } = await supabase.from("standard_steps").insert(rows)
        if (insErr) {
          return { ok: false, message: insErr.message }
        }
      }
    }

    let trainingCount = 0
    for (const mod of bundle.trainingModules) {
      const { data: modRow, error: modErr } = await supabase
        .from("training_modules")
        .insert({
          business_id: business.id,
          title: mod.title,
          description: mod.description,
          assigned_role: mod.assignedRole,
        })
        .select("id")
        .single()

      if (modErr || !modRow) {
        return { ok: false, message: modErr?.message ?? "Could not create training module." }
      }
      trainingCount++

      const itemRows = mod.standardTemplateIds
        .map((tid) => templateIdToStandardId.get(tid))
        .filter((id): id is string => Boolean(id))
        .map((standard_id) => ({
          module_id: modRow.id as string,
          standard_id,
          required: true,
        }))

      if (itemRows.length > 0) {
        const { error: itemErr } = await supabase.from("training_items").insert(itemRows)
        if (itemErr) {
          return { ok: false, message: itemErr.message }
        }
      }
    }

    const playbookRows = [
      ...bundle.interruptionWorkflows.map((w, i) => ({
        business_id: business.id,
        playbook_type: "interruption" as const,
        title: w.title,
        summary: w.summary,
        detail: w.detail,
        kind: w.kind,
        category: null,
        severity: null,
        sort_order: i,
      })),
      ...bundle.issueWorkflows.map((w, i) => ({
        business_id: business.id,
        playbook_type: "issue" as const,
        title: w.title,
        summary: w.description,
        detail: w.description,
        kind: null,
        category: w.category,
        severity: w.severity,
        sort_order: 100 + i,
      })),
    ]

    if (playbookRows.length > 0) {
      const { error: pbErr } = await supabase.from("workspace_playbooks").insert(playbookRows)
      if (pbErr) {
        return { ok: false, message: pbErr.message }
      }
    }

    const sopPackId = rivetIndustryToSopPackId(industryId)
    const { error: bizErr } = await supabase
      .from("businesses")
      .update({
        industry: sopPackId,
        industry_template_id: industryId,
        template_installed_at: new Date().toISOString(),
      })
      .eq("id", business.id)

    if (bizErr) {
      return { ok: false, message: bizErr.message }
    }

    const counts: IndustryTemplateInstallCounts = {
      ...foundationInstallCounts(),
      trainingModules: trainingCount,
    }

    revalidateAll()
    return { ok: true, counts, alreadyInstalled: false }
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Could not install your industry template.",
    }
  }
}

async function countInstalledAssets(
  supabase: Awaited<ReturnType<typeof createClient>>,
  businessId: string
): Promise<IndustryTemplateInstallCounts> {
  const [sops, training, interruptions] = await Promise.all([
    supabase.from("standards").select("id", { count: "exact", head: true }).eq("business_id", businessId),
    supabase.from("training_modules").select("id", { count: "exact", head: true }).eq("business_id", businessId),
    supabase
      .from("workspace_playbooks")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("playbook_type", "interruption"),
  ])

  const issuePlaybooks = await supabase
    .from("workspace_playbooks")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("playbook_type", "issue")

  return {
    sops: sops.count ?? 0,
    trainingModules: training.count ?? 0,
    interruptionWorkflows: interruptions.count ?? 0,
    issueWorkflows: issuePlaybooks.count ?? 0,
  }
}

function revalidateAll() {
  revalidatePath("/", "layout")
  revalidatePath("/dashboard")
  revalidatePath("/onboarding")
  revalidatePath("/setup")
  revalidatePath("/sops")
  revalidatePath("/training")
  revalidatePath("/interruptions")
  revalidatePath("/issues")
}
