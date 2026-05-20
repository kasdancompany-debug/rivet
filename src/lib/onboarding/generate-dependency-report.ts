import type { OwnerOnboardingAnswers, TriState } from "./owner-intake"

export type DependencyBand = "contained" | "strained" | "critical"

export type OperationalDependencyReport = {
  dependencyIndex: number
  band: DependencyBand
  headline: string
  subheadline: string
  heardBullets: string[]
  patternTitle: string
  patternBody: string
  uncomfortableTruth: string
  stakes: string
  yourMoves: { title: string; description: string; href: string }[]
}

function triStress(v: TriState | null): number {
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

/** 0 = resilient team systems, 100 = operationally fused to one person. */
export function computeDependencyIndex(a: OwnerOnboardingAnswers): number {
  const raw =
    daysStress(a.daysPerWeek) +
    triStress(a.openWithoutYou) +
    triStress(a.closeWithoutYou) +
    interruptStress(a.staffInterrupts) +
    timeOffStress(a.avoidedTimeOff) +
    standardsStress(a.standardsMode) +
    qualityStress(a.qualityOnOnePerson)
  const max = 22 + 28 + 28 + 26 + 16 + 22 + 20
  return Math.round(Math.min(100, Math.max(0, (raw / max) * 100)))
}

function bandFromIndex(n: number): DependencyBand {
  if (n >= 72) return "critical"
  if (n >= 44) return "strained"
  return "contained"
}

const DAYS_LABEL: Record<NonNullable<OwnerOnboardingAnswers["daysPerWeek"]>, string> = {
  "0-2": "zero to two days",
  "3-4": "three to four days",
  "5-6": "five to six days",
  "7": "seven days",
}

const TRI_LABEL: Record<NonNullable<TriState>, string> = {
  yes: "Yes — reliably",
  sometimes: "Sometimes / not confident",
  no: "No — it still routes through you",
}

const INTERRUPT_LABEL: Record<NonNullable<OwnerOnboardingAnswers["staffInterrupts"]>, string> = {
  rarely: "Rarely",
  weekly: "A few times a week",
  daily: "Most days",
  constant: "All day — it never really stops",
}

export function generateOperationalDependencyReport(
  a: OwnerOnboardingAnswers
): OperationalDependencyReport {
  const dependencyIndex = computeDependencyIndex(a)
  const band = bandFromIndex(dependencyIndex)
  const breaks = a.breaksWhenYouLeave.trim()

  const heardBullets: string[] = []
  if (a.daysPerWeek) {
    heardBullets.push(
      `You said you are on the floor about ${DAYS_LABEL[a.daysPerWeek]} per week—not a hobby schedule.`
    )
  }
  if (a.openWithoutYou) {
    heardBullets.push(`Opening without you: ${TRI_LABEL[a.openWithoutYou]}.`)
  }
  if (a.closeWithoutYou) {
    heardBullets.push(`Closing without you: ${TRI_LABEL[a.closeWithoutYou]}.`)
  }
  if (a.staffInterrupts) {
    heardBullets.push(`Interruptions from staff: ${INTERRUPT_LABEL[a.staffInterrupts]}.`)
  }
  if (a.avoidedTimeOff === "yes") {
    heardBullets.push("You have avoided taking real time off—your nervous system already voted on risk.")
  } else if (a.avoidedTimeOff === "prefer_not") {
    heardBullets.push("Time off is… complicated—which usually means the business can’t comfortably release you.")
  }
  if (a.standardsMode === "verbal") {
    heardBullets.push("Standards mostly live in people’s heads, not in something the shift can execute the same way twice.")
  } else if (a.standardsMode === "mixed") {
    heardBullets.push("Some things are written—enough to feel organized—but plenty still depends on who is working.")
  }
  if (a.qualityOnOnePerson === "yes") {
    heardBullets.push("Quality visibly hinges on one person—often you—instead of a repeatable bar.")
  }

  if (breaks) {
    heardBullets.push(`When you step away, what slips first sounds like: “${breaks.slice(0, 220)}${breaks.length > 220 ? "…" : ""}”`)
  }

  let patternTitle = "The living safety net"
  let patternBody =
    "You are not “bad at delegation.” You are carrying live judgment where the business never finished installing systems—so the safest default is still you."

  if (a.openWithoutYou === "no" && a.closeWithoutYou === "no") {
    patternTitle = "The bookends still have your name on them"
    patternBody =
      "Open and close are where cash, quality, and tone get set. If both still orbit you, the middle of the day can look fine while the business quietly stays non-transferable."
  } else if (a.staffInterrupts === "constant" || a.staffInterrupts === "daily") {
    patternTitle = "The human API"
    patternBody =
      "Your team is not lazy—they are optimizing for certainty. If answers live in your head, interruption is rational behavior, not rudeness."
  } else if (a.standardsMode === "verbal") {
    patternTitle = "Tribal knowledge at scale"
    patternBody =
      "Verbal standards feel fast until volume hits. Then variance becomes “personality,” rework becomes normal, and you become the interpreter-in-chief."
  } else if (a.qualityOnOnePerson === "yes") {
    patternTitle = "Single-point quality"
    patternBody =
      "When quality is a person instead of a spec, you do not just work hard—you work irreplaceably. That is flattering until it is expensive."
  }

  let uncomfortableTruth =
    "The uncomfortable truth is not that you work hard. It is that the operation may be rewarding your availability—so the business never has to finish becoming explicit."

  if (dependencyIndex >= 72) {
    uncomfortableTruth =
      "At this load, you are not “managing details.” You are absorbing variance that should live in standards, training, and evidence. That is sustainable in sprints—and corrosive across years."
  } else if (dependencyIndex >= 44) {
    uncomfortableTruth =
      "You are closer to the edge than it looks from the outside: enough works until one key person is sick, a vendor slips, or volume spikes—and then the seams show fast."
  } else {
    uncomfortableTruth =
      "You are further along than many owner-operators—but the remaining gaps are where interruptions and exceptions concentrate. That is where dependency quietly compounds."
  }

  let stakes =
    "If nothing changes, the business does not “fail” overnight. It slowly trains everyone— including you—that your judgment is the cheapest way to get to tomorrow."

  if (a.avoidedTimeOff === "yes") {
    stakes =
      "Avoiding time off is not a character flaw. It is a signal that the system cannot yet carry the business without your vigilance—and vigilance has a shelf life."
  }

  const headline =
    band === "critical"
      ? "Your operation is carrying too much of you."
      : band === "strained"
        ? "You are running a real business on a personal backbone."
        : "You have more transferability than you feel—but the last mile is expensive."

  const subheadline =
    band === "critical"
      ? "This is the profile we see right before owners burn out, shrink the business, or quietly accept a lower ceiling. The good news: it is fixable—but not by working harder."
      : band === "strained"
        ? "You are not failing. You are under-instrumented: the work is real, but the scaffolding is thinner than the volume demands."
        : "The wins here are real. The work now is to stop the quiet backslide: capture the last tribal edges before volume makes them expensive."

  const yourMoves: OperationalDependencyReport["yourMoves"] = [
    ...(breaks
      ? []
      : [
          {
            title: "Name what breaks first—one blunt sentence",
            description:
              "You left this blank. When you can, add one sentence in a rerun— it becomes the anchor for what you standardize next.",
            href: "/onboarding",
          },
        ]),
    {
      title: "Capture one standard you still explain out loud",
      description:
        "Not a policy binder—a runnable play your team can execute without interpreting you. Start where interruptions hurt most.",
      href: "/sops/capture",
    },
    {
      title: "Make training mean something measurable",
      description: "Tie modules to standards so “trained” is not vibes—it is completion against a bar you can see.",
      href: "/training",
    },
    {
      title: "Put bottlenecks in writing—off your texts",
      description: "If exceptions live in DMs, you will always be the router. Log what blocks the standard so fixes live in the business.",
      href: "/issues",
    },
  ]

  return {
    dependencyIndex,
    band,
    headline,
    subheadline,
    heardBullets,
    patternTitle,
    patternBody,
    uncomfortableTruth,
    stakes,
    yourMoves,
  }
}
