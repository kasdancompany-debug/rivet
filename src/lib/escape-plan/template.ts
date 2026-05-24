import type { TablesInsert } from "@/types/database"

export type EscapePlanWeekTemplate = {
  weekNumber: 1 | 2 | 3 | 4
  theme: string
  /** Transformation narrative — not task copy. */
  intent: string
}

export const ESCAPE_PLAN_WEEK_META: EscapePlanWeekTemplate[] = [
  {
    weekNumber: 1,
    theme: "Capture what only you carry",
    intent:
      "What only you know has to live somewhere the team can rehearse. This week is about clear artifacts—written, filmed, and stored where work happens.",
  },
  {
    weekNumber: 2,
    theme: "Train backups",
    intent:
      "Continuity is a person with a name. Choose who stands in when you are unavailable, and make the path legible before pressure arrives.",
  },
  {
    weekNumber: 3,
    theme: "Rehearse stepping back",
    intent:
      "A controlled rehearsal beats a surprise crisis. Short absences reveal where standards still route to your inbox.",
  },
  {
    weekNumber: 4,
    theme: "Remove recurring owner hours",
    intent:
      "Pull one recurring thread out of your hands for good. Measure calmly—this is load transfer, not a disappearance.",
  },
]

export type EscapePlanTaskSeed = Omit<
  TablesInsert<"owner_escape_plan_tasks">,
  "plan_id" | "id" | "created_at" | "notes" | "completed_at" | "completed_by"
>

/** Default roadmap rows (insert after plan exists). */
export function defaultEscapePlanTaskSeeds(): EscapePlanTaskSeed[] {
  return [
    {
      week_number: 1,
      task_key: "w1_sop_three",
      title: "Document three critical SOPs",
      description:
        "Pick the three moments that still stop the day if you vanish—often cash, food safety, and a signature customer promise. Ship them lean: steps, photos, who signs off.",
      sort_order: 0,
    },
    {
      week_number: 1,
      task_key: "w1_videos",
      title: "Record short videos for opening, closing, and product quality",
      description:
        "Five minutes each beats a perfect hour. Talk through the non-negotiables while you actually do the work once. Store where the team already looks.",
      sort_order: 1,
    },
    {
      week_number: 1,
      task_key: "w1_owner_only",
      title: "Name what still waits on you alone",
      description:
        "List what still waits on you by name—approvals, vendor texts, taste calls. You cannot delegate what you have not labeled.",
      sort_order: 2,
    },
    {
      week_number: 2,
      task_key: "w2_assign_sops",
      title: "Assign SOPs to specific employees",
      description:
        "Each critical SOP gets a primary and a backup owner on paper. No more “everyone knows” when pressure hits.",
      sort_order: 0,
    },
    {
      week_number: 2,
      task_key: "w2_shift_lead",
      title: "Choose one future shift lead",
      description:
        "Pick someone who already models standards—not just tenure. Tell them why, and what “good” looks like in 90 days.",
      sort_order: 1,
    },
    {
      week_number: 2,
      task_key: "w2_first_module",
      title: "Complete the first training module as a team standard",
      description:
        "Finish one module end-to-end with sign-offs, not just videos watched. Proof matters more than coverage.",
      sort_order: 2,
    },
    {
      week_number: 3,
      task_key: "w3_step_away",
      title: "Step away for two hours on purpose",
      description:
        "Stay reachable only for true emergencies—define that word in advance. Let the floor own ordinary decisions.",
      sort_order: 0,
    },
    {
      week_number: 3,
      task_key: "w3_checklist",
      title: "Staff completes the daily checklist without your prompts",
      description:
        "The checklist is the spine. If it needs your voice to start, tighten the list, not the people.",
      sort_order: 1,
    },
    {
      week_number: 3,
      task_key: "w3_issues_not_texts",
      title: "Things still chasing you are logged in the system instead of texted to you",
      description:
        "Channel interruptions into a queue the team can see and close. You review in batch, not in real time.",
      sort_order: 2,
    },
    {
      week_number: 4,
      task_key: "w4_remove_duty",
      title: "Remove one recurring duty from your calendar",
      description:
        "Pick something weekly that still has your fingerprints—ordering, scheduling, deposits—and hand the decision rights, not just the labor.",
      sort_order: 0,
    },
    {
      week_number: 4,
      task_key: "w4_shift_lead_shift",
      title: "Shift lead handles one full opening or closing",
      description:
        "They own the keys, the closeout, and the exceptions. You are available only if they invoke the emergency path you wrote in Week 1.",
      sort_order: 1,
    },
    {
      week_number: 4,
      task_key: "w4_review_impact",
      title: "Review quality and sales impact calmly",
      description:
        "Look at waste, remakes, and comp patterns—not vibes. Adjust one variable next month instead of reclaiming the wheel.",
      sort_order: 2,
    },
  ]
}
