import { evaluateCertificationProgress, standardRequiresQuiz } from "@/lib/training/certifications/evaluate"
import { fetchTrainingModuleWithItems } from "@/lib/db/queries"
import type { TypedSupabaseClient } from "@/types/database"

export async function syncEmployeeModuleCertification(
  supabase: TypedSupabaseClient,
  params: { businessId: string; employeeId: string; moduleId: string },
  managerSignedOffBy?: string | null
): Promise<void> {
  const now = new Date().toISOString()

  const [{ data: progress }, trainingModule, { data: existing }] = await Promise.all([
    supabase
      .from("training_progress")
      .select("status, business_id")
      .eq("employee_id", params.employeeId)
      .eq("training_module_id", params.moduleId)
      .maybeSingle(),
    fetchTrainingModuleWithItems(params.moduleId, supabase),
    supabase
      .from("employee_module_certifications")
      .select("*")
      .eq("employee_id", params.employeeId)
      .eq("training_module_id", params.moduleId)
      .maybeSingle(),
  ])

  if (!progress || !trainingModule) return

  const requiredItems = (trainingModule.training_items ?? []).filter((i) => i.required !== false)
  const standardIds = [...new Set(requiredItems.map((i) => i.standard_id))]

  let quizRequiredStandardIds: string[] = []
  if (standardIds.length > 0) {
    const { data: standards } = await supabase
      .from("standards")
      .select("id, quiz_questions")
      .in("id", standardIds)

    quizRequiredStandardIds = (standards ?? [])
      .filter((s) => standardRequiresQuiz(s.quiz_questions))
      .map((s) => s.id)
  }

  const { data: quizRows } =
    quizRequiredStandardIds.length === 0
      ? { data: [] }
      : await supabase
          .from("employee_standard_quiz_completions")
          .select("standard_id, passed")
          .eq("employee_id", params.employeeId)
          .in("standard_id", quizRequiredStandardIds)

  const passedQuizStandardIds = new Set(
    (quizRows ?? []).filter((r) => r.passed).map((r) => r.standard_id)
  )

  const moduleCompleted = progress.status === "completed"
  const managerSignedOff = Boolean(existing?.manager_signed_off_at) || Boolean(managerSignedOffBy)

  const evaluation = evaluateCertificationProgress({
    moduleCompleted,
    quizRequiredStandardIds,
    passedQuizStandardIds,
    managerSignedOff,
  })

  const moduleCompletedAt =
    evaluation.moduleCompleted ? existing?.module_completed_at ?? now : null
  const quizzesPassedAt = evaluation.quizzesPassed ? existing?.quizzes_passed_at ?? now : null
  const managerSignedOffAt = managerSignedOff
    ? existing?.manager_signed_off_at ?? now
    : null
  const managerSignedOffById = managerSignedOff
    ? existing?.manager_signed_off_by ?? managerSignedOffBy ?? null
    : null
  const certifiedAt = evaluation.certified
    ? existing?.certified_at ??
      [moduleCompletedAt, quizzesPassedAt, managerSignedOffAt].filter(Boolean).sort().pop() ??
      now
    : null

  const row = {
    business_id: params.businessId,
    employee_id: params.employeeId,
    training_module_id: params.moduleId,
    module_completed_at: moduleCompletedAt,
    quizzes_passed_at: quizzesPassedAt,
    manager_signed_off_at: managerSignedOffAt,
    manager_signed_off_by: managerSignedOffById,
    certified_at: certifiedAt,
    updated_at: now,
  }

  if (existing?.id) {
    await supabase.from("employee_module_certifications").update(row).eq("id", existing.id)
  } else {
    await supabase.from("employee_module_certifications").insert(row)
  }
}
