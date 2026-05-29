import type {
  EscapeReadinessFactor,
  EscapeReadinessFactorDetail,
  EscapeReadinessFactorId,
  EscapeReadinessFactorInput,
} from "@/lib/escape-readiness/types"

type DetailBand = "empty" | "critical" | "fragile" | "building" | "strong"

type FactorDetailTemplate = {
  complete: Record<DetailBand, string[]>
  missing: Record<DetailBand, string[]>
  suggestedAction: Record<DetailBand, string>
  fixCta: { label: string; href: string }
}

const FACTOR_DETAILS: Record<EscapeReadinessFactorId, FactorDetailTemplate> = {
  sop_coverage: {
    complete: {
      empty: [],
      critical: ["Some standards exist on file"],
      fragile: ["Active plays published for core routines", "At least one procedure has written steps"],
      building: ["Open and close documented with steps", "Most high-variance plays have owners"],
      strong: ["Play depth across active routines", "Roles and evidence on critical plays", "Refresh cadence on key plays"],
    },
    missing: {
      empty: ["Active open and close plays", "Documented steps on highest-variance work", "Named owners on published plays"],
      critical: ["Written open and close playbooks", "Steps on your most repeated questions", "Owner assigned on each critical play"],
      fragile: ["Depth on high-variance plays", "Evidence and refresh dates on key routines", "Coverage for rush-week scenarios"],
      building: ["Full depth on edge-case plays", "Backup owners when primary is out", "One-page summaries for floor staff"],
      strong: ["Quarterly refresh on all critical plays", "Cross-training links on every play"],
    },
    suggestedAction: {
      empty: "Publish open, close, and one high-variance play with steps and a named owner.",
      critical: "Capture open, close, and the question you explain most often—one page each.",
      fragile: "Add steps, roles, and evidence to your top three variance plays.",
      building: "Deepen your thinnest active play and assign a backup owner.",
      strong: "Schedule refresh on your oldest critical play and tie it to training.",
    },
    fixCta: { label: "Capture a play now", href: "/sops/new" },
  },
  training_coverage: {
    complete: {
      empty: [],
      critical: ["Some training modules exist"],
      fragile: ["Modules assigned to at least one role", "Completion tracked in Rivet"],
      building: ["Core roles have assigned modules", "Most assignments show progress"],
      strong: ["High completion on critical modules", "Training tied to published plays", "New hires get a clear path"],
    },
    missing: {
      empty: ["Training assignments for floor roles", "Modules linked to real plays", "Completion dates with accountability"],
      critical: ["Assigned modules for open and close", "Completion tracking on critical tasks", "Training tied to plays—not shadowing"],
      fragile: ["Coverage for every role that runs alone", "Refresher modules on repeat mistakes", "Clear due dates per person"],
      building: ["100% completion on opening/closing modules", "Cross-role backup training", "Modules for vendor and exception calls"],
      strong: ["Refresher cadence on drift-prone tasks", "Certification before solo shifts"],
    },
    suggestedAction: {
      empty: "Assign one module tied to open, close, or your highest-variance procedure.",
      critical: "Assign opening/closing training to one person with a due date this week.",
      fragile: "Link an existing module to the play staff ask about most—and require completion.",
      building: "Close incomplete assignments and add a refresher for your thinnest role.",
      strong: "Add a certification checkpoint before anyone runs a shift alone.",
    },
    fixCta: { label: "Assign training now", href: "/training" },
  },
  unresolved_issues: {
    complete: {
      empty: [],
      critical: ["Issues are being logged"],
      fragile: ["Some issues have owners assigned", "Oldest items are visible on the board"],
      building: ["Most open issues have owners and due dates", "Repeat mistakes are tracked"],
      strong: ["No stale unresolved issues", "Owners on every open item", "Fixes linked to plays or training"],
    },
    missing: {
      empty: ["Issue log with owners", "Due dates on open items", "Pattern tracking on repeat mistakes"],
      critical: ["Owner on every open issue", "Due date on the oldest item", "Status beyond logged"],
      fragile: ["Resolution path on repeat mistakes", "Fewer than three stale open issues", "Link to play or training fix"],
      building: ["Zero issues older than two weeks without owner", "Cost or impact noted on top items"],
      strong: ["Weekly review cadence on open issues", "Escalation path that does not default to you"],
    },
    suggestedAction: {
      empty: "Log your most repeated floor problem and assign an owner with a due date.",
      critical: "Assign the oldest open issue today—owner, due date, and next step.",
      fragile: "Close or reassign the three oldest issues before they become texts.",
      building: "Link the top open issue to a play fix or training module.",
      strong: "Run a weekly issue review so nothing routes to you by default.",
    },
    fixCta: { label: "Fix an issue now", href: "/issues?capture=1" },
  },
  owner_interruptions: {
    complete: {
      empty: [],
      critical: ["Awareness of interrupt volume"],
      fragile: ["Some pulls logged this week", "Patterns starting to emerge"],
      building: ["Regular logging of texts and walk-ups", "Categories visible on the feed"],
      strong: ["Low interrupt volume logged", "Staff use plays before escalating", "Clear escalation path without owner"],
    },
    missing: {
      empty: ["Interruption log for two weeks", "Categories on what routes to you", "Documentation targets from patterns"],
      critical: ["Daily log of texts, calls, and walk-ups", "Named owner on judgment-call gaps", "Written answer for top repeat question"],
      fragile: ["Trend visible over 14 days", "Play for top owner-pull category", "Staff trained on when not to escalate"],
      building: ["Interrupt volume trending down", "Documented exceptions only you know", "Backup decision-maker named"],
      strong: ["Stress-tested absence without spikes", "Automated routing for vendor fires"],
    },
    suggestedAction: {
      empty: "Log every text, call, and walk-up for 14 days—patterns show what to document next.",
      critical: "Log today's pulls and write a one-page answer for your top repeat question.",
      fragile: "Turn your top owner-pull category into a play with a named backup.",
      building: "Review last week's log and assign documentation for the top two patterns.",
      strong: "Run a half-day absence rehearsal and track what still reaches you.",
    },
    fixCta: { label: "Log an interruption now", href: "/interruptions/log" },
  },
  undocumented_procedures: {
    complete: {
      empty: [],
      critical: ["Some standards captured as drafts"],
      fragile: ["Most procedures have at least a draft", "Active plays cover core routines"],
      building: ["Runnable steps on critical plays", "Few gaps without documentation"],
      strong: ["Every active standard has steps", "Drafts promoted with owners", "No single-point knowledge gaps"],
    },
    missing: {
      empty: ["Written procedures for open and close", "Steps on active standards", "Drafts promoted to runnable plays"],
      critical: ["The next procedure only you know", "Steps on active open/close", "Owner on every draft"],
      fragile: ["Documentation on vendor and pricing exceptions", "Mid-shift procedures with written paths", "Promotion of stale drafts"],
      building: ["Depth on exception handling", "Voice-captured gaps turned into SOPs", "Backup knowledge for key vendors"],
      strong: ["Quarterly audit for new tribal knowledge", "Zero active plays without steps"],
    },
    suggestedAction: {
      empty: "Capture the next procedure only you know—voice note or bullets on the floor.",
      critical: "Write down open, close, or your most repeated question today.",
      fragile: "Promote your oldest draft to active with steps and an owner.",
      building: "Document the vendor or pricing exception staff ask you about most.",
      strong: "Audit active plays for missing steps and assign owners to fix gaps.",
    },
    fixCta: { label: "Capture a procedure now", href: "/sops/capture" },
  },
}

function detailBand(percent: number | null): DetailBand {
  if (percent == null) return "empty"
  if (percent <= 35) return "critical"
  if (percent <= 55) return "fragile"
  if (percent <= 75) return "building"
  return "strong"
}

export function buildFactorDetail(
  factor: EscapeReadinessFactorInput
): EscapeReadinessFactorDetail {
  const band = detailBand(factor.percent)
  const template = FACTOR_DETAILS[factor.id]

  return {
    whatsComplete: template.complete[band],
    whatsMissing: template.missing[band],
    suggestedAction: template.suggestedAction[band],
    fixCta: template.fixCta,
  }
}

export function enrichFactorsWithDetails(
  factors: EscapeReadinessFactorInput[]
): EscapeReadinessFactor[] {
  return factors.map((factor) => ({
    ...factor,
    detail: buildFactorDetail(factor),
  }))
}
