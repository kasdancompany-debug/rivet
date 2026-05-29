import type { CoachBrief, CoachRecommendation, OperationsCoachSnapshot } from "@/lib/operations-coach/types"

const ORDERING_HINT = /supplier|order|vendor|inventory|\bpar\b|ordering|wholesale/i

function pushRec(
  out: CoachRecommendation[],
  seen: Set<string>,
  rec: CoachRecommendation
) {
  if (seen.has(rec.id)) return
  seen.add(rec.id)
  out.push(rec)
}

export function generateCoachBrief(snapshot: OperationsCoachSnapshot): CoachBrief {
  const recs: CoachRecommendation[] = []
  const seen = new Set<string>()

  const dep = snapshot.assessment.founderDependencyPercent
  const topSection = snapshot.assessment.topSectionId
  const openingWeak =
    snapshot.dailyChecklists.weakestShiftType === "opening" &&
    (snapshot.dailyChecklists.byShiftType.find((x) => x.type === "opening")?.completionRate ??
      1) < 0.7

  if (topSection === "opening_closing" || openingWeak) {
    pushRec(recs, seen, {
      id: "opening-sop",
      priority: 10,
      headline: "Your highest risk is opening—document the opening process first.",
      detail:
        "Opening sets the tone for the whole day. Turn today’s tribal knowledge into a single checklist with photos and named owners, then rehearse it once with a lead without you on the floor.",
      signal:
        topSection === "opening_closing"
          ? "Latest concentration scan scores opening & closing highest."
          : "Recent daily runs show opening checklists finishing less reliably than other shift types.",
      href: "/sops/new",
    })
  }

  const pq = snapshot.issues.ownerRequiredByCategorySlug["product_quality"] ?? 0
  if (pq >= 2 || (pq >= 1 && snapshot.issues.ownerRequiredUnresolvedCount >= 4)) {
    pushRec(recs, seen, {
      id: "quality-sop",
      priority: 15,
      headline:
        pq >= 2
          ? `You have ${pq} quality issues flagged for your judgment. Capture a quality play.`
          : "Product quality keeps routing to you—capture a short quality play.",
      detail:
        "Draft a one-page quality play: reference photos, remake rules, and who may sign off. Link it from training so judgment calls stop landing on your phone.",
      signal: "Issues flagged for your judgment cluster on product_quality.",
      href: "/sops",
    })
  }

  const orderingModule = snapshot.training.modulesWithOpenAssignments.find((t) =>
    ORDERING_HINT.test(t)
  )
  const trainingGap =
    snapshot.training.assignmentsTotal > 0 &&
    snapshot.training.assignmentsCompleted / snapshot.training.assignmentsTotal < 0.65

  if (orderingModule && trainingGap) {
    pushRec(recs, seen, {
      id: "train-ordering",
      priority: 20,
      headline: `Train one backup person on ${orderingModule} this week.`,
      detail:
        "Pick a second person who can place or adjust orders without you. Pair them for one real order cycle, then have them teach-back the steps while you observe quietly.",
      signal: "Ordering-related training is still open while completion rates lag.",
      href: "/training",
    })
  } else if (trainingGap && snapshot.training.modulesWithOpenAssignments.length > 0) {
    const m = snapshot.training.modulesWithOpenAssignments[0]!
    pushRec(recs, seen, {
      id: "train-backup-generic",
      priority: 22,
      headline: `Assign a clear backup on “${m}” before you add new initiatives.`,
      detail:
        "Incomplete assignments mean the floor still borrows your judgment. Finish one module depth-first with a named backup, then rotate who signs off.",
      signal: "Training assignments are not clearing across the team.",
      href: "/training",
    })
  }

  const sopGap =
    snapshot.sops.draftCount >= 2 ||
    snapshot.sops.activeUnderTwoStepsCount >= 2 ||
    snapshot.sops.thinDescriptionActiveCount >= 3

  if (sopGap) {
    pushRec(recs, seen, {
      id: "close-sop-gaps",
      priority: 25,
      headline: "Close the play gaps before they become emergencies.",
      detail:
        "Ship or merge draft plays, and add two concrete steps to thin active ones. The goal is runnable detail, not a longer library.",
      signal:
        snapshot.sops.draftCount >= 2
          ? `${snapshot.sops.draftCount} plays still in draft.`
          : "Several active plays read like titles, not runbooks.",
      href: "/sops",
    })
  }

  const hireSignal =
    (dep ?? 0) >= 58 &&
    snapshot.issues.ownerRequiredUnresolvedCount >= 3 &&
    snapshot.training.assignmentsTotal > 0 &&
    snapshot.training.assignmentsCompleted / snapshot.training.assignmentsTotal < 0.55

  if (hireSignal) {
    pushRec(recs, seen, {
      id: "hire-shift-lead",
      priority: 30,
      headline:
        "Your next hire should likely be a shift lead, not just another front-counter employee.",
      detail:
        "Owner concentration is still high while training is stuck and issues escalate. A shift lead closes the loop on standards, checklists, and light coaching—freeing you from being the default answer.",
      signal: "Concentration read, owner-flagged volume, and training completion line up on leadership depth—not headcount.",
      href: "/team",
    })
  }

  if (snapshot.issues.ownerRequiredUnresolvedCount >= 1) {
    pushRec(recs, seen, {
      id: "triage-owner-issues",
      priority: 35,
      headline: "Triage issues flagged for you in one short block this week.",
      detail:
        "Batch decisions: what becomes a play, what becomes training, and what is a one-off. The team learns faster when your answers become operating memory, not texts.",
      signal: `${snapshot.issues.ownerRequiredUnresolvedCount} unresolved issue(s) still need you.`,
      href: "/issues?view=owner_required",
    })
  }

  const dailySoft =
    snapshot.dailyChecklists.totalRunsInWindow >= 3 &&
    (snapshot.dailyChecklists.runCompletionRate ?? 1) < 0.72

  if (dailySoft) {
    pushRec(recs, seen, {
      id: "daily-completion",
      priority: 40,
      headline: "Treat daily checklist completion as a reliability metric, not paperwork.",
      detail:
        "Runs are stalling or abandoning mid-shift. Check whether lists are too long, unclear, or untied to a single closer—then trim and reassign ownership on the floor.",
      signal: "Recent two-week run completion is below where stable shops usually sit.",
      href: "/operations",
    })
  }

  if (recs.length === 0) {
    pushRec(recs, seen, {
      id: "steady-course",
      priority: 50,
      headline: "Stay the course—signals are quiet enough to reinforce, not rebuild.",
      detail:
        "Keep documenting edge cases as they appear, and rotate who leads pre-shift so standards do not drift back to you by habit.",
      signal: "No single dimension is flashing critical against the current thresholds.",
      href: "/dashboard",
    })
  }

  recs.sort((a, b) => a.priority - b.priority || a.headline.localeCompare(b.headline))

  const openingLine = pickOpeningLine(snapshot, recs[0])

  return { openingLine, recommendations: recs.slice(0, 7) }
}

function pickOpeningLine(snapshot: OperationsCoachSnapshot, first: CoachRecommendation | undefined) {
  const name = snapshot.businessName
  if (first?.id === "opening-sop") {
    return `${name}: opening is the lever—get that runbook tight before you optimize anything downstream.`
  }
  if (first?.id === "quality-sop") {
    return `${name}: quality calls are still finding you first; make the standard visible and teachable.`
  }
  if (first?.id === "hire-shift-lead") {
    return `${name}: you are carrying coordination work that a shift lead is designed to absorb.`
  }
  if (snapshot.assessment.present && (snapshot.assessment.founderDependencyPercent ?? 0) <= 40) {
    return `${name}: fundamentals look steady—protect that with light documentation and deliberate cross-training.`
  }
  return `${name}: here is a concise read on where the week should focus, based on how the shop is actually running.`
}
