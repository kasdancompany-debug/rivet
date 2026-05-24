import type { Tables } from "@/types/database"

import type { SopPlayCompletion } from "@/lib/sops/sop-play-completion"

export type DependencyRiskBand = "low" | "medium" | "high"

export type SopDependencyRisk = {
  score: number
  band: DependencyRiskBand
  bandLabel: "Low" | "Medium" | "High"
  causes: string[]
}

export function dependencyRiskScoreFromLevel(ownerDependencyLevel: number): number {
  const level = Math.min(5, Math.max(1, Math.round(ownerDependencyLevel)))
  return level * 20
}

export function dependencyRiskBand(score: number): {
  band: DependencyRiskBand
  bandLabel: "Low" | "Medium" | "High"
} {
  if (score <= 40) return { band: "low", bandLabel: "Low" }
  if (score <= 69) return { band: "medium", bandLabel: "Medium" }
  return { band: "high", bandLabel: "High" }
}

export function dependencyRiskBandStyles(band: DependencyRiskBand): {
  badge: string
  score: string
  dot: string
} {
  switch (band) {
    case "low":
      return {
        badge: "border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-900 dark:text-emerald-300/95",
        score: "text-emerald-800 dark:text-emerald-300/95",
        dot: "bg-emerald-600/70",
      }
    case "medium":
      return {
        badge: "border-amber-500/30 bg-amber-500/[0.08] text-amber-950 dark:text-amber-300/95",
        score: "text-amber-900 dark:text-amber-200/95",
        dot: "bg-amber-500/80",
      }
    case "high":
      return {
        badge: "border-rose-500/30 bg-rose-500/[0.08] text-rose-950 dark:text-rose-300/95",
        score: "text-rose-900 dark:text-rose-300/95",
        dot: "bg-rose-600/80",
      }
  }
}

type CauseCandidate = { text: string; weight: number }

function bookendCause(category: string, dependencyLevel: number): CauseCandidate | null {
  if (dependencyLevel < 3) return null
  if (category === "opening") {
    return { text: "Only one trained opener for this routine", weight: 88 }
  }
  if (category === "closing") {
    return { text: "Only one trained closer", weight: 88 }
  }
  return null
}

function buildCauseCandidates(
  sop: Pick<
    Tables<"standards">,
    "category" | "status" | "importance_level" | "owner_dependency_level" | "estimated_time_minutes"
  >,
  stepCount?: number,
  playCompletion?: Pick<SopPlayCompletion, "documentation" | "training" | "ownership" | "overall">
): CauseCandidate[] {
  const causes: CauseCandidate[] = []
  const dep = sop.owner_dependency_level

  if (dep >= 4) {
    causes.push({ text: "Owner approves exceptions on this procedure", weight: 92 })
  }
  if (dep >= 5) {
    causes.push({ text: "No alternate owner assigned for sign-off", weight: 86 })
  }

  const bookend = bookendCause(sop.category, dep)
  if (bookend) causes.push(bookend)

  if (sop.status === "draft") {
    causes.push({ text: "Missing training completion—still draft on the floor", weight: 84 })
  } else if (sop.status !== "active") {
    causes.push({ text: "Not active—team is not running this version", weight: 72 })
  }

  if (stepCount !== undefined && stepCount < 2) {
    causes.push({ text: "Procedure is thin—judgment fills the gaps", weight: 78 })
  }

  if (sop.importance_level >= 4 && dep >= 3) {
    causes.push({ text: "Critical path still waits on owner judgment", weight: 74 })
  }

  if (
    sop.estimated_time_minutes != null &&
    sop.estimated_time_minutes >= 40 &&
    dep >= 3
  ) {
    causes.push({ text: "Long run-time ties to one experienced operator", weight: 62 })
  }

  if (sop.category === "training" && dep >= 3) {
    causes.push({ text: "Training sign-off not delegated off the owner", weight: 68 })
  }

  if (sop.category === "customer_service" && dep >= 3) {
    causes.push({ text: "Recovery decisions escalate instead of following a script", weight: 66 })
  }

  if (dep <= 2 && sop.status === "active") {
    causes.push({ text: "Team can execute with light owner check-ins", weight: 45 })
  }

  if (playCompletion) {
    if (playCompletion.documentation < 60) {
      causes.push({ text: "Documentation gaps—steps, evidence, or scope still thin", weight: 80 })
    }
    if (playCompletion.training < 50) {
      causes.push({ text: "Training linkage incomplete or sign-offs lagging", weight: 79 })
    }
    if (playCompletion.ownership < 60) {
      causes.push({ text: "Named ownership not fully assigned off the owner", weight: 77 })
    }
    if (playCompletion.overall < 50) {
      causes.push({ text: "Play completion is low—floor still depends on memory", weight: 75 })
    }
  }

  if (causes.length < 2) {
    if (dep >= 3) {
      causes.push({ text: "Judgment calls on this SOP still route to you", weight: 50 })
    } else {
      causes.push({ text: "Repeatable steps with limited owner touchpoints", weight: 42 })
    }
  }

  if (causes.length < 2) {
    causes.push({ text: "Review training linkage should this role turn over", weight: 38 })
  }

  const seen = new Set<string>()
  return causes
    .sort((a, b) => b.weight - a.weight)
    .filter((c) => {
      if (seen.has(c.text)) return false
      seen.add(c.text)
      return true
    })
}

export function computeSopDependencyRisk(
  sop: Pick<
    Tables<"standards">,
    "category" | "status" | "importance_level" | "owner_dependency_level" | "estimated_time_minutes"
  >,
  stepCount?: number,
  playCompletion?: Pick<SopPlayCompletion, "documentation" | "training" | "ownership" | "overall">
): SopDependencyRisk {
  let score = dependencyRiskScoreFromLevel(sop.owner_dependency_level)

  if (sop.status === "draft") score = Math.min(100, score + 8)
  if (stepCount !== undefined && stepCount < 2) score = Math.min(100, score + 6)

  if (playCompletion) {
    if (playCompletion.overall < 50) score = Math.min(100, score + 10)
    else if (playCompletion.overall < 75) score = Math.min(100, score + 5)

    if (playCompletion.training < 40) score = Math.min(100, score + 6)
    if (playCompletion.ownership < 50) score = Math.min(100, score + 5)
    if (playCompletion.documentation < 50) score = Math.min(100, score + 4)
  }

  const { band, bandLabel } = dependencyRiskBand(score)
  const causeCandidates = buildCauseCandidates(sop, stepCount, playCompletion)
  const causes = causeCandidates.slice(0, 4).map((c) => c.text)

  return { score, band, bandLabel, causes }
}
