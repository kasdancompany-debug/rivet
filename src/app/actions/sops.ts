"use server"

import { revalidatePath } from "next/cache"

import { isSopCategory } from "@/lib/sops/categories"
import { createClient } from "@/lib/supabase/server"
import type { Json, StandardStatus } from "@/types/database"

export type SopStepPayload = {
  title: string
  instructions: string
  media_url: string | null
  requires_photo_confirmation: boolean
}

export type SaveSopPayload = {
  sopId?: string
  businessId: string
  title: string
  description: string | null
  category: string
  importance_level: number
  owner_dependency_level: number
  estimated_time_minutes: number | null
  status: StandardStatus
  steps: SopStepPayload[]
  /** When omitted on update, existing capture JSON is left unchanged. */
  standards_capture?: Json
}

function countAssignedRolesInCapture(capture: Json | undefined): number {
  if (capture === undefined || capture === null) return 0
  if (typeof capture !== "object" || Array.isArray(capture)) return 0
  const ar = (capture as Record<string, unknown>).assignedRoles
  if (!Array.isArray(ar)) return 0
  return ar.filter((r) => typeof r === "string" && r.trim().length > 0).length
}

function validatePublishRequirements(payload: SaveSopPayload): string | null {
  if (payload.status !== "active") return null
  const desc = payload.description?.trim() ?? ""
  if (desc.length < 8) {
    return "Add a short purpose (at least one clear sentence) before publishing."
  }
  const usableSteps = payload.steps.filter(
    (s) => s.title.trim().length >= 2 && s.instructions.trim().length >= 4
  )
  if (usableSteps.length < 1) {
    return "Add at least one step with a title and instructions before publishing."
  }
  if (payload.standards_capture !== undefined) {
    if (countAssignedRolesInCapture(payload.standards_capture) < 1) {
      return "Select or add at least one owner role before publishing."
    }
  }
  return null
}

function clampInt(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(Number(n)) || min))
}

export async function saveSop(
  payload: SaveSopPayload
): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { ok: false, message: "You need to be signed in." }
    }

    const title = payload.title.trim()
    if (!title) {
      return { ok: false, message: "Please add a title." }
    }

    if (!isSopCategory(payload.category)) {
      return { ok: false, message: "Pick a category from the list." }
    }

    const importance = clampInt(payload.importance_level, 1, 5)
    const dependency = clampInt(payload.owner_dependency_level, 1, 5)
    const status = payload.status
    if (!["draft", "active", "archived"].includes(status)) {
      return { ok: false, message: "Invalid status." }
    }

    const publishErr = validatePublishRequirements(payload)
    if (publishErr) {
      return { ok: false, message: publishErr }
    }

    const description =
      payload.description?.trim() === "" ? null : payload.description?.trim() ?? null

    const est =
      payload.estimated_time_minutes === null ||
      Number.isNaN(Number(payload.estimated_time_minutes))
        ? null
        : Math.max(0, Math.round(Number(payload.estimated_time_minutes)))

    const steps = payload.steps.map((s, index) => ({
      step_order: index,
      title: s.title.trim() || `Step ${index + 1}`,
      instructions: s.instructions.trim(),
      media_url:
        s.media_url?.trim() === "" || !s.media_url ? null : s.media_url.trim(),
      requires_photo_confirmation: Boolean(s.requires_photo_confirmation),
    }))

    const existingId = payload.sopId
    if (existingId) {
      const baseUpdate = {
        title,
        description,
        category: payload.category,
        importance_level: importance,
        owner_dependency_level: dependency,
        estimated_time_minutes: est,
        status,
      }
      const updateRow =
        payload.standards_capture === undefined
          ? baseUpdate
          : { ...baseUpdate, standards_capture: payload.standards_capture }

      const { error: upErr } = await supabase.from("standards").update(updateRow).eq("id", existingId)

      if (upErr) {
        return { ok: false, message: upErr.message }
      }

      const { error: delErr } = await supabase
        .from("standard_steps")
        .delete()
        .eq("standard_id", existingId)

      if (delErr) {
        return { ok: false, message: delErr.message }
      }

      if (steps.length > 0) {
        const { error: insErr } = await supabase.from("standard_steps").insert(
          steps.map((s) => ({
            standard_id: existingId,
            ...s,
          }))
        )
        if (insErr) {
          return { ok: false, message: insErr.message }
        }
      }

      revalidatePath("/sops")
      revalidatePath(`/sops/${existingId}`)
      revalidatePath(`/sops/${existingId}/edit`)
      revalidatePath("/sops/capture")
      revalidatePath(`/sops/capture/${existingId}`)
      revalidatePath("/dashboard")
      return { ok: true, id: existingId }
    }

    const { data: created, error: cErr } = await supabase
      .from("standards")
      .insert({
        business_id: payload.businessId,
        title,
        description,
        category: payload.category,
        importance_level: importance,
        owner_dependency_level: dependency,
        estimated_time_minutes: est,
        status,
        created_by: user.id,
        standards_capture: payload.standards_capture ?? {},
      })
      .select("id")
      .single()

    if (cErr || !created) {
      return { ok: false, message: cErr?.message ?? "Could not create SOP." }
    }

    const id = created.id as string

    if (steps.length > 0) {
      const { error: insErr } = await supabase.from("standard_steps").insert(
        steps.map((s) => ({
          standard_id: id,
          ...s,
        }))
      )
      if (insErr) {
        return { ok: false, message: insErr.message }
      }
    }

    revalidatePath("/sops")
    revalidatePath(`/sops/${id}`)
    revalidatePath("/sops/capture")
    revalidatePath(`/sops/capture/${id}`)
    revalidatePath("/dashboard")
    return { ok: true, id }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Something went wrong."
    return { ok: false, message: msg }
  }
}

export async function archiveStandard(
  sopId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { ok: false, message: "You need to be signed in." }
    }

    const { error } = await supabase.from("standards").update({ status: "archived" }).eq("id", sopId)

    if (error) {
      return { ok: false, message: error.message }
    }

    revalidatePath("/sops")
    revalidatePath(`/sops/${sopId}`)
    revalidatePath(`/sops/${sopId}/edit`)
    revalidatePath("/sops/capture")
    revalidatePath("/dashboard")
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Something went wrong."
    return { ok: false, message: msg }
  }
}
