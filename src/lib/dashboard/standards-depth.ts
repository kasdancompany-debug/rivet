import type { Tables } from "@/types/database"

import { parseStandardsCapture } from "@/lib/standards-capture/parse"

export type StandardStepRollup = {
  stepCount: number
  hasStepMediaOrEvidence: boolean
}

const REVIEW_WINDOW_MS = 120 * 24 * 60 * 60 * 1000

/**
 * Per active standard: average completeness 0–100 from five equal pillars:
 * title, steps, assigned roles (capture), media/evidence (steps + capture + standard_media), recently updated.
 */
export function computeStandardsDepthPercent(
  standards: Tables<"standards">[],
  stepRollupBySopId: Map<string, StandardStepRollup>,
  mediaCountBySopId: Map<string, number>
): number | null {
  const active = standards.filter((s) => s.status === "active")
  if (active.length === 0) return null

  const now = Date.now()
  let sum = 0

  for (const s of active) {
    const rollup = stepRollupBySopId.get(s.id) ?? { stepCount: 0, hasStepMediaOrEvidence: false }
    const capture = parseStandardsCapture(s.standards_capture)
    const mediaRows = mediaCountBySopId.get(s.id) ?? 0

    let pts = 0
    if (s.title.trim().length > 0) pts += 20
    if (rollup.stepCount >= 1) pts += 20
    if ((capture?.assignedRoles?.length ?? 0) > 0) pts += 20

    const hasEvidence =
      rollup.hasStepMediaOrEvidence ||
      mediaRows > 0 ||
      (capture?.photoUrls?.length ?? 0) > 0 ||
      (capture?.acceptableExamples?.length ?? 0) > 0 ||
      (capture?.unacceptableExamples?.length ?? 0) > 0 ||
      !!capture?.videoUrl?.trim()
    if (hasEvidence) pts += 20

    const touchedAt = new Date(s.updated_at).getTime()
    if (!Number.isNaN(touchedAt) && now - touchedAt <= REVIEW_WINDOW_MS) pts += 20

    sum += pts
  }

  return Math.round(sum / active.length)
}
