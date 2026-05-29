"use server"

import { randomBytes } from "crypto"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import {
  fetchBusinessForCurrentUser,
  fetchCurrentProfile,
  fetchSopsWithStepsForIds,
  fetchTrainingModuleDeep,
  fetchTrainingModuleWithItems,
  listEmployeeTrainingProgress,
  listTrainingSopCompletionsForEmployeeIds,
  listTrainingSopProgressForEmployee,
  syncEmployeeTrainingModuleProgress,
} from "@/lib/db/queries"
import {
  canManageEmployeeTraining,
  requireWorkspacePermission,
} from "@/lib/ops/workspace-auth"
import { buildPortalModuleView } from "@/lib/training/portal/build-portal-module"
import { canCompletePortalItem } from "@/lib/training/portal/completion-rules"
import {
  loadPortalStepProofState,
  mergeStepProofUpdate,
  stepProofRecordsToDbPayload,
} from "@/lib/training/portal/persist-step-proofs"
import { gradeStandardQuiz } from "@/lib/sops/generate-standard-quiz"
import { syncEmployeeModuleCertification } from "@/lib/training/certifications/sync"
import { trainingPortalInviteUrl } from "@/lib/training/portal/invite-links"
import { createClient } from "@/lib/supabase/server"
import type { TablesUpdate, TrainingInviteChannel, TypedSupabaseClient } from "@/types/database"

function revalidatePortal(moduleId?: string) {
  revalidatePath("/learn")
  revalidatePath("/training")
  if (moduleId) revalidatePath(`/learn/${moduleId}`)
}

async function requireSignedIn(supabase: TypedSupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, message: "You need to be signed in." }
  return { ok: true as const, user }
}

async function requireTrainingManagement(supabase: TypedSupabaseClient) {
  const gate = await requireWorkspacePermission(supabase, "manage_team_training")
  if (!gate.ok) return gate
  return { ok: true as const, user: gate.user, business: gate.business }
}

async function requireAssignedEmployee(
  supabase: TypedSupabaseClient,
  moduleId: string,
  employeeId: string
) {
  const auth = await requireSignedIn(supabase)
  if (!auth.ok) return auth
  if (auth.user.id !== employeeId) {
    const allowed = await canManageEmployeeTraining(supabase, employeeId)
    if (!allowed) {
      return { ok: false as const, message: "You can only update your own training." }
    }
  }

  const { data: assignment } = await supabase
    .from("training_progress")
    .select("id, business_id")
    .eq("employee_id", employeeId)
    .eq("training_module_id", moduleId)
    .maybeSingle()

  if (!assignment) {
    return { ok: false as const, message: "This module is not assigned to you." }
  }

  return { ok: true as const, user: auth.user, businessId: assignment.business_id as string }
}

async function upsertSopProgress(
  supabase: TypedSupabaseClient,
  patch: {
    businessId: string
    employeeId: string
    trainingItemId: string
    update: TablesUpdate<"training_sop_progress">
  }
) {
  const { data: existing } = await supabase
    .from("training_sop_progress")
    .select("id")
    .eq("employee_id", patch.employeeId)
    .eq("training_item_id", patch.trainingItemId)
    .maybeSingle()

  const payload = {
    ...patch.update,
    updated_at: new Date().toISOString(),
  }

  if (existing?.id) {
    const { error } = await supabase
      .from("training_sop_progress")
      .update(payload)
      .eq("id", existing.id)
    if (error) return { ok: false as const, message: error.message }
    return { ok: true as const }
  }

  const { error } = await supabase.from("training_sop_progress").insert({
    business_id: patch.businessId,
    employee_id: patch.employeeId,
    training_item_id: patch.trainingItemId,
    ...payload,
  })
  if (error) return { ok: false as const, message: error.message }
  return { ok: true as const }
}

export async function createTrainingPortalInvite(payload: {
  businessId: string
  moduleId: string
  employeeId?: string | null
  recipientEmail?: string | null
  recipientPhone?: string | null
  channel: TrainingInviteChannel
}): Promise<
  | { ok: true; token: string; url: string }
  | { ok: false; message: string }
> {
  try {
    const supabase = await createClient()
    const gate = await requireTrainingManagement(supabase)
    if (!gate.ok) return gate

    const mod = await fetchTrainingModuleWithItems(payload.moduleId, supabase)
    if (!mod || mod.business_id !== payload.businessId) {
      return { ok: false, message: "Module not found." }
    }

    const token = randomBytes(24).toString("hex")
    const { error } = await supabase.from("training_portal_invites").insert({
      business_id: payload.businessId,
      training_module_id: payload.moduleId,
      employee_id: payload.employeeId ?? null,
      token,
      recipient_email: payload.recipientEmail?.trim() || null,
      recipient_phone: payload.recipientPhone?.trim() || null,
      channel: payload.channel,
      created_by: gate.user.id,
    })

    if (error) return { ok: false, message: error.message }

    const url = trainingPortalInviteUrl(token)
    revalidatePath(`/training/modules/${payload.moduleId}`)
    return { ok: true, token, url }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}

export async function acceptTrainingPortalInvite(token: string): Promise<void> {
  const supabase = await createClient()
  const auth = await requireSignedIn(supabase)
  if (!auth.ok) {
    redirect(`/login?next=${encodeURIComponent(`/learn/join/${token}`)}`)
  }

  const { data, error } = await supabase.rpc("resolve_training_invite", { p_token: token })
  if (error || !data || typeof data !== "object") {
    redirect("/learn?error=invite")
  }

  const invite = data as Record<string, unknown>
  if (invite.valid !== true || typeof invite.moduleId !== "string" || typeof invite.businessId !== "string") {
    redirect("/learn?error=invite")
  }

  const moduleId = invite.moduleId
  const businessId = invite.businessId
  const employeeId =
    typeof invite.employeeId === "string" && invite.employeeId.length > 0
      ? invite.employeeId
      : auth.user.id

  if (employeeId !== auth.user.id) {
    redirect("/learn?error=wrong-account")
  }

  const profile = await fetchCurrentProfile(supabase)
  if (profile && !profile.business_id) {
    await supabase.from("profiles").update({ business_id: businessId }).eq("id", auth.user.id)
  }

  const { data: existing } = await supabase
    .from("training_progress")
    .select("id")
    .eq("employee_id", auth.user.id)
    .eq("training_module_id", moduleId)
    .maybeSingle()

  if (!existing) {
    await supabase.from("training_progress").insert({
      business_id: businessId,
      employee_id: auth.user.id,
      training_module_id: moduleId,
      status: "not_started",
    })
  }

  redirect(`/learn/${moduleId}`)
}

export async function savePortalStepChecklist(payload: {
  moduleId: string
  trainingItemId: string
  stepIds: string[]
}): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const supabase = await createClient()
    const auth = await requireSignedIn(supabase)
    if (!auth.ok) return auth

    const gate = await requireAssignedEmployee(supabase, payload.moduleId, auth.user.id)
    if (!gate.ok) return gate

    const res = await upsertSopProgress(supabase, {
      businessId: gate.businessId,
      employeeId: auth.user.id,
      trainingItemId: payload.trainingItemId,
      update: { step_checklist: payload.stepIds },
    })
    if (!res.ok) return res

    await supabase
      .from("training_progress")
      .update({ status: "in_progress", updated_at: new Date().toISOString() })
      .eq("employee_id", auth.user.id)
      .eq("training_module_id", payload.moduleId)
      .neq("status", "completed")

    revalidatePortal(payload.moduleId)
    return { ok: true }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}

export async function markPortalVideoWatched(payload: {
  moduleId: string
  trainingItemId: string
}): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const supabase = await createClient()
    const auth = await requireSignedIn(supabase)
    if (!auth.ok) return auth

    const gate = await requireAssignedEmployee(supabase, payload.moduleId, auth.user.id)
    if (!gate.ok) return gate

    const res = await upsertSopProgress(supabase, {
      businessId: gate.businessId,
      employeeId: auth.user.id,
      trainingItemId: payload.trainingItemId,
      update: { video_watched_at: new Date().toISOString() },
    })
    if (!res.ok) return res

    revalidatePortal(payload.moduleId)
    return { ok: true }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}

export async function submitPortalQuiz(payload: {
  moduleId: string
  trainingItemId: string
  standardId: string
  answers: Record<string, number>
  questions: { id: string; correctIndex: number }[]
}): Promise<{ ok: true; passed: boolean; score: number } | { ok: false; message: string }> {
  try {
    const supabase = await createClient()
    const auth = await requireSignedIn(supabase)
    if (!auth.ok) return auth

    const gate = await requireAssignedEmployee(supabase, payload.moduleId, auth.user.id)
    if (!gate.ok) return gate

    const { passed, score } = gradeStandardQuiz(
      {
        version: 1,
        generatedAt: new Date().toISOString(),
        questions: payload.questions.map((q) => ({
          id: q.id,
          type: "multiple_choice" as const,
          prompt: "",
          options: [],
          correctIndex: q.correctIndex,
        })),
      },
      payload.answers
    )

    const res = await upsertSopProgress(supabase, {
      businessId: gate.businessId,
      employeeId: auth.user.id,
      trainingItemId: payload.trainingItemId,
      update: {
        quiz_answers: payload.answers,
        quiz_passed: passed,
      },
    })
    if (!res.ok) return res

    const { error: quizErr } = await supabase.from("employee_standard_quiz_completions").upsert(
      {
        business_id: gate.businessId,
        employee_id: auth.user.id,
        standard_id: payload.standardId,
        score,
        passed,
        answers: payload.answers,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "employee_id,standard_id" }
    )
    if (quizErr) return { ok: false, message: quizErr.message }

    await syncEmployeeModuleCertification(supabase, {
      businessId: gate.businessId,
      employeeId: auth.user.id,
      moduleId: payload.moduleId,
    })

    revalidatePortal(payload.moduleId)
    return { ok: true, passed, score }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}

export async function savePortalStepPhoto(payload: {
  moduleId: string
  trainingItemId: string
  stepId: string
  mediaId: string
  signedUrl?: string | null
}): Promise<{ ok: true } | { ok: false; message: string }> {
  return savePortalStepMediaProof({ ...payload, kind: "photo" })
}

export async function savePortalStepVideo(payload: {
  moduleId: string
  trainingItemId: string
  stepId: string
  mediaId: string
  signedUrl?: string | null
}): Promise<{ ok: true } | { ok: false; message: string }> {
  return savePortalStepMediaProof({ ...payload, kind: "video" })
}

async function savePortalStepMediaProof(payload: {
  moduleId: string
  trainingItemId: string
  stepId: string
  mediaId: string
  signedUrl?: string | null
  kind: "photo" | "video"
}): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const supabase = await createClient()
    const auth = await requireSignedIn(supabase)
    if (!auth.ok) return auth

    const gate = await requireAssignedEmployee(supabase, payload.moduleId, auth.user.id)
    if (!gate.ok) return gate

    const loaded = await loadPortalStepProofState(supabase, {
      employeeId: auth.user.id,
      trainingItemId: payload.trainingItemId,
    })

    const media = { mediaId: payload.mediaId, signedUrl: payload.signedUrl ?? null }
    const next = mergeStepProofUpdate(loaded.stepProofByStepId, payload.stepId, {
      photo: payload.kind === "photo" ? media : loaded.stepProofByStepId[payload.stepId]?.photo ?? null,
      video: payload.kind === "video" ? media : loaded.stepProofByStepId[payload.stepId]?.video ?? null,
    })

    const proofPayload = stepProofRecordsToDbPayload(next)
    const res = await upsertSopProgress(supabase, {
      businessId: gate.businessId,
      employeeId: auth.user.id,
      trainingItemId: payload.trainingItemId,
      update: proofPayload,
    })
    if (!res.ok) return res

    await syncEmployeeModuleCertification(supabase, {
      businessId: gate.businessId,
      employeeId: auth.user.id,
      moduleId: payload.moduleId,
    })

    revalidatePortal(payload.moduleId)
    return { ok: true }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}

export async function managerSignoffPortalStep(payload: {
  moduleId: string
  trainingItemId: string
  stepId: string
  employeeId: string
  managerName?: string | null
}): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const supabase = await createClient()
    const owner = await requireWorkspacePermission(supabase, "sign_off_training")
    if (!owner.ok) return owner

    const { data: assignment } = await supabase
      .from("training_progress")
      .select("id")
      .eq("employee_id", payload.employeeId)
      .eq("training_module_id", payload.moduleId)
      .eq("business_id", owner.business.id)
      .maybeSingle()

    if (!assignment) {
      return { ok: false, message: "That employee is not assigned to this module." }
    }

    const loaded = await loadPortalStepProofState(supabase, {
      employeeId: payload.employeeId,
      trainingItemId: payload.trainingItemId,
    })

    const now = new Date().toISOString()
    const next = mergeStepProofUpdate(loaded.stepProofByStepId, payload.stepId, {
      managerSignoff: {
        signedOffBy: owner.user.id,
        signedOffAt: now,
        signedOffName: payload.managerName?.trim() || null,
      },
    })

    const res = await upsertSopProgress(supabase, {
      businessId: owner.business.id,
      employeeId: payload.employeeId,
      trainingItemId: payload.trainingItemId,
      update: stepProofRecordsToDbPayload(next),
    })
    if (!res.ok) return res

    await syncEmployeeModuleCertification(supabase, {
      businessId: owner.business.id,
      employeeId: payload.employeeId,
      moduleId: payload.moduleId,
    })

    revalidatePortal(payload.moduleId)
    revalidatePath("/training")
    return { ok: true }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}

export async function completePortalTrainingItem(payload: {
  moduleId: string
  trainingItemId: string
}): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const supabase = await createClient()
    const auth = await requireSignedIn(supabase)
    if (!auth.ok) return auth

    const gate = await requireAssignedEmployee(supabase, payload.moduleId, auth.user.id)
    if (!gate.ok) return gate

    const mod = await fetchTrainingModuleDeep(payload.moduleId, supabase)
    if (!mod) return { ok: false, message: "Module not found." }

    const sopIds = (mod.training_items ?? []).map((i) => i.standard_id)
    const sops = await fetchSopsWithStepsForIds(sopIds, supabase)
    const sopsById = new Map(sops.map((s) => [s.id, s]))
    const [completions, progressRows, assignment] = await Promise.all([
      listTrainingSopCompletionsForEmployeeIds([auth.user.id], supabase),
      listTrainingSopProgressForEmployee(auth.user.id, supabase),
      listEmployeeTrainingProgress({ employeeId: auth.user.id, moduleId: payload.moduleId }, supabase),
    ])
    const completionIds = new Set(completions.map((c) => c.training_item_id))
    const business = await fetchBusinessForCurrentUser(supabase)
    const view = await buildPortalModuleView({
      module: mod,
      businessName: business?.name ?? "",
      assignment: assignment[0] ?? null,
      sopsById,
      progressRows,
      completionIds,
      activeItemId: payload.trainingItemId,
    })
    const item = view.items.find((i) => i.trainingItemId === payload.trainingItemId)
    if (!item) return { ok: false, message: "Training item not found." }
    if (!canCompletePortalItem(item)) {
      return { ok: false, message: "Finish the video, checklist, quiz, and required photos first." }
    }

    const { error } = await supabase.from("employee_training_sop_completions").insert({
      employee_id: auth.user.id,
      training_item_id: payload.trainingItemId,
    })
    if (error && error.code !== "23505") {
      return { ok: false, message: error.message }
    }

    await syncEmployeeTrainingModuleProgress(payload.moduleId, auth.user.id, supabase)
    revalidatePortal(payload.moduleId)
    return { ok: true }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." }
  }
}
