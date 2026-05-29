import {
  fetchBusinessForCurrentUser,
  fetchCurrentProfile,
  fetchTrainingModuleDeep,
  listEmployeeModuleCertificationsForEmployeeIds,
} from "@/lib/db/queries"
import { createClient } from "@/lib/supabase/server"
import type { TypedSupabaseClient } from "@/types/database"
import { isWorkspaceOwner } from "@/lib/ops/workspace-role"
import { certificationDisplayName } from "@/lib/training/certifications/evaluate"
import { computeModuleQuizScorePct } from "@/lib/training/certifications/compute-quiz-score"
import { buildCertificationViews } from "@/lib/training/certifications/build-views"

export type TrainingCertificateView = {
  moduleId: string
  employeeId: string
  employeeName: string
  certificationName: string
  moduleTitle: string
  businessName: string
  scorePct: number | null
  certifiedAt: string
  managerName: string | null
  managerSignedOffAt: string | null
  canPrint: boolean
}

export async function loadTrainingCertificate(
  params: { employeeId: string; moduleId: string },
  options?: { viewerId?: string; client?: TypedSupabaseClient }
): Promise<TrainingCertificateView | null> {
  const supabase = options?.client ?? (await createClient())
  const viewerId = options?.viewerId

  const [business, employeeProfile, mod, certRows] = await Promise.all([
    fetchBusinessForCurrentUser(supabase),
    supabase.from("profiles").select("id, full_name").eq("id", params.employeeId).maybeSingle(),
    fetchTrainingModuleDeep(params.moduleId, supabase),
    listEmployeeModuleCertificationsForEmployeeIds([params.employeeId], supabase),
  ])

  if (!business || !mod) return null

  const certRow = certRows.find(
    (r) => r.employee_id === params.employeeId && r.training_module_id === params.moduleId
  )
  if (!certRow?.certified_at) return null

  if (viewerId) {
    const isSelf = viewerId === params.employeeId
    const viewerProfile = isSelf ? null : await fetchCurrentProfile(supabase)
    const owner = isWorkspaceOwner(viewerId, business, viewerProfile)
    if (!isSelf && !owner) return null
    if (certRow.business_id !== business.id) return null
  }

  const modulesById = new Map([[mod.id, mod]])
  const { certifications } = buildCertificationViews(params.employeeId, modulesById, certRows)
  const cert = certifications.find((c) => c.moduleId === params.moduleId)
  if (!cert?.certified || !cert.certifiedAt) return null

  const standardIds = [...new Set((mod.training_items ?? []).map((i) => i.standard_id))]
  const [{ data: standards }, { data: quizRows }, managerResult] = await Promise.all([
    standardIds.length > 0
      ? supabase.from("standards").select("id, quiz_questions").in("id", standardIds)
      : Promise.resolve({ data: [] }),
    supabase
      .from("employee_standard_quiz_completions")
      .select("standard_id, score, passed")
      .eq("employee_id", params.employeeId)
      .in("standard_id", standardIds.length > 0 ? standardIds : ["00000000-0000-0000-0000-000000000000"]),
    certRow.manager_signed_off_by
      ? supabase
          .from("profiles")
          .select("full_name")
          .eq("id", certRow.manager_signed_off_by)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const quizJson = new Map((standards ?? []).map((s) => [s.id, s.quiz_questions]))
  const scorePct = computeModuleQuizScorePct(mod, quizRows ?? [], quizJson)

  let canPrint = false
  if (viewerId) {
    const viewerProfile = viewerId === params.employeeId ? null : await fetchCurrentProfile(supabase)
    canPrint =
      viewerId === params.employeeId ||
      isWorkspaceOwner(viewerId, business, viewerProfile)
  }

  return {
    moduleId: params.moduleId,
    employeeId: params.employeeId,
    employeeName: employeeProfile.data?.full_name?.trim() || "Team member",
    certificationName: certificationDisplayName(mod.title),
    moduleTitle: mod.title,
    businessName: business.name,
    scorePct,
    certifiedAt: cert.certifiedAt,
    managerName: managerResult.data?.full_name?.trim() ?? null,
    managerSignedOffAt: certRow.manager_signed_off_at,
    canPrint,
  }
}
