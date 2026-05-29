import { COPY } from "@/lib/interface-copy"
import type { OwnerOnboardingAnswers } from "./owner-intake"

export type DependencyBreakdownCategoryId =
  | "standards_missing"
  | "training_gaps"
  | "owner_interruptions"
  | "opening_closing"
  | "team_redundancy"

export type DependencyBreakdownCategory = {
  id: DependencyBreakdownCategoryId
  label: string
  /** Points this category adds to the 0–100 dependency index (higher = more load on you). */
  contributionPoints: number
  /** Share of the scoring model this category represents (sums to 100). */
  weightPercent: number
  rawStress: number
  maxStress: number
}

export type HighestLeverageAction = {
  categoryId: DependencyBreakdownCategoryId
  label: string
  /** How many points the dependency index could drop if this gap closes. */
  estimatedPointReduction: number
  href: string
}

export type DependencyBreakdown = {
  categories: DependencyBreakdownCategory[]
  highestLeverage: HighestLeverageAction
}

const TOTAL_MAX = 162

const CATEGORY_META: Record<
  DependencyBreakdownCategoryId,
  { label: string; maxStress: number; leverageLabel: string; href: string }
> = {
  standards_missing: {
    label: "Plays missing",
    maxStress: 22,
    leverageLabel: "Capture the plays you still explain out loud",
    href: "/sops/capture",
  },
  training_gaps: {
    label: "Training gaps",
    maxStress: 20,
    leverageLabel: "Publish a training path new hires can run without you",
    href: "/training",
  },
  owner_interruptions: {
    label: COPY.interruptions.featureTitle,
    maxStress: 26,
    leverageLabel: "Log what routes back to you and tie each to a written answer",
    href: "/interruptions/log",
  },
  opening_closing: {
    label: "Opening/closing dependency",
    maxStress: 56,
    leverageLabel: "Capture opening plays",
    href: "/sops/capture",
  },
  team_redundancy: {
    label: "Team redundancy",
    maxStress: 38,
    leverageLabel: "Assign named backup owners for open and close",
    href: "/sops",
  },
}

function triStress(v: OwnerOnboardingAnswers["openWithoutYou"]): number {
  if (v === "no") return 28
  if (v === "sometimes") return 14
  if (v === "yes") return 0
  return 10
}

function daysStress(b: OwnerOnboardingAnswers["daysPerWeek"]): number {
  switch (b) {
    case "7":
      return 22
    case "5-6":
      return 18
    case "3-4":
      return 10
    case "0-2":
      return 4
    default:
      return 10
  }
}

function interruptStress(i: OwnerOnboardingAnswers["staffInterrupts"]): number {
  switch (i) {
    case "constant":
      return 26
    case "daily":
      return 19
    case "weekly":
      return 11
    case "rarely":
      return 3
    default:
      return 10
  }
}

function timeOffStress(a: OwnerOnboardingAnswers["avoidedTimeOff"]): number {
  if (a === "yes") return 16
  if (a === "prefer_not") return 9
  if (a === "no") return 0
  return 7
}

function standardsStress(s: OwnerOnboardingAnswers["standardsMode"]): number {
  if (s === "verbal") return 22
  if (s === "mixed") return 12
  if (s === "documented") return 0
  return 10
}

function qualityStress(q: OwnerOnboardingAnswers["qualityOnOnePerson"]): number {
  if (q === "yes") return 20
  if (q === "unsure") return 11
  if (q === "no") return 0
  return 9
}

function rawByCategory(a: OwnerOnboardingAnswers): Record<DependencyBreakdownCategoryId, number> {
  return {
    standards_missing: standardsStress(a.standardsMode),
    training_gaps: qualityStress(a.qualityOnOnePerson),
    owner_interruptions: interruptStress(a.staffInterrupts),
    opening_closing: triStress(a.openWithoutYou) + triStress(a.closeWithoutYou),
    team_redundancy: daysStress(a.daysPerWeek) + timeOffStress(a.avoidedTimeOff),
  }
}

function contributionPoints(raw: number): number {
  return (raw / TOTAL_MAX) * 100
}

/** Largest-remainder allocation so category points sum to the dependency index. */
function allocateContributionPoints(
  raw: Record<DependencyBreakdownCategoryId, number>,
  dependencyIndex: number
): Record<DependencyBreakdownCategoryId, number> {
  const ids = Object.keys(CATEGORY_META) as DependencyBreakdownCategoryId[]
  const exact = ids.map((id) => contributionPoints(raw[id]))
  const floored = exact.map((n) => Math.floor(n))
  let remainder = dependencyIndex - floored.reduce((sum, n) => sum + n, 0)

  const order = exact
    .map((value, index) => ({ index, frac: value - Math.floor(value) }))
    .sort((a, b) => b.frac - a.frac)

  for (const { index } of order) {
    if (remainder <= 0) break
    floored[index]! += 1
    remainder -= 1
  }

  return Object.fromEntries(ids.map((id, index) => [id, floored[index]!])) as Record<
    DependencyBreakdownCategoryId,
    number
  >
}

function pickHighestLeverage(
  categories: DependencyBreakdownCategory[]
): DependencyBreakdownCategory {
  return [...categories].sort((a, b) => {
    const aRatio = a.maxStress > 0 ? a.rawStress / a.maxStress : 0
    const bRatio = b.maxStress > 0 ? b.rawStress / b.maxStress : 0
    if (bRatio !== aRatio) return bRatio - aRatio
    return b.contributionPoints - a.contributionPoints
  })[0]!
}

export function computeDependencyBreakdown(a: OwnerOnboardingAnswers): DependencyBreakdown {
  const raw = rawByCategory(a)
  const dependencyIndex = Math.round(
    Math.min(100, Math.max(0, (Object.values(raw).reduce((sum, n) => sum + n, 0) / TOTAL_MAX) * 100))
  )
  const allocated = allocateContributionPoints(raw, dependencyIndex)

  const categories: DependencyBreakdownCategory[] = (
    Object.keys(CATEGORY_META) as DependencyBreakdownCategoryId[]
  ).map((id) => {
    const meta = CATEGORY_META[id]
    const rawStress = raw[id]
    return {
      id,
      label: meta.label,
      contributionPoints: allocated[id],
      weightPercent: Math.round((meta.maxStress / TOTAL_MAX) * 100),
      rawStress,
      maxStress: meta.maxStress,
    }
  })

  const top = pickHighestLeverage(categories)
  const meta = CATEGORY_META[top.id]

  return {
    categories,
    highestLeverage: {
      categoryId: top.id,
      label: meta.leverageLabel,
      estimatedPointReduction: Math.max(1, top.contributionPoints),
      href: meta.href,
    },
  }
}

/** Sum of category raw stress — used by dependency index (0–162 scale). */
export function totalDependencyRaw(a: OwnerOnboardingAnswers): number {
  const raw = rawByCategory(a)
  return Object.values(raw).reduce((sum, n) => sum + n, 0)
}
