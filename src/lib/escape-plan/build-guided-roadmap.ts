import type { EscapePlanTaskItemKind, TablesInsert } from "@/types/database"

import type { EscapePlanIntake, HoursBand, TeamSizeBand } from "@/lib/escape-plan/guided-types"

export type GuidedEscapePlanTaskSeed = Omit<
  TablesInsert<"owner_escape_plan_tasks">,
  "plan_id" | "id" | "created_at" | "notes" | "completed_at" | "completed_by"
>

function pick(xs: string[], max = 4): string {
  if (!xs.length) return ""
  return xs.slice(0, max).join("; ")
}

function hoursNarrative(h: HoursBand): string {
  switch (h) {
    case "under_35":
      return "Hours look sustainable on paper—use the extra margin to install standards before volume eats it."
    case "35_45":
      return "You are at the edge of sustainable owner load; infrastructure buys you room before the next growth push."
    case "46_55":
      return "This is owner-heavy time; the plan assumes you need proof on the floor, not more heroics."
    default:
      return "Volume is extreme—sequence ruthlessly: fewer plays, finished completely, with named backups."
  }
}

function teamNarrative(t: TeamSizeBand): string {
  switch (t) {
    case "solo":
      return "With a tiny crew, redundancy is thin—document and rehearse more than a larger shop would need."
    case "2_5":
      return "Small team: every hand matters. Assign standards to named people, not to “everyone.”"
    case "6_15":
      return "Mid-size team: you can build bench strength—shift leads and module owners are realistic this quarter."
    default:
      return "Larger org: coordination risk rises—approvals and communication need explicit rails, not hallway deals."
  }
}

function seed(
  phase: 1 | 2 | 3 | 4 | 5 | 6,
  sort: number,
  key: string,
  kind: EscapePlanTaskItemKind,
  title: string,
  description: string
): GuidedEscapePlanTaskSeed {
  return {
    week_number: phase,
    task_key: key,
    title,
    description,
    sort_order: sort,
    item_kind: kind,
  }
}

/** Personalized 6-phase roadmap rows (phase stored in `week_number` for DB compatibility). */
export function buildGuidedRoadmapSeeds(intake: EscapePlanIntake): GuidedEscapePlanTaskSeed[] {
  const resp = pick(intake.responsibilities)
  const stress = pick(intake.stressPoints)
  const chaos = pick(intake.operationalChaos)
  const staff = pick(intake.staffingWeaknesses)
  const qual = pick(intake.qualityConcerns)
  const note = intake.ownerNote.trim()

  const ctx = [
    hoursNarrative(intake.hoursBand),
    teamNarrative(intake.teamSizeBand),
    resp ? `Owner concentration shows up in: ${resp}.` : "",
    stress ? `Stress signals you named: ${stress}.` : "",
    chaos ? `Operational chaos you flagged: ${chaos}.` : "",
    staff ? `Staffing gaps: ${staff}.` : "",
    qual ? `Quality concerns: ${qual}.` : "",
    note ? `Your note: ${note}` : "",
  ]
    .filter(Boolean)
    .join(" ")

  const p1: GuidedEscapePlanTaskSeed[] = [
    seed(
      1,
      0,
      "p1_milestone_three_standards",
      "milestone",
      "Milestone: three critical standards are live (opening, closing, one quality spine)",
      `${ctx} “Live” means in Standards, readable in under two minutes, and linked from Daily Execution where relevant.`
    ),
    seed(
      1,
      1,
      "p1_ops_document_nonnegotiables",
      "operational_task",
      "Operational task: document the five decisions that still text you after hours",
      "Turn each into a short standard or decision rule: trigger, owner, limit, escalation. One evening of batch writing beats thirty interruptions."
    ),
    seed(
      1,
      2,
      "p1_staff_named_owners",
      "staff_assignment",
      "Staff assignment: name primary + backup owners for cash, keys, and guest recovery",
      intake.teamSizeBand === "solo"
        ? "Even solo—write future-you and a trusted outsider as interim backups with contact order."
        : "Publish names in team channels and in Standards—no anonymous ownership."
    ),
    seed(
      1,
      3,
      "p1_std_vendor_cash_guest",
      "standard_doc",
      "Recommended standards to document",
      [
        "Vendor / ordering cutoffs and substitution rules",
        "Cash handling & safe (if applicable)",
        "Guest recovery script with comp authority limits",
        resp ? `Also cover what you listed: ${resp}.` : "",
      ]
        .filter(Boolean)
        .join(" ")
    ),
    seed(
      1,
      4,
      "p1_risk_thin_docs",
      "risk_warning",
      "Risk: undocumented judgment still routes to your phone",
      "If standards live only in your head, the team will do the right thing and still ping you—because fear beats policy."
    ),
  ]

  const p2: GuidedEscapePlanTaskSeed[] = [
    seed(
      2,
      0,
      "p2_milestone_module_proof",
      "milestone",
      "Milestone: one training module finished with sign-offs, not just views",
      "Proof = checklist or manager attestation tied to Standards—not screenshots of completed videos."
    ),
    seed(
      2,
      1,
      "p2_ops_shadow_then_solo",
      "operational_task",
      "Operational task: run shadow shifts then a supervised solo shift for your next lead",
      "Define what “good” sounds and looks like on the line before you remove yourself from the room."
    ),
    seed(
      2,
      2,
      "p2_staff_shift_lead",
      "staff_assignment",
      "Staff assignment: designate one shift lead accountable for open or close this month",
      "They own checklist completion, notes, and bottleneck logging—not “helping if they can.”"
    ),
    seed(
      2,
      3,
      "p2_std_role_ramp",
      "standard_doc",
      "Recommended standards to document",
      "Role ramp cards (first 10 shifts), tasting dial-in if product varies, and coordination between stations during peak."
    ),
    seed(
      2,
      4,
      "p2_risk_training_theater",
      "risk_warning",
      "Risk: training theater (busywork) instead of floor competence",
      "If modules do not change behavior on Saturday night, you rebuilt paperwork—not capacity."
    ),
  ]

  const p3: GuidedEscapePlanTaskSeed[] = [
    seed(
      3,
      0,
      "p3_milestone_decision_matrix",
      "milestone",
      "Milestone: decision matrix for vendor, scheduling, and guest exceptions",
      "Who can decide within what limit, and when you are actually required—written in one page."
    ),
    seed(
      3,
      1,
      "p3_ops_delegate_vendor_sched",
      "operational_task",
      "Operational task: delegate one recurring vendor or scheduling thread end-to-end",
      intake.responsibilities.some((r) => /vendor|ordering/i.test(r))
        ? "Start with ordering: pars, substitutions, and emergency contacts live in Standards."
        : "Pick the thread that eats Wednesday afternoons—move the decision rights, not just the typing."
    ),
    seed(
      3,
      2,
      "p3_staff_backup_calendar",
      "staff_assignment",
      "Staff assignment: publish a backup calendar for open/close and peak coverage",
      staff ? `Address: ${staff}` : "Name humans, not roles—two deep for each critical moment."
    ),
    seed(
      3,
      3,
      "p3_std_escalation_paths",
      "standard_doc",
      "Recommended standards to document",
      "Escalation ladder for equipment down, quality drift, and cash variance—when to act vs when to call you."
    ),
    seed(
      3,
      4,
      "p3_risk_faux_delegation",
      "risk_warning",
      "Risk: faux-delegation (they run it, you still approve every twist)",
      "If exceptions always bounce up, you did not transfer responsibility—you renamed the bottleneck."
    ),
  ]

  const p4: GuidedEscapePlanTaskSeed[] = [
    seed(
      4,
      0,
      "p4_milestone_approval_list_halved",
      "milestone",
      "Milestone: approval inventory cut by half with thresholds",
      "List what still needs you; replace half with limits, dual sign-off, or scheduled batch review."
    ),
    seed(
      4,
      1,
      "p4_ops_batch_owner_review",
      "operational_task",
      "Operational task: move owner review to a fixed weekly window (Bottlenecks + metrics, not texts)",
      "Teach the team when you will respond—emergencies excepted—and define emergency tightly."
    ),
    seed(
      4,
      2,
      "p4_staff_approver_deputy",
      "staff_assignment",
      "Staff assignment: name a deputy approver for comps, refunds, or schedule swaps inside limits",
      "Document limits in Standards and post physically if needed."
    ),
    seed(
      4,
      3,
      "p4_std_approval_policy",
      "standard_doc",
      "Recommended standards to document",
      "Approval policy card: dollar/time thresholds, documentation required, audit trail in Daily Execution notes."
    ),
    seed(
      4,
      4,
      "p4_risk_threshold_gaming",
      "risk_warning",
      "Risk: threshold gaming if limits are unclear",
      "Vague limits create politics. Rewrite until a new shift lead can apply it without interpreting your mood."
    ),
  ]

  const p5: GuidedEscapePlanTaskSeed[] = [
    seed(
      5,
      0,
      "p5_milestone_absence_rehearsal",
      "milestone",
      "Milestone: minimum half-day absence rehearsal with emergency path only",
      "You are unavailable except for defined emergencies—measure what breaks, fix one variable, repeat."
    ),
    seed(
      5,
      1,
      "p5_ops_daily_execution_audit",
      "operational_task",
      "Operational task: audit Daily Execution completion + notes for two peak weeks",
      "Look for skipped lines, late sign-offs, and patterns in Bottlenecks tied to shifts."
    ),
    seed(
      5,
      2,
      "p5_staff_peer_qa",
      "staff_assignment",
      "Staff assignment: peer QA pair for taste, plating, or service standard (rotate weekly)",
      qual ? `Directly addresses concerns you listed: ${qual}.` : "Rotating peers prevents single-point taste heroics."
    ),
    seed(
      5,
      3,
      "p5_std_peak_playbook",
      "standard_doc",
      "Recommended standards to document",
      "Peak-hour playbook: station priorities, 86 list protocol, and recovery when the line stacks."
    ),
    seed(
      5,
      4,
      "p5_risk_hidden_dependency",
      "risk_warning",
      "Risk: hidden dependency on your informal corrections",
      chaos
        ? `You flagged chaos areas: ${chaos}—rehearsals expose whether standards actually reduced them.`
        : "If quality snaps the moment you step out, standards are still decorative—tighten triggers, not speeches."
    ),
  ]

  const p6: GuidedEscapePlanTaskSeed[] = [
    seed(
      6,
      0,
      "p6_milestone_owner_hours_removed",
      "milestone",
      "Milestone: remove recurring owner hours you can name (calendar proof)",
      "Pick at least one weekly block that no longer exists on your calendar with the same outcome delivered."
    ),
    seed(
      6,
      1,
      "p6_ops_monthly_infrastructure_review",
      "operational_task",
      "Operational task: schedule a 45-minute monthly infrastructure review with your lead",
      "Standards drift, training ages, approvals creep—review the system, not the drama."
    ),
    seed(
      6,
      2,
      "p6_staff_succession_note",
      "staff_assignment",
      "Staff assignment: document succession for leads (who steps up if lead is out)",
      "Continuity is a person with a name—twice deep."
    ),
    seed(
      6,
      3,
      "p6_std_emergency_owner_path",
      "standard_doc",
      "Recommended standards to document",
      "Emergency owner path: when to call, expected response time, and what the team does until you arrive."
    ),
    seed(
      6,
      4,
      "p6_risk_over_rotating",
      "risk_warning",
      "Risk: stepping back without metrics invites silent quality slip",
      stress
        ? `Watch the stress signals you named (${stress})—pick one metric per month to prove stability.`
        : "Pair gut checks with comps, waste, and repeat complaints—calm evidence beats anxiety."
    ),
  ]

  return [...p1, ...p2, ...p3, ...p4, ...p5, ...p6]
}
