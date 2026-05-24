import type { StandardStepRollup } from "@/lib/dashboard/standards-depth"
import { formatSopCategory } from "@/lib/sops/categories"
import { computeSopDocumentationPercent } from "@/lib/sops/sop-play-completion"
import type { Tables } from "@/types/database"

export type BiggestRiskKind = "dependency" | "documentation" | "training" | "interruption"

export type BiggestRiskThisWeekItem = {
  rank: number
  label: string
  href: string
  kind: BiggestRiskKind
}

type RiskCandidate = {
  id: string
  label: string
  href: string
  kind: BiggestRiskKind
  weight: number
}

export type BiggestRisksThisWeekInput = {
  standards: Tables<"standards">[]
  stepRollupBySopId: Map<string, StandardStepRollup>
  mediaCountBySopId: Map<string, number>
  trainingProgressPercent: number | null
  trainingIncompleteCount: number
  totalTrainingAssignments: number
  canTrainOthersCount: number
  teamProfileCount: number
  ownerInterruptionsThisWeekCount: number
  ownerInterruptionsThisWeekMinutes: number
  trainingItemsBySopId: Map<string, number>
  modules: Pick<Tables<"training_modules">, "id" | "title">[]
  moduleCompletionPercent: Map<string, number>
}

function displayNameForSop(sop: Pick<Tables<"standards">, "title" | "category">): string {
  if (
    sop.category === "customer_experience" ||
    sop.category === "guest_experience" ||
    sop.category === "customer_service"
  ) {
    return "Guest recovery"
  }
  const categoryLabel = formatSopCategory(sop.category)
  if (sop.category === "opening" || sop.category === "closing") {
    return categoryLabel
  }
  const shortTitle = sop.title.trim()
  if (shortTitle.length > 0 && shortTitle.length <= 40) return shortTitle
  return categoryLabel
}

function addDependencyRisks(
  standards: Tables<"standards">[],
  candidates: RiskCandidate[]
): void {
  for (const sop of standards) {
    if (sop.status === "archived") continue
    if (sop.owner_dependency_level < 4) continue

    const name = displayNameForSop(sop)
    candidates.push({
      id: `dep:${sop.id}`,
      kind: "dependency",
      label: `${name} depends heavily on owner`,
      href: `/sops/${sop.id}`,
      weight: sop.owner_dependency_level * 22 + sop.importance_level * 6,
    })
  }
}

function addDocumentationRisks(
  standards: Tables<"standards">[],
  stepRollupBySopId: Map<string, StandardStepRollup>,
  mediaCountBySopId: Map<string, number>,
  candidates: RiskCandidate[]
): void {
  for (const sop of standards) {
    if (sop.status === "archived") continue

    const rollup = stepRollupBySopId.get(sop.id) ?? { stepCount: 0, hasStepMediaOrEvidence: false }
    const mediaCount = mediaCountBySopId.get(sop.id) ?? 0
    const documentation = computeSopDocumentationPercent(sop, rollup, mediaCount)
    const name = displayNameForSop(sop)

    if (sop.status === "draft") {
      candidates.push({
        id: `doc:draft:${sop.id}`,
        kind: "documentation",
        label: `${name} process incomplete`,
        href: `/sops/capture/${sop.id}`,
        weight: 88 - Math.min(documentation, 40),
      })
      continue
    }

    if (documentation >= 60 && rollup.stepCount >= 2) continue

    candidates.push({
      id: `doc:${sop.id}`,
      kind: "documentation",
      label: `${name} process incomplete`,
      href: `/sops/${sop.id}`,
      weight: 95 - documentation + (rollup.stepCount === 0 ? 25 : 0),
    })
  }
}

function addTrainingRisks(input: BiggestRisksThisWeekInput, candidates: RiskCandidate[]): void {
  const canTrainOthers = input.canTrainOthersCount

  if (input.teamProfileCount >= 2 && canTrainOthers === 0) {
    candidates.push({
      id: "train:no-backup",
      kind: "training",
      label: "No backup trainer exists",
      href: "/training",
      weight: 86,
    })
  }

  if (
    input.trainingProgressPercent != null &&
    input.trainingProgressPercent < 70 &&
    input.totalTrainingAssignments > 0
  ) {
    candidates.push({
      id: "train:completion-low",
      kind: "training",
      label: `Training completion still at ${input.trainingProgressPercent}%`,
      href: "/training",
      weight: 72 + (70 - input.trainingProgressPercent),
    })
  }

  for (const mod of input.modules) {
    const pct = input.moduleCompletionPercent.get(mod.id)
    if (pct == null || pct >= 60) continue
    candidates.push({
      id: `train:mod:${mod.id}`,
      kind: "training",
      label: `${mod.title} training still open`,
      href: `/training/modules/${mod.id}`,
      weight: 68 + (60 - pct) / 2,
    })
  }

  for (const [sopId, linkedCount] of input.trainingItemsBySopId) {
    if (linkedCount === 0) continue
    const sop = input.standards.find((s) => s.id === sopId)
    if (!sop || sop.status !== "active") continue
    if (input.trainingProgressPercent != null && input.trainingProgressPercent >= 75) continue

    const name = displayNameForSop(sop)
    candidates.push({
      id: `train:sop:${sopId}`,
      kind: "training",
      label: `${name} not fully signed off in training`,
      href: "/training",
      weight: 64 + sop.importance_level * 4,
    })
  }
}

function addInterruptionRisks(input: BiggestRisksThisWeekInput, candidates: RiskCandidate[]): void {
  const { ownerInterruptionsThisWeekCount: count, ownerInterruptionsThisWeekMinutes: minutes } = input
  if (count === 0) return

  const weight = count * 14 + Math.round(minutes / 8)
  candidates.push({
    id: "interrupt:week",
    kind: "interruption",
    label:
      count === 1
        ? "Owner pulled into the floor once this week"
        : `Still routes back to you (${count} this week)`,
    href: "/interruptions",
    weight: Math.min(100, weight),
  })
}

/** Ranked top 3 operational risks for the dashboard card. */
export function buildBiggestRisksThisWeek(input: BiggestRisksThisWeekInput): BiggestRiskThisWeekItem[] {
  const candidates: RiskCandidate[] = []

  const liveStandards = input.standards.filter((s) => s.status !== "archived")

  if (liveStandards.length === 0) {
    return [
      {
        rank: 1,
        label: "No procedures on record yet",
        href: "/sops/capture",
        kind: "documentation",
      },
      {
        rank: 2,
        label: "Training paths not established",
        href: "/training",
        kind: "training",
      },
      {
        rank: 3,
        label: "Log what routes back to you to see patterns",
        href: "/interruptions",
        kind: "interruption",
      },
    ]
  }

  addDependencyRisks(liveStandards, candidates)
  addDocumentationRisks(liveStandards, input.stepRollupBySopId, input.mediaCountBySopId, candidates)
  addTrainingRisks(input, candidates)
  addInterruptionRisks(input, candidates)

  const seen = new Set<string>()
  const ranked = candidates
    .sort((a, b) => b.weight - a.weight)
    .filter((c) => {
      const key = c.label.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, 3)

  if (ranked.length === 0) {
    return [
      {
        rank: 1,
        label: "No major risks flagged this week",
        href: "/sops",
        kind: "documentation",
      },
    ]
  }

  return ranked.map((item, index) => ({
    rank: index + 1,
    label: item.label,
    href: item.href,
    kind: item.kind,
  }))
}
