export type GuidedPhaseNumber = 1 | 2 | 3 | 4 | 5 | 6

export type GuidedPhaseMeta = {
  phase: GuidedPhaseNumber
  title: string
  tagline: string
  intent: string
  /** Rough calendar cue — infrastructure installs on a longer arc than a single sprint. */
  cadenceLabel: string
}

export const GUIDED_ESCAPE_PHASES: GuidedPhaseMeta[] = [
  {
    phase: 1,
    title: "Capture Standards",
    tagline: "Make the bar legible where work happens.",
    intent:
      "You are installing the first layer of management infrastructure: what “good” looks like in writing, on video, and in one place the team trusts.",
    cadenceLabel: "Weeks 1–3 · foundation",
  },
  {
    phase: 2,
    title: "Train Consistency",
    tagline: "Same sequence, same proof—not tribal memory.",
    intent:
      "Infrastructure only holds if people rehearse it. This phase ties standards to named humans, sign-offs, and observable completion.",
    cadenceLabel: "Weeks 4–7 · capability",
  },
  {
    phase: 3,
    title: "Transfer Responsibility",
    tagline: "Decision rights move with the work.",
    intent:
      "Hand off ownership—not tasks. Backups, limits, and escalation paths are written so judgment does not boomerang to you by default.",
    cadenceLabel: "Weeks 8–12 · ownership shift",
  },
  {
    phase: 4,
    title: "Reduce Owner Approvals",
    tagline: "Shrink the list that waits on your signature.",
    intent:
      "Approvals are inventory. Replace implicit trust with explicit thresholds so the business can move inside guardrails you chose on purpose.",
    cadenceLabel: "Weeks 13–18 · control redesign",
  },
  {
    phase: 5,
    title: "Test Operational Stability",
    tagline: "Rehearse absence before life forces it.",
    intent:
      "Stress-test the system: controlled time away, batch review of bottlenecks, and calm reads on quality—evidence the infrastructure holds.",
    cadenceLabel: "Weeks 19–24 · proof",
  },
  {
    phase: 6,
    title: "Step Back Safely",
    tagline: "Remove hours without removing accountability.",
    intent:
      "Finalize how you stay informed without being the backstop. The business runs through standards, leads, and records—not through your pocket.",
    cadenceLabel: "Weeks 25+ · sustain",
  },
]
