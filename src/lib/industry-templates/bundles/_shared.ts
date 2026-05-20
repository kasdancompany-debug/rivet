import type {
  IndustryInterruptionWorkflowTemplate,
  IndustryIssueWorkflowTemplate,
  IndustryTrainingModuleTemplate,
} from "@/lib/industry-templates/types"

export function trainingSet(opts: {
  openId: string
  closeId: string
  qualityId: string
  onboardingId: string
  openTitle?: string
  closeTitle?: string
}): readonly IndustryTrainingModuleTemplate[] {
  return [
    {
      title: opts.openTitle ?? "Opening shift readiness",
      description: "What the first person on duty completes before customers or clients arrive.",
      assignedRole: "Shift lead",
      standardTemplateIds: [opts.openId],
    },
    {
      title: opts.closeTitle ?? "Closing & secure handoff",
      description: "Cash, secure, and notes for the next opener—no mystery close.",
      assignedRole: "Shift lead",
      standardTemplateIds: [opts.closeId],
    },
    {
      title: "Quality bar on the floor",
      description: "The standard for how work should look when you are not watching.",
      assignedRole: "Team",
      standardTemplateIds: [opts.qualityId],
    },
    {
      title: "First week on the team",
      description: "Shadow, sign-offs, and first solo shift without owner as trainer.",
      assignedRole: "New hire",
      standardTemplateIds: [opts.onboardingId],
    },
  ] as const
}

export function interruptionSet(
  vertical: string,
  extras?: Partial<IndustryInterruptionWorkflowTemplate>[]
): readonly IndustryInterruptionWorkflowTemplate[] {
  const base: IndustryInterruptionWorkflowTemplate[] = [
    {
      title: `${vertical} — approval before spend`,
      kind: "approval_request",
      summary: "Spend or comp above the posted limit",
      detail: "Use the escalation SOP: manager on shift approves first; owner only above the dollar threshold on the card.",
    },
    {
      title: `${vertical} — “what do I do?” ping`,
      kind: "staff_ping",
      summary: "Staff asks a question the SOP already answers",
      detail: "Point to the linked standard first; log the ping if the SOP needs a rewrite.",
    },
    {
      title: `${vertical} — judgment call`,
      kind: "judgment_call",
      summary: "Gray area not covered by a standard",
      detail: "Document the call, outcome, and add a draft SOP update if this repeats within 7 days.",
    },
    {
      title: `${vertical} — guest/client escalation`,
      kind: "owner_escalation",
      summary: "Recovery or complaint crossing manager authority",
      detail: "Follow guest recovery / escalation SOP; owner joins only on injury, legal, or repeat failure.",
    },
    {
      title: `${vertical} — equipment or supply down`,
      kind: "unresolved_issue",
      summary: "Blocked execution until parts, vendor, or fix",
      detail: "Open a bottleneck ticket, post fallback steps, and set a next-check time the team can see.",
    },
    {
      title: `${vertical} — schedule or coverage gap`,
      kind: "staff_ping",
      summary: "Call-out, late arrival, or thin coverage",
      detail: "Run coverage map in roles SOP; owner only if no qualified closer on the board.",
    },
    {
      title: `${vertical} — cash or paperwork variance`,
      kind: "approval_request",
      summary: "Drawer, invoice, or paperwork does not reconcile",
      detail: "Stop the line, recount with witness, log variance before continuing sales or billing.",
    },
  ]
  if (extras?.length) {
    for (let i = 0; i < extras.length && i < base.length; i++) {
      Object.assign(base[i]!, extras[i]!)
    }
  }
  return base
}

export function issueSet(vertical: string): readonly IndustryIssueWorkflowTemplate[] {
  return [
    {
      title: `${vertical} — repeat guest/client complaint`,
      category: "customer_complaint",
      severity: "high",
      description:
        "Workflow: log within 24h, assign owner (not you by default), tie to recovery SOP, close with proof of fix.",
    },
    {
      title: `${vertical} — equipment down`,
      category: "equipment",
      severity: "medium",
      description: "Workflow: fallback live, vendor ticket #, ETA communicated to floor, resolved when verified on shift.",
    },
    {
      title: `${vertical} — training gap`,
      category: "staff_question",
      severity: "medium",
      description: "Workflow: link module + standard, set completion date, verify on next audit—not another verbal-only train.",
    },
  ] as const
}
