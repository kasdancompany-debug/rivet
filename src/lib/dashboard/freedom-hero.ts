import type { QuestionsPreventedMetrics } from "@/lib/ask-rivet/questions-prevented"
import type { DashboardViewModel } from "@/lib/dashboard/types"
import { formatAbsenceDays } from "@/lib/escape-readiness/absence-capacity"

export type DashboardFreedomHeroMetrics = {
  ownerFreeCapacityLabel: string
  escapeReadinessScore: number | null
  questionsPreventedThisMonth: number | null
  ownerHoursReturned: number | null
  teamReadinessPercent: number | null
  highestRisk: { label: string; href: string | null }
}

function resolveHighestOperationalRisk(model: DashboardViewModel): { label: string; href: string | null } {
  const top = model.biggestRisksThisWeek[0]
  if (top) {
    return { label: top.label, href: top.href }
  }

  const sopRisk = model.ownerRisks.find((r) => r.category === "sop_critical")
  if (sopRisk) {
    return { label: sopRisk.title, href: "/sops" }
  }

  const failure = model.escapeReadiness.absenceCapacity?.likelyFailurePoint
  if (failure) {
    return { label: failure, href: "/escape-plan" }
  }

  const factor = model.escapeReadiness.factors
    .filter((f) => f.percent != null)
    .sort((a, b) => (a.percent ?? 100) - (b.percent ?? 100))[0]
  if (factor) {
    return { label: factor.label, href: factor.detail?.fixCta?.href ?? "/escape-plan" }
  }

  return { label: "Nothing flagged yet", href: null }
}

export function buildFreedomHeroMetrics(
  model: DashboardViewModel,
  askMetrics: QuestionsPreventedMetrics | null
): DashboardFreedomHeroMetrics {
  const days = model.escapeReadiness.absenceCapacity?.estimatedDays
  const ownerFreeCapacityLabel =
    days != null ? formatAbsenceDays(days) : model.escapeReadiness.score == null ? "—" : "Estimating…"

  return {
    ownerFreeCapacityLabel,
    escapeReadinessScore: model.escapeReadiness.score,
    questionsPreventedThisMonth: askMetrics?.questionsPreventedThisMonth ?? null,
    ownerHoursReturned: askMetrics?.ownerHoursReturnedThisMonth ?? null,
    teamReadinessPercent: model.staffReadinessPercent,
    highestRisk: resolveHighestOperationalRisk(model),
  }
}
