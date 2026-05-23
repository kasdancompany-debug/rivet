import { finalizeEscapeReadinessView } from "@/lib/escape-readiness/enrichment"
import type { EscapeReadinessView } from "@/lib/escape-readiness/types"
import { EMOTIONAL_PROMISE } from "@/lib/product-voice"

/** Long-form marketing landing — Rivet positioning. */
export { EMOTIONAL_PROMISE }

export const LANDING_POSITIONING_LINE =
  "For dealerships, gyms, contractors, retail, and owner-led teams who are done carrying the operation in their head."

export const LANDING_OG_TITLE = `Rivet — ${EMOTIONAL_PROMISE}`

export const LANDING_META_DESCRIPTION =
  "$799 CAD once. Document procedures, track training, log owner interruptions, and see if your business can run without you. No monthly subscription."

export const LANDING_HEADER_SIGN_IN = "Sign in" as const

export const LANDING_CTA = {
  primary: "Get Rivet",
  secondary: "Take Free Scan",
  tertiary: "View Layers",
} as const

/** Free diagnostic — secondary CTA; not a substitute for the paid license. */
export const LANDING_SCAN_CTA = {
  label: LANDING_CTA.secondary,
  subline: "Owner Dependency Score · about 2 minutes · no account",
} as const

export const LANDING_HERO = {
  eyebrow: "For owner-operators",
  headline: "Get your business\nout of your head.",
  subheadline:
    "Write down how work actually runs, track training gaps, log owner interruptions, and see whether the team could hold a week without you on the phone.",
  ctaPrimary: LANDING_CTA.primary,
  ctaSecondary: LANDING_CTA.secondary,
  ctaTertiary: LANDING_CTA.tertiary,
  trustChips: ["$799 CAD once", "No monthly subscription", "Lifetime access"] as const,
} as const

/** Existing accounts: sign in first, then Stripe Checkout on `/subscribe`. */
export const LANDING_EXISTING_WORKSPACE_CHECKOUT = {
  lead: "Already have a workspace?",
  linkLabel: "Sign in to complete checkout",
  href: "/login?next=/subscribe",
} as const

/** Week-in-the-life narrative — owner interruptions, not abstract “signals.” */
export const LANDING_OWNER_SPINE = {
  eyebrow: "A typical week",
  title: "Your phone is still the operations manual.",
  subtitle: "When answers live in your head, the same questions and fires find you every day.",
  events: [
    { time: "7:14 AM", text: "Where is the onboarding checklist?" },
    { time: "8:42 AM", text: "Did the estimate get sent?" },
    { time: "10:13 AM", text: "Who owns this task?" },
    { time: "11:52 AM", text: "Client follow-up overdue" },
  ] as const,
  statLine: "17 owner pulls logged this week",
  statDelta: "Same themes repeat when nothing is written down",
  traceTitle: "Usually because",
  traces: [
    "Procedures not written (or not findable)",
    "Training not tied to real tasks",
    "No named owner on recurring decisions",
  ] as const,
  diagnosisEyebrow: "Examples",
  diagnosis: [
    { id: "SOP", line: "Opening steps still live in memory—not in Rivet" },
    { id: "TRN", line: "New hire shadowing you instead of a module" },
    { id: "OWN", line: "Key decisions still wait on your OK" },
  ] as const,
  footnote: "Illustrative week · anonymized",
} as const

export const LANDING_YOU_FEEL_THIS = {
  eyebrow: "Sound familiar?",
  title: "If this is your week, you are not alone.",
  cards: [
    "Staff ask you the same questions every week",
    "Training happens when you have time—not on paper",
    "You cannot leave without the phone lighting up",
  ],
} as const

/** What v1 actually ships — five pillars aligned to product scope. */
export const LANDING_INSTALLS = {
  title: "What $799 puts in your workspace",
  lead: "Five tools owners use in week one—no separate checklist app, no mystery dashboards.",
  pillars: [
    {
      title: "Written procedures (SOPs)",
      sentence:
        "Capture and edit how open, close, and daily work actually run—so the team reads the same steps, not your memory.",
    },
    {
      title: "Owner interruption log",
      sentence:
        "Record when the team pulls you in—kind, minutes, pattern—so you see what still routes through you each week.",
    },
    {
      title: "Training tied to your SOPs",
      sentence:
        "Build modules linked to real procedures and track who has completed them—not a binder nobody opens under pressure.",
    },
    {
      title: "Bottlenecks (issues)",
      sentence:
        "Log what still hunts you, who owns it, and what is open—instead of recycling the same texts.",
    },
    {
      title: "Escape readiness + overview",
      sentence:
        "One score for “could this run a week without me?” plus an owner overview: interruptions, missing procedures, training gaps.",
    },
  ],
} as const

/** Illustrative owner overview metrics for marketing — not live workspace data. */
export const LANDING_WORKSPACE_SNAPSHOT = {
  title: "Inside a Rivet workspace",
  disclaimer: "Illustrative workspace for demonstration",
  workspaceLabel: "Workspace · Oak Ridge",
  metrics: [
    { id: "sops", label: "SOPs", value: "142" },
    { id: "training", label: "Training completion", value: "81%" },
    { id: "bottlenecks", label: "Open bottlenecks", value: "6" },
    { id: "interrupts", label: "Owner interruptions/week", value: "12" },
    { id: "escape", label: "Escape readiness score", value: "72%" },
  ],
} as const

/** Illustrative escape readiness for marketing (not live workspace data). */
export const LANDING_ESCAPE_READINESS_DEMO: EscapeReadinessView = finalizeEscapeReadinessView({
  score: 41,
  band: "fragile",
  verdict:
    "Five days away would stress the business: documentation, issues, and interrupts still route through you.",
  demo: true,
  progress: [
    { date: "2026-05-01", score: 34 },
    { date: "2026-05-04", score: 36 },
    { date: "2026-05-07", score: 38 },
    { date: "2026-05-10", score: 39 },
    { date: "2026-05-13", score: 40 },
    { date: "2026-05-16", score: 41 },
  ],
  factors: [
    {
      id: "sop_coverage",
      label: "SOP coverage",
      percent: 52,
      hint: "Roughly half of critical tasks have clear written steps—not enough to step away calmly.",
    },
    {
      id: "training_coverage",
      label: "Training coverage",
      percent: 61,
      hint: "Some modules done; several roles still depend on you showing them in person.",
    },
    {
      id: "unresolved_issues",
      label: "Unresolved issues",
      percent: 38,
      hint: "Open issues still default to you when something goes wrong.",
    },
    {
      id: "owner_interruptions",
      label: "Owner interruptions",
      percent: 32,
      hint: "Texts and walk-ups still spike every week you try to step back.",
    },
    {
      id: "undocumented_procedures",
      label: "Undocumented procedures",
      percent: 44,
      hint: "Several plays still live only in your head—not written down in Rivet.",
    },
  ],
})

export const LANDING_RESULTS = {
  eyebrow: "Results",
  title: "What $799 is buying—in plain numbers",
  lead: "Not a testimonial. A worked example of what changes when procedures, training, and interrupts are on the record instead of in your head.",
  exampleBadge: "Example outcome",
  patternNote: "Based on common owner-operated business patterns",
  scenario: "Illustrative · owner-led team · ~12 people · first 90 days with Rivet",
  beforeRivet: {
    heading: "Before Rivet",
    summary: "You are the system. Everyone routes judgment through you.",
    items: [
      "22 owner interruptions per week (texts, calls, walk-ups)",
      "Training lived in memory—same lessons repeated every hire",
      "Procedures changed by whoever was working that day",
    ],
  },
  afterRivet: {
    heading: "After Rivet",
    summary: "The team has a source of truth. You see load before it becomes another fire.",
    items: [
      "7 owner interruptions per week (logged, so you can see the trend)",
      "SOPs visible where staff actually work",
      "Staff training tracked against real procedures",
      "Repeat issues logged with an owner—not recycled in chat",
    ],
  },
  financial: {
    heading: "Example math (not a guarantee)",
    steps: [
      "15 fewer owner interruptions per week in this example",
      "~12 minutes each to answer, decide, or fix on the spot",
      "≈ 3 owner hours per week back (15 × 12 min)",
      "× 50 working weeks × $50/hr owner-equivalent (example rate)",
    ],
    annualExampleLabel: "Illustrative annual owner time at risk",
    annualExampleAmount: "$7,500",
    licenseLabel: "Rivet license",
    licenseAmount: "$799",
    licenseNote: "CAD · one-time · no monthly subscription",
    punchline:
      "If logging and documenting work pulls even a fraction of that time off your plate, the license is not the expensive line item—the interrupts are.",
  },
  disclaimer:
    "Example outcome only. Not a customer case study. Your workspace tracks your real interruption count, training completion, and escape readiness after install.",
} as const

export const LANDING_BEFORE_AFTER = {
  eyebrow: "Before and after",
  title: "From memory to something the team can run",
  before: [
    "Quality depends on who showed up and what you remembered to say",
    "The same questions hit your phone every day",
    "Training is “watch me” until it sticks",
  ],
  after: [
    "Procedures live where staff can read them",
    "Interruptions and bottlenecks are logged with owners",
    "Training modules link to the work you actually run",
  ],
} as const

export const LANDING_PRICING = {
  cardTitle: "What $799 gets you",
  priceDisplay: "$799",
  currencyLabel: "CAD · one-time",
  installmentLine: null as string | null,
  includes: [
    "Unlimited SOPs + standards capture",
    "Owner interruption tracking",
    "Training modules & progress",
    "Industry starter templates",
    "Escape readiness score",
    "Owner overview (Rivet Index)",
    "One year of updates",
    "Lifetime access",
  ],
  paysForItselfHeading: "Pays for itself if it saves:",
  paysForItselfItems: [
    "four owner hours a month",
    "one retraining cycle you do not repeat",
    "one expensive mistake you avoid",
  ],
  microcopy: "One payment. Full workspace. No monthly subscription.",
  ctaPrimary: LANDING_CTA.primary,
} as const

export const LANDING_PRICING_SECTION = {
  eyebrow: "Pricing",
  title: "$799 once. Everything in v1—no monthly fee.",
} as const

export const LANDING_FAQ_TITLE = "Questions" as const

export const LANDING_FOOTER_TRUST =
  "Built with owner-operators who were tired of being the default answer."

export const LANDING_FOOTER_TAGLINE =
  "Rivet — get your business out of your head."

export const LANDING_FINAL_CTA = {
  title: "Stop carrying the operation in your head.",
  body: "Document it once. Train against it. See if the business can run without you on the phone.",
} as const

export const LANDING_FAQ = [
  {
    q: "Is this a subscription?",
    a: "No. One payment in CAD. Lifetime access to your workspace, with one year of product updates included.",
  },
  {
    q: "What is Rivet—not payroll or POS?",
    a: "It is how you document work, train the team, log owner interruptions, and track bottlenecks. Payrolls and tickets stay in your other tools.",
  },
  {
    q: "Is there a staff mobile app?",
    a: "v1 is a web workspace for the owner (and team leads you invite). There is no separate daily checklist app in this release.",
  },
  {
    q: "Why $799?",
    a: "Because staying the default answer is expensive. This buys a durable workspace for procedures, training, and owner-load—not another tab you cancel.",
  },
] as const
