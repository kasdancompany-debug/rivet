import type {
  EscapeAbsenceSimulation,
  EscapeAbsenceSimulationContext,
  EscapeAbsenceSimulationDay,
  EscapeAbsenceSimulationEvent,
  EscapeAbsenceSimulationEventSource,
  EscapeReadinessFactor,
  EscapeReadinessFactorId,
  EscapeReadinessView,
} from "@/lib/escape-readiness/types"
import { buildAbsenceSimulationFixes } from "@/lib/escape-readiness/build-absence-simulation-fixes"
import { buildSimulationContextFromView } from "@/lib/escape-readiness/build-simulation-context"

const DAY_PHASES = ["Morning open", "Mid-shift", "Afternoon", "Close"] as const

const FACTOR_ORDER: EscapeReadinessFactorId[] = [
  "sop_coverage",
  "training_coverage",
  "unresolved_issues",
  "owner_interruptions",
  "undocumented_procedures",
]

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}

function factorHealth(factors: EscapeReadinessFactor[], id: EscapeReadinessFactorId): number {
  return factors.find((f) => f.id === id)?.percent ?? 50
}

function sortedWeakestFactors(factors: EscapeReadinessFactor[]): EscapeReadinessFactorId[] {
  return [...factors]
    .filter((f) => f.percent != null)
    .sort((a, b) => (a.percent as number) - (b.percent as number))
    .map((f) => f.id)
}

function simulationDays(capacityDays: number): number {
  return clamp(Math.ceil(capacityDays) + 2, 4, 14)
}

function dailyInterruptLoad(day: number, weeklyCount: number, capacityDays: number): number {
  const dailyBase = weeklyCount / 7
  const ramp = 1 + (day / Math.max(capacityDays, 1)) * 1.6
  return Math.max(1, Math.round(dailyBase * ramp * 2.2))
}

function dayStress(day: number, capacityDays: number, score: number | null): number {
  const progress = day / Math.max(capacityDays, 0.5)
  const base = progress * progress * 78
  const scoreDrag = score == null ? 18 : (100 - score) * 0.18
  return clamp(Math.round(base + scoreDrag), 0, 100)
}

function dayStatus(
  stress: number,
  isBreakdown: boolean
): EscapeAbsenceSimulationDay["status"] {
  if (isBreakdown || stress >= 78) return "breakdown"
  if (stress >= 52) return "strained"
  return "stable"
}

function event(
  source: EscapeAbsenceSimulationEventSource,
  phase: string,
  title: string,
  detail: string
): EscapeAbsenceSimulationEvent {
  return { source, phase, title, detail }
}

function sopEvents(
  ctx: EscapeAbsenceSimulationContext,
  health: number,
  day: number
): EscapeAbsenceSimulationEvent[] {
  const thinTitle = ctx.thinSopTitles[0] ?? "Opening procedure"
  if (day === 1) {
    return [
      event(
        "sops",
        "Morning open",
        `${thinTitle} runs from memory`,
        health < 55
          ? "No written opener on file—staff improvise the first hour."
          : "Play exists but depth is thin—backup steps are not obvious."
      ),
    ]
  }
  if (day >= 3 && health < 60) {
    return [
      event(
        "sops",
        "Mid-shift",
        "Undocumented exception mid-rush",
        ctx.thinSopTitles[1]
          ? `${ctx.thinSopTitles[1]} has no runnable steps on the floor.`
          : "Play gap surfaces when volume spikes."
      ),
    ]
  }
  return []
}

function trainingEvents(
  ctx: EscapeAbsenceSimulationContext,
  health: number,
  day: number
): EscapeAbsenceSimulationEvent[] {
  if (day !== 2 && day !== 4) return []
  const incomplete = ctx.staffWithIncompleteTraining
  return [
    event(
      "training",
      day === 2 ? "Afternoon" : "Mid-shift",
      "Judgment call without completed module",
      incomplete > 0
        ? `${incomplete} staff still missing assigned modules—decision defaults to manager hunt.`
        : "Training coverage looks thin—staff ask how it is really done."
    ),
  ]
}

function issueEvents(
  ctx: EscapeAbsenceSimulationContext,
  health: number,
  day: number
): EscapeAbsenceSimulationEvent[] {
  if (day < 2 || ctx.openIssueCount === 0) return []
  const title = ctx.openIssueTitles[0] ?? "Open issue"
  return [
    event(
      "issues",
      day === 2 ? "Morning open" : "Afternoon",
      "Open issue resurfaces",
      health < 50
        ? `${title} has no owner while you are out—${ctx.openIssueCount} item(s) still open.`
        : `${title} was logged but never closed—staff escalate when it repeats.`
    ),
  ]
}

function interruptEvents(
  ctx: EscapeAbsenceSimulationContext,
  health: number,
  day: number,
  capacityDays: number
): EscapeAbsenceSimulationEvent[] {
  const count = dailyInterruptLoad(day, ctx.weeklyInterruptCount, capacityDays)
  const sample = ctx.interruptSummaries[0] ?? "Owner judgment call"
  return [
    event(
      "interruptions",
      day === 1 ? "Mid-shift" : "Afternoon",
      `${count} pulls route to you`,
      health < 45
        ? `${sample} and similar questions stack—phone would buzz every hour.`
        : `${count} texts or walk-ups would still reach you today at this volume.`
    ),
  ]
}

function staffingEvents(
  ctx: EscapeAbsenceSimulationContext,
  day: number
): EscapeAbsenceSimulationEvent[] {
  if (ctx.teamSize > 10 || day < 3) return []
  return [
    event(
      "staffing",
      "Close",
      "Thin bench at close",
      ctx.teamSize <= 6
        ? "Only one shift lead scheduled—no backup if someone calls out."
        : "Coverage is light—cross-trained backup is not on the schedule."
    ),
  ]
}

function askRivetEvents(
  ctx: EscapeAbsenceSimulationContext,
  day: number
): EscapeAbsenceSimulationEvent[] {
  if (ctx.unverifiedAskCount === 0) return []
  const sample = ctx.unverifiedAskQuestions[0] ?? "Floor question with no verified answer"
  if (day === 1) {
    return [
      event(
        "ask_rivet",
        "Mid-shift",
        "Ask Rivet has no verified answer",
        `${ctx.unverifiedAskCount} recurring question(s) still lack a play-backed answer—staff may hunt you down.`
      ),
    ]
  }
  if (day >= 3) {
    return [
      event(
        "ask_rivet",
        "Afternoon",
        "Unanswered question resurfaces",
        `"${sample}" was asked before without a verified answer—same pull routes to you.`
      ),
    ]
  }
  return []
}

function teamReadinessEvents(
  ctx: EscapeAbsenceSimulationContext,
  day: number
): EscapeAbsenceSimulationEvent[] {
  const readiness = ctx.teamReadinessPercent
  if (readiness == null || readiness >= 75 || day < 2) return []
  return [
    event(
      "team_readiness",
      day === 2 ? "Morning open" : "Close",
      "Team readiness gap on the floor",
      readiness < 55
        ? `Team readiness is ${readiness}%—not enough cross-trained coverage to absorb surprises.`
        : `Team readiness at ${readiness}%—backup roles are thin when you are not on site.`
    ),
  ]
}

function closingProcessLabel(
  ctx: EscapeAbsenceSimulationContext,
  view: EscapeReadinessView
): string {
  const closingSop = ctx.thinSopTitles.find((title) => /clos/i.test(title))
  if (closingSop) {
    return /process|risk|procedure|play/i.test(closingSop)
      ? closingSop.toLowerCase()
      : `${closingSop.toLowerCase()} process risk`
  }
  const failure = view.absenceCapacity?.likelyFailurePoint
  if (failure && /clos/i.test(failure)) return "closing process risk"
  return "closing process risk"
}

function dayHeadline(
  day: number,
  status: EscapeAbsenceSimulationDay["status"],
  view: EscapeReadinessView,
  ctx: EscapeAbsenceSimulationContext,
  failureDay: number
): string {
  if (day >= Math.max(4, Math.ceil(failureDay)) || status === "breakdown") {
    return "Owner likely contacted"
  }
  if (day === 1) {
    return status === "stable" ? "Likely stable" : "Early strain"
  }
  if (day === 2) {
    const trainingHealth = factorHealth(view.factors, "training_coverage")
    if (trainingHealth < 70 || ctx.staffWithIncompleteTraining > 0) {
      return "Minor training gaps"
    }
    return status === "strained" ? "Minor gaps surfacing" : "Likely stable"
  }
  if (day === 3) {
    return closingProcessLabel(ctx, view)
  }
  if (day === 4) {
    return status === "stable" ? "Holding with questions" : "Owner likely contacted"
  }
  if (status === "stable") return "Likely stable"
  if (status === "strained") return "Strain building"
  return "Owner likely contacted"
}

function breakdownForFactor(
  factorId: EscapeReadinessFactorId,
  ctx: EscapeAbsenceSimulationContext,
  day: number
): { title: string; detail: string; source: EscapeAbsenceSimulationEventSource } {
  switch (factorId) {
    case "sop_coverage":
      return {
        source: "sops",
        title: "Opening breaks without written steps",
        detail: `${ctx.thinSopTitles[0] ?? "Core procedure"} is not runnable without you on the floor.`,
      }
    case "training_coverage":
      return {
        source: "training",
        title: "Training gap becomes customer-visible",
        detail: "Staff pause on a trained task and escalate because modules are incomplete.",
      }
    case "unresolved_issues":
      return {
        source: "issues",
        title: "Open issues stack with no owner",
        detail: `${ctx.openIssueCount} unresolved item(s) default to your inbox by day ${day}.`,
      }
    case "owner_interruptions":
      return {
        source: "interruptions",
        title: "Interrupt volume spikes",
        detail: `${dailyInterruptLoad(day, ctx.weeklyInterruptCount, 3)} pulls would hit your phone before close.`,
      }
    case "undocumented_procedures":
      return {
        source: "sops",
        title: "Play only you know",
        detail: "Mid-shift gap forces improvisation—no written path for the exception.",
      }
  }
}

function buildDay(
  day: number,
  view: EscapeReadinessView,
  ctx: EscapeAbsenceSimulationContext,
  capacityDays: number,
  failureDay: number,
  weakest: EscapeReadinessFactorId[]
): EscapeAbsenceSimulationDay {
  const score = view.score
  const stress = dayStress(day, capacityDays, score)
  const isBreakdownDay = day >= Math.max(1, Math.ceil(failureDay))
  const status = dayStatus(stress, isBreakdownDay)
  const phase = DAY_PHASES[(day - 1) % DAY_PHASES.length]!

  const events: EscapeAbsenceSimulationEvent[] = [
    ...sopEvents(ctx, factorHealth(view.factors, "sop_coverage"), day),
    ...trainingEvents(ctx, factorHealth(view.factors, "training_coverage"), day),
    ...issueEvents(ctx, factorHealth(view.factors, "unresolved_issues"), day),
    ...interruptEvents(
      ctx,
      factorHealth(view.factors, "owner_interruptions"),
      day,
      capacityDays
    ),
    ...staffingEvents(ctx, day),
    ...askRivetEvents(ctx, day),
    ...teamReadinessEvents(ctx, day),
  ]

  const breakdownFactor = weakest[Math.min(day - 1, weakest.length - 1)] ?? weakest[0]!
  const breakdown =
    isBreakdownDay || status === "breakdown"
      ? breakdownForFactor(breakdownFactor, ctx, day)
      : undefined

  const summary =
    status === "breakdown"
      ? "Floor stress exceeds what systems can absorb without you."
      : status === "strained"
        ? "Team keeps going—but judgment keeps routing back to the owner."
        : "Shift holds with minor questions—watch the afternoon."

  return {
    day,
    label: `Day ${day} · ${phase}`,
    headline: dayHeadline(day, status, view, ctx, failureDay),
    status,
    stressPercent: stress,
    summary,
    events: events.slice(0, 5),
    breakdownMoment: breakdown,
  }
}

export function buildAbsenceSimulation(
  view: EscapeReadinessView,
  context?: EscapeAbsenceSimulationContext | null
): EscapeAbsenceSimulation | null {
  if (view.score == null) return null

  const ctx = context ?? view.simulationContext ?? buildSimulationContextFromView(view)
  const capacityDays = view.absenceCapacity?.estimatedDays ?? 2
  const failureDay = view.absenceCapacity?.failureAtDays ?? Math.max(1, capacityDays * 0.65)
  const totalDays = simulationDays(capacityDays)
  const weakest = sortedWeakestFactors(view.factors)
  const orderedWeakest =
    weakest.length > 0
      ? weakest
      : FACTOR_ORDER.filter((id) => factorHealth(view.factors, id) < 60)

  const days = Array.from({ length: totalDays }, (_, i) =>
    buildDay(i + 1, view, ctx, capacityDays, failureDay, orderedWeakest)
  )

  const firstBreakdown = days.find((d) => d.breakdownMoment)?.breakdownMoment ?? null
  const breakdownDays = days.filter((d) => d.status === "breakdown").map((d) => d.day)
  const { fixes, projectedDaysGain } = buildAbsenceSimulationFixes(view)

  return {
    capacityDays,
    totalDays,
    firstBreakdownDay: breakdownDays[0] ?? Math.ceil(failureDay),
    headline: firstBreakdown
      ? `Likely first break on day ${breakdownDays[0] ?? Math.ceil(failureDay)}: ${firstBreakdown.title}`
      : `Scenario runs ${totalDays} days at current readiness.`,
    days,
    breakdownDays,
    fixes,
    projectedDaysGain,
  }
}

export function simulationSourceLabel(source: EscapeAbsenceSimulationEventSource): string {
  switch (source) {
    case "sops":
      return "Plays"
    case "training":
      return "Training"
    case "issues":
      return "Issues"
    case "interruptions":
      return "Owner pulls"
    case "staffing":
      return "Staffing"
    case "ask_rivet":
      return "Ask Rivet"
    case "team_readiness":
      return "Team readiness"
  }
}
