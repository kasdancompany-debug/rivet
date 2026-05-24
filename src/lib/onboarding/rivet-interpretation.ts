import type { DependencyBreakdown, DependencyBreakdownCategoryId } from "./dependency-breakdown"
import type { OwnerOnboardingAnswers } from "./owner-intake"

type InterpretationBand = "contained" | "strained" | "critical"

export type RivetInterpretation = {
  criticalDependency: string
  hiddenRisk: string
  predictedOutcome: string
  suggestedFirstAction: string
  suggestedFirstActionHref: string
}

const CRITICAL_BY_CATEGORY: Record<DependencyBreakdownCategoryId, string[]> = {
  opening_closing: [
    "Bookend operations still require owner judgment—cash, tone, and security do not transfer without you.",
    "Open and close remain owner-gated, which makes the middle of the day look healthier than the business actually is.",
  ],
  standards_missing: [
    "Execution variance is absorbed by you because standards are not fixed enough for the shift to run the same way twice.",
    "The operation interprets quality through you instead of through documented bars the team can verify.",
  ],
  owner_interruptions: [
    "Staff default to you for decisions that should be routable—interruption is the system's release valve.",
    "Uncertainty is priced into your calendar: the team optimizes for certainty, not autonomy.",
  ],
  training_gaps: [
    "Quality and handoffs lack depth on the bench—one key absence would show up on the floor immediately.",
    "Training has not produced interchangeable execution; judgment still concentrates on one person.",
  ],
  team_redundancy: [
    "Presence substitutes for redundancy—you are structurally load-bearing across too many days.",
    "The roster cannot carry volume without your vigilance; time away is treated as operational risk.",
  ],
}

const LEVERAGE_ACTION: Record<
  DependencyBreakdownCategoryId,
  { label: string; href: string }
> = {
  opening_closing: {
    label: "Capture opening and closing as runnable checklists with named owners.",
    href: "/sops/capture",
  },
  standards_missing: {
    label: "Document one standard you still explain verbally—where interruptions cluster.",
    href: "/sops/capture",
  },
  owner_interruptions: {
    label: "Log the next three interruptions and write the answer once in a standard.",
    href: "/interruptions/log",
  },
  training_gaps: {
    label: "Publish a short training path tied to one quality bar someone else can sign off.",
    href: "/training",
  },
  team_redundancy: {
    label: "Assign backup owners for open and close before adding any new initiative.",
    href: "/sops",
  },
}

function topCategories(breakdown: DependencyBreakdown, n = 2) {
  return [...breakdown.categories]
    .sort((a, b) => b.contributionPoints - a.contributionPoints)
    .slice(0, n)
}

function pickVariant(lines: string[], seed: number): string {
  return lines[Math.abs(seed) % lines.length]!
}

function hiddenRiskLine(a: OwnerOnboardingAnswers, breakdown: DependencyBreakdown): string {
  const [, second] = topCategories(breakdown, 2)
  const openCloseFragile = a.openWithoutYou === "no" || a.closeWithoutYou === "no"
  const verbalStandards = a.standardsMode === "verbal" || a.standardsMode === "mixed"
  const heavyInterrupts = a.staffInterrupts === "daily" || a.staffInterrupts === "constant"
  const noBench = a.qualityOnOnePerson === "yes" || a.qualityOnOnePerson === "unsure"
  const timeOffBlocked = a.avoidedTimeOff === "yes" || a.avoidedTimeOff === "prefer_not"
  const alwaysOn = a.daysPerWeek === "5-6" || a.daysPerWeek === "7"

  if (verbalStandards && heavyInterrupts) {
    return "Tribal knowledge plus daily pings compounds quietly—each exception trains the team to skip the written path."
  }
  if (openCloseFragile && verbalStandards) {
    return "Mid-shift can look stable while bookends and standards stay implicit—transferability fails when you are not on the floor."
  }
  if (alwaysOn && timeOffBlocked) {
    return "High floor time paired with avoided time off signals the business cannot yet tolerate your absence without rework."
  }
  if (noBench && heavyInterrupts) {
    return "Single-point quality under interruption load means small absences become customer-visible fast."
  }
  if (a.breaksWhenYouLeave.trim().length > 12) {
    return "You already know what slips first when you leave—that failure mode will repeat until it is standardized."
  }
  if (second) {
    return pickVariant(CRITICAL_BY_CATEGORY[second.id], second.contributionPoints + second.rawStress)
  }
  return "Residual tribal edges will reassert under volume before they show up in metrics."
}

function predictedOutcome(band: InterpretationBand, dependencyIndex: number): string {
  if (band === "critical") {
    return dependencyIndex >= 85
      ? "Without structural fixes, growth will increase your load faster than payroll—burnout or scope shrink becomes the default ceiling."
      : "If unchanged, the next spike, sick day, or hire gap will route through you—and each cycle reinforces that you are the cheapest fix."
  }
  if (band === "strained") {
    return "The operation can run until it cannot: one vendor slip, absence, or rush week will expose gaps you are currently absorbing in real time."
  }
  return "You are ahead of most owners, but undocumented edges will compound—small drift becomes expensive once volume rises."
}

export function generateRivetInterpretation(
  a: OwnerOnboardingAnswers,
  breakdown: DependencyBreakdown,
  band: InterpretationBand,
  dependencyIndex: number
): RivetInterpretation {
  const [primary] = topCategories(breakdown, 1)

  const criticalDependency = primary
    ? pickVariant(CRITICAL_BY_CATEGORY[primary.id], primary.contributionPoints)
    : "Owner judgment still carries load-bearing paths the team cannot execute independently."

  const leverage = LEVERAGE_ACTION[breakdown.highestLeverage.categoryId]

  return {
    criticalDependency,
    hiddenRisk: hiddenRiskLine(a, breakdown),
    predictedOutcome: predictedOutcome(band, dependencyIndex),
    suggestedFirstAction: leverage.label,
    suggestedFirstActionHref: leverage.href,
  }
}
