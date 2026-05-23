import type { OperationalScanAnswers, OperationalScanResult } from "@/lib/operational-scan/score"
import { weeklyCountMidpoint } from "@/lib/operational-scan/score"

/** Exactly three urgent, actionable first fixes for the scan results page. */
export function recommendedFirstFixes(
  result: OperationalScanResult,
  answers: OperationalScanAnswers
): [string, string, string] {
  type Fix = { weight: number; text: string }
  const fixes: Fix[] = []

  if (answers.staffCanOpenWithoutOwner === "no" || answers.staffCanCloseWithoutOwner === "no") {
    fixes.push({
      weight: 92,
      text: "Publish open and close as one-page procedures with a named team lead—your phone should not be step one.",
    })
  } else if (answers.staffCanOpenWithoutOwner === "partial" || answers.staffCanCloseWithoutOwner === "partial") {
    fixes.push({
      weight: 58,
      text: "Finish open/close procedures so a call-out does not put the day back on your calendar.",
    })
  }

  if (answers.trainingConsistency === "none" || answers.trainingConsistency === "rarely") {
    fixes.push({
      weight: 78,
      text: "Tie one training module to your highest-variance procedure—completion means they run it without you re-teaching.",
    })
  } else if (answers.trainingConsistency === "sometimes") {
    fixes.push({
      weight: 52,
      text: "Make training consistent: same module, same sign-off, every new hire—not whoever is available that day.",
    })
  }

  if (answers.undocumentedProcedures !== "0") {
    fixes.push({
      weight: 70,
      text: "Write down the next procedure only you know—assign an owner before it becomes another interrupt.",
    })
  }

  if (answers.canRunFiveDaysWithoutOwner === "no") {
    fixes.push({
      weight: 88,
      text: "Prove five days away is possible: backup coverage, written judgment calls, and who owns vendor fires.",
    })
  } else if (answers.canRunFiveDaysWithoutOwner === "partial") {
    fixes.push({
      weight: 56,
      text: "Stress-test a week away once—quality, cash, and vendor issues expose gaps faster than optimism.",
    })
  }

  const textsMid = weeklyCountMidpoint(answers.ownerTextsCallsPerWeek)
  if (textsMid >= 16) {
    fixes.push({
      weight: 85,
      text: `You are on the hook for ~${textsMid}+ texts/calls a week—log them for 14 days and kill the repeats with written owners.`,
    })
  }

  const staffMid = weeklyCountMidpoint(answers.staffQuestionsPerWeek)
  if (staffMid >= 16) {
    fixes.push({
      weight: 80,
      text: `Staff still bring ~${staffMid}+ questions a week—each one is a procedure you have not written down yet.`,
    })
  }

  if (answers.repeatedMistakesIssues === "weekly" || answers.repeatedMistakesIssues === "daily") {
    fixes.push({
      weight: 74,
      text: "Same mistakes keep coming back—open a bottleneck for the top repeat and link it to the procedure that should prevent it.",
    })
  }

  if (result.severity === "HIGH" || result.severity === "CRITICAL") {
    fixes.push({
      weight: 65,
      text: "Install Rivet to document procedures, track training, and log owner interruptions—so the business is not stuck in your head.",
    })
  }

  fixes.sort((a, b) => b.weight - a.weight)
  const out: string[] = []
  const seen = new Set<string>()
  for (const f of fixes) {
    if (out.length >= 3) break
    if (seen.has(f.text)) continue
    seen.add(f.text)
    out.push(f.text)
  }

  const fallbacks = [
    "Log every owner text, call, and walk-up for one week—patterns show what to document first.",
    "Pick one judgment call only you make today and assign a written owner by Friday.",
    result.severity === "CRITICAL"
      ? `At ${result.ownerDependencyScore}/100 dependency, the next vacation will cost more than installing Rivet once.`
      : "You have headroom—document one load-bearing procedure before complexity outruns you.",
  ]
  let i = 0
  while (out.length < 3) {
    const t = fallbacks[i % fallbacks.length]!
    if (!seen.has(t)) {
      seen.add(t)
      out.push(t)
    }
    i += 1
  }

  return [out[0]!, out[1]!, out[2]!]
}

/** Printable report may include a fourth install line. */
export function recommendedNextSteps(
  result: OperationalScanResult,
  answers: OperationalScanAnswers
): string[] {
  const [a, b, c] = recommendedFirstFixes(result, answers)
  return [a, b, c]
}
