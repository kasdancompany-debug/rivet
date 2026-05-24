import type { Tables } from "@/types/database"

import { parseStandardsCapture } from "@/lib/standards-capture/parse"
import type { StandardStepRollup } from "@/lib/dashboard/standards-depth"

const REVIEW_WINDOW_MS = 120 * 24 * 60 * 60 * 1000

export type SopPlayCompletion = {
  documentation: number
  training: number
  ownership: number
  overall: number
}

export type SopPlayCompletionContext = {
  stepRollupBySopId: Map<string, StandardStepRollup>
  mediaCountBySopId: Map<string, number>
  trainingItemsBySopId: Map<string, { id: string; moduleId: string }[]>
  assignedEmployeesByModuleId: Map<string, Set<string>>
  completionKeys: Set<string>
}

/** Documentation depth for one play: title, steps, written scope, evidence, freshness. */
export function computeSopDocumentationPercent(
  sop: Pick<Tables<"standards">, "title" | "description" | "status" | "updated_at" | "standards_capture">,
  rollup: StandardStepRollup,
  mediaCount: number
): number {
  const capture = parseStandardsCapture(sop.standards_capture)
  const now = Date.now()
  let pts = 0

  if (sop.title.trim().length > 0) pts += 20

  if (rollup.stepCount >= 2) pts += 20
  else if (rollup.stepCount >= 1) pts += 10

  const hasWrittenScope =
    (sop.description?.trim().length ?? 0) > 0 ||
    (capture?.qualityStandards?.length ?? 0) > 0 ||
    !!capture?.onboarding?.headOnly?.trim()
  if (hasWrittenScope) pts += 20

  const hasEvidence =
    rollup.hasStepMediaOrEvidence ||
    mediaCount > 0 ||
    (capture?.photoUrls?.length ?? 0) > 0 ||
    (capture?.acceptableExamples?.length ?? 0) > 0 ||
    (capture?.unacceptableExamples?.length ?? 0) > 0 ||
    !!capture?.videoUrl?.trim() ||
    !!capture?.walkthroughMediaId?.trim()
  if (hasEvidence) pts += 20

  if (sop.status === "active") {
    const touchedAt = new Date(sop.updated_at).getTime()
    if (!Number.isNaN(touchedAt) && now - touchedAt <= REVIEW_WINDOW_MS) pts += 20
    else pts += 10
  } else if (sop.status === "draft") {
    pts += 5
  }

  return Math.min(100, pts)
}

/** Named roles plus delegation off the owner. */
export function computeSopOwnershipPercent(
  sop: Pick<Tables<"standards">, "owner_dependency_level" | "standards_capture">
): number {
  const capture = parseStandardsCapture(sop.standards_capture)
  const roleCount = capture?.assignedRoles?.length ?? 0
  const roleScore = roleCount === 0 ? 0 : roleCount === 1 ? 50 : 100

  const dep = Math.min(5, Math.max(1, Math.round(sop.owner_dependency_level)))
  const delegationScore = Math.round(((6 - dep) / 5) * 100)

  return Math.round((roleScore + delegationScore) / 2)
}

export function computeSopTrainingPercent(
  sopId: string,
  ctx: Pick<
    SopPlayCompletionContext,
    "trainingItemsBySopId" | "assignedEmployeesByModuleId" | "completionKeys"
  >
): number {
  const items = ctx.trainingItemsBySopId.get(sopId) ?? []
  if (items.length === 0) return 0

  let expected = 0
  let done = 0

  for (const item of items) {
    const employees = ctx.assignedEmployeesByModuleId.get(item.moduleId)
    if (!employees || employees.size === 0) continue

    for (const employeeId of employees) {
      expected += 1
      if (ctx.completionKeys.has(`${employeeId}:${item.id}`)) done += 1
    }
  }

  if (expected === 0) return 0
  return Math.round((done / expected) * 100)
}

export function computeSopPlayCompletion(
  sop: Pick<
    Tables<"standards">,
    | "id"
    | "title"
    | "description"
    | "status"
    | "updated_at"
    | "standards_capture"
    | "owner_dependency_level"
  >,
  ctx: SopPlayCompletionContext
): SopPlayCompletion {
  const rollup = ctx.stepRollupBySopId.get(sop.id) ?? { stepCount: 0, hasStepMediaOrEvidence: false }
  const mediaCount = ctx.mediaCountBySopId.get(sop.id) ?? 0

  const documentation = computeSopDocumentationPercent(sop, rollup, mediaCount)
  const training = computeSopTrainingPercent(sop.id, ctx)
  const ownership = computeSopOwnershipPercent(sop)
  const overall = Math.round((documentation + training + ownership) / 3)

  return { documentation, training, ownership, overall }
}

export function buildSopPlayCompletionMap(
  sops: Pick<
    Tables<"standards">,
    | "id"
    | "title"
    | "description"
    | "status"
    | "updated_at"
    | "standards_capture"
    | "owner_dependency_level"
  >[],
  ctx: SopPlayCompletionContext
): Map<string, SopPlayCompletion> {
  const map = new Map<string, SopPlayCompletion>()
  for (const sop of sops) {
    map.set(sop.id, computeSopPlayCompletion(sop, ctx))
  }
  return map
}
