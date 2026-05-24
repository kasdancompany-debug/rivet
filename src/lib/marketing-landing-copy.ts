import { COPY } from "@/lib/interface-copy"
import { finalizeEscapeReadinessView } from "@/lib/escape-readiness/enrichment"
import type { EscapeReadinessView } from "@/lib/escape-readiness/types"
import { EMOTIONAL_PROMISE } from "@/lib/product-voice"

/** Long-form marketing landing — Rivet positioning. */
export { EMOTIONAL_PROMISE }

export const LANDING_POSITIONING_LINE =
  "For dealerships, gyms, contractors, retail, and owner-led teams who are done carrying the operation in their head."

export const LANDING_OG_TITLE = `Rivet — ${EMOTIONAL_PROMISE}`

export const LANDING_META_DESCRIPTION =
  "$799 CAD once. Document procedures, train the team, log what routes back to you, and see if the business can run without you."

export const LANDING_HEADER_SIGN_IN = "Sign in" as const

export const LANDING_CTA = {
  primary: "Get Rivet",
  secondary: "Take Free Scan",
  tertiary: "How it works",
} as const

export const LANDING_SCAN_CTA = {
  label: LANDING_CTA.secondary,
  subline: "Owner Dependency Score · ~2 min · no account",
} as const

/** 1 · Hero */
export const LANDING_HERO = {
  eyebrow: "For owner-operators",
  headline: "Get your business\nout of your head.",
  subheadline: "Document how work runs, train against it, and see whether the team could hold a week without you.",
  ctaPrimary: LANDING_CTA.primary,
  ctaSecondary: LANDING_CTA.secondary,
  ctaTertiary: LANDING_CTA.tertiary,
} as const

export const LANDING_EXISTING_WORKSPACE_CHECKOUT = {
  lead: "Already have a workspace?",
  linkLabel: "Sign in to complete checkout",
  href: "/login?next=/subscribe",
} as const

/** 2 · Pain */
export const LANDING_PAIN = {
  eyebrow: "The problem",
  title: "Your phone is still the operations manual.",
  hook: "Same questions. Same fires. Every week.",
  events: [
    { time: "7:14 AM", text: "Where is the onboarding checklist?" },
    { time: "8:42 AM", text: "Did the estimate get sent?" },
    { time: "10:13 AM", text: "Who owns this task?" },
    { time: "11:52 AM", text: "Client follow-up overdue" },
  ] as const,
} as const

/** 3 · Diagnosis */
export const LANDING_DIAGNOSIS = {
  eyebrow: "Diagnosis",
  title: "See how owner-dependent you really are.",
  hook: "Rivet turns gut feel into numbers you can act on.",
  metrics: [
    { label: "Owner pulls / week", value: "17" },
    { label: "Owner load index", value: "68" },
    { label: "Escape readiness", value: "28%" },
  ] as const,
} as const

/** 4 · Mechanism */
export const LANDING_MECHANISM = {
  eyebrow: "The mechanism",
  title: "How Rivet works",
  hook: "Four moves—from memory to a business the team can run.",
  steps: [
    { title: "Capture procedures", detail: "Write how work actually runs." },
    { title: "Train people", detail: "Link modules to real tasks." },
    { title: "Track interruptions", detail: "Log what still routes to you." },
    { title: "Measure escape readiness", detail: "One score for five days away." },
  ] as const,
} as const

/** 5 · Transformation */
export const LANDING_TRANSFORMATION = {
  eyebrow: "Transformation",
  title: "Before Rivet vs After Rivet",
  hook: "Less routing through you—not less ambition.",
  comparison: {
    before: { label: "Before", value: 17, unit: "interruptions/week" },
    after: { label: "After", value: 7, unit: "interruptions/week" },
    maxValue: 17,
  },
  estimated: {
    label: "Estimated",
    value: 260,
    unit: "owner hours recovered annually",
  },
  beforeBullets: [
    "Judgment lives in your head",
    "Training is “watch me”",
    "Same texts every week",
  ] as const,
  afterBullets: [
    "Procedures staff can read",
    "Training tied to real work",
    "Interruptions logged and owned",
  ] as const,
  disclaimer: "Illustrative example · not a customer case study",
} as const

/** Illustrative escape readiness for marketing (not live workspace data). */
export const LANDING_ESCAPE_READINESS_DEMO: EscapeReadinessView = finalizeEscapeReadinessView({
  score: 73,
  band: "building",
  verdict: "Building momentum. Five-day absence is the bar Rivet scores against.",
  demo: true,
  riskContext: {
    ownerInterruptionsThisWeekCount: 12,
    openIssuesCount: 6,
  },
  progress: [
    { date: "2026-05-01", score: 58 },
    { date: "2026-05-04", score: 62 },
    { date: "2026-05-07", score: 65 },
    { date: "2026-05-10", score: 68 },
    { date: "2026-05-13", score: 71 },
    { date: "2026-05-16", score: 73 },
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
      label: COPY.interruptions.featureTitle,
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

/** 6 · Escape readiness payoff */
export const LANDING_ESCAPE_PAYOFF = {
  eyebrow: "Escape readiness",
  title: "Could you step away for five days?",
  hook: "One score that tells you if the business holds without you on the phone.",
} as const

/** 7 · Price / value */
export const LANDING_VALUE = {
  eyebrow: "Price / value",
  title: "Owner time is the expensive line item.",
  hook: "One payment vs a year of interruptions.",
  ownerTimeAtRisk: {
    label: "Illustrative owner time at risk",
    value: "260 hrs",
    note: "recovered annually in the example outcome",
  },
  rivetCost: {
    label: "Rivet license",
    value: "$799",
    note: "CAD · one-time · no monthly subscription",
  },
  microcopy: "If Rivet pulls even a fraction of that time off your plate, the license is not the expensive line item.",
} as const

export const LANDING_PRICING = {
  priceDisplay: "$799",
  currencyLabel: "CAD · one-time",
  ctaPrimary: LANDING_CTA.primary,
} as const

export const LANDING_FAQ_TITLE = "Questions" as const

export const LANDING_FOOTER_TRUST =
  "Built with owner-operators who were tired of being the default answer."

export const LANDING_FOOTER_TAGLINE =
  "Rivet — get your business out of your head."

/** 8 · Final CTA */
export const LANDING_FINAL_CTA = {
  title: "Get your business out of your head.",
  body: "Document it once. See if the team can run without you.",
} as const

export const LANDING_FAQ = [
  {
    q: "Is this a subscription?",
    a: "No. One payment in CAD. Lifetime access, with one year of product updates included.",
  },
  {
    q: "What is Rivet—not payroll or POS?",
    a: "How you document work, train the team, log owner pulls, and track bottlenecks. Your other tools stay where they are.",
  },
  {
    q: "Is there a staff mobile app?",
    a: "v1 is a web workspace for the owner and team leads you invite.",
  },
  {
    q: "Why $799?",
    a: "Staying the default answer is expensive. This buys a durable workspace—not another tab you cancel.",
  },
] as const

/** @deprecated Use narrative sections — kept for legacy imports. */
export const LANDING_OWNER_SPINE = {
  eyebrow: LANDING_PAIN.eyebrow,
  title: LANDING_PAIN.title,
  subtitle: LANDING_PAIN.hook,
  events: LANDING_PAIN.events,
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
  title: LANDING_PAIN.title,
  cards: [
    "Staff ask you the same questions every week",
    "Training happens when you have time—not on paper",
    "You cannot leave without the phone lighting up",
  ] as const,
} as const

export const LANDING_INSTALLS = {
  title: "What's included",
  items: LANDING_MECHANISM.steps.map((s) => s.title),
} as const

export const LANDING_WORKSPACE_SNAPSHOT = {
  title: LANDING_MECHANISM.title,
  bullets: LANDING_MECHANISM.steps.map((s) => s.title),
} as const

export const LANDING_RESULTS = {
  eyebrow: LANDING_TRANSFORMATION.eyebrow,
  title: LANDING_TRANSFORMATION.title,
  comparison: LANDING_TRANSFORMATION.comparison,
  estimated: LANDING_TRANSFORMATION.estimated,
  disclaimer: LANDING_TRANSFORMATION.disclaimer,
} as const

export const LANDING_BEFORE_AFTER = {
  eyebrow: LANDING_TRANSFORMATION.eyebrow,
  title: LANDING_TRANSFORMATION.title,
  before: LANDING_TRANSFORMATION.beforeBullets,
  after: LANDING_TRANSFORMATION.afterBullets,
} as const

export const LANDING_PRICING_SECTION = {
  eyebrow: LANDING_VALUE.eyebrow,
  title: LANDING_VALUE.title,
} as const
