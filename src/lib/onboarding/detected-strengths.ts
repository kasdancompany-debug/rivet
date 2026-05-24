import type { OwnerOnboardingAnswers } from "./owner-intake"

export type DetectedStrength = {
  label: string
  /** Higher = stronger signal from answers. */
  score: number
}

function rankStrengths(candidates: DetectedStrength[]): string[] {
  const sorted = [...candidates].sort((a, b) => b.score - a.score)
  const labels: string[] = []
  for (const item of sorted) {
    if (labels.length >= 4) break
    if (!labels.includes(item.label)) labels.push(item.label)
  }
  return labels
}

/**
 * 3–4 strengths grounded in quiz answers—positive but specific, never generic cheerleading.
 */
export function detectOperationalStrengths(a: OwnerOnboardingAnswers): string[] {
  const candidates: DetectedStrength[] = []

  if (a.standardsMode === "documented") {
    candidates.push({ label: "Quality standards exist in writing", score: 92 })
  } else if (a.standardsMode === "mixed") {
    candidates.push({ label: "Critical systems are partially documented", score: 78 })
  }

  if (a.qualityOnOnePerson === "no") {
    candidates.push({ label: "Quality is not locked to one person on the floor", score: 88 })
  } else if (a.qualityOnOnePerson === "unsure") {
    candidates.push({ label: "Quality ownership is visible—you are testing whether it is transferable", score: 52 })
  }

  if (a.openWithoutYou === "yes" && a.closeWithoutYou === "yes") {
    candidates.push({ label: "Open and close can run without you on record", score: 90 })
  } else if (a.openWithoutYou === "yes" || a.closeWithoutYou === "yes") {
    candidates.push({ label: "One bookend operation already transfers off you", score: 72 })
  } else if (a.openWithoutYou === "sometimes" || a.closeWithoutYou === "sometimes") {
    candidates.push({ label: "Bookend handoffs are forming—even if not fully reliable", score: 58 })
  }

  if (a.staffInterrupts === "rarely") {
    candidates.push({ label: "Routine decisions rarely route to the owner", score: 86 })
  } else if (a.staffInterrupts === "weekly") {
    candidates.push({ label: "Interruptions are bounded—not constant owner load", score: 64 })
  }

  if (a.daysPerWeek === "0-2" || a.daysPerWeek === "3-4") {
    candidates.push({ label: "Floor time is contained enough to build off-shift", score: 70 })
  }

  if (a.avoidedTimeOff === "no") {
    candidates.push({ label: "The operation has carried time off without you avoiding it", score: 74 })
  }

  if (a.breaksWhenYouLeave.trim().length >= 12) {
    candidates.push({ label: "Failure modes are named—you know what slips first", score: 80 })
  }

  candidates.push({ label: "Owner awareness is strong—you mapped dependency bluntly", score: 55 })

  if (a.standardsMode === "verbal" && a.staffInterrupts !== "constant" && a.staffInterrupts !== "daily") {
    candidates.push({ label: "Team habits are emerging on routine shifts", score: 48 })
  }

  if (a.standardsMode === "mixed" && (a.openWithoutYou === "sometimes" || a.closeWithoutYou === "sometimes")) {
    candidates.push({ label: "Critical systems are partially repeatable day to day", score: 66 })
  }

  let picked = rankStrengths(candidates)

  if (picked.length < 3) {
    const fallbacks: DetectedStrength[] = [
      { label: "You have a baseline read—most owners never quantify dependency", score: 40 },
      { label: "Gaps are identifiable, which makes the next fix sequencable", score: 38 },
    ]
    picked = rankStrengths([...candidates, ...fallbacks])
  }

  return picked.slice(0, 4)
}
