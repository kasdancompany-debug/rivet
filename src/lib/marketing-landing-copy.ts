import { COPY } from "@/lib/interface-copy"
import { RIVET_PRICING } from "@/lib/pricing-copy"
import { finalizeEscapeReadinessView } from "@/lib/escape-readiness/enrichment"
import type { EscapeReadinessView } from "@/lib/escape-readiness/types"
import {
  EMOTIONAL_PROMISE,
  PLAY_COVERAGE_LABEL,
  PRODUCT_ARC,
  PRODUCT_LOOP,
  PRODUCT_POSITIONING,
  UNDOCUMENTED_MEMORY_LABEL,
} from "@/lib/product-voice"

/** Long-form marketing landing — Rivet positioning. */
export { EMOTIONAL_PROMISE, PRODUCT_POSITIONING, PRODUCT_LOOP, PRODUCT_ARC }

export const LANDING_POSITIONING_LINE =
  "The operating memory of owner-led teams—dealerships, gyms, contractors, retail, and anyone done carrying the operation in their head."

export const LANDING_OG_TITLE = `Rivet — ${PRODUCT_POSITIONING}`

export const LANDING_META_DESCRIPTION =
  `${RIVET_PRICING.metaLine} Capture how work runs, standardize it into plays, train the team, and see what still depends on you.`

export const LANDING_HEADER_SIGN_IN = "Sign in" as const
export const LANDING_HEADER_SIGN_UP = "Sign up" as const

export const LANDING_CTA = {
  primary: RIVET_PRICING.cta,
  secondary: "Take the free Rivet Scan",
  tertiary: "See how it works",
} as const

export const LANDING_SCAN_CTA = {
  label: LANDING_CTA.secondary,
  subline: "~2 minutes · no account · see what still depends on you",
} as const

/** 1 · Hero */
export const LANDING_HERO = {
  eyebrow: "Owner-led teams",
  headline: "Get your business\nout of your head.",
  subheadline:
    "Rivet is operating memory—so the team runs the work while you stop being the default answer.",
  ctaPrimary: LANDING_CTA.primary,
  ctaSecondary: LANDING_CTA.secondary,
  ctaTertiary: LANDING_CTA.tertiary,
} as const

export const LANDING_EXISTING_WORKSPACE_CHECKOUT = {
  lead: "Already have a business in Rivet?",
  linkLabel: "Sign in to complete checkout",
  href: "/login?next=/subscribe",
} as const

/** 2 · Pain */
export const LANDING_PAIN = {
  eyebrow: "The pain",
  title: "Your phone is still the operations manual.",
  hook: "Texts, walk-ups, and “quick questions” that never stop.",
  events: [
    { time: "7:14", text: "How do I process refunds?" },
    { time: "8:42", text: "Who can approve this comp?" },
    { time: "10:13", text: "Where’s the opening checklist?" },
    { time: "11:52", text: "Can you look at this before I send it?" },
  ] as const,
} as const

/** 3 · Diagnosis */
export const LANDING_DIAGNOSIS = {
  eyebrow: "Diagnosis",
  title: "Your business still depends on you here.",
  hook: "The Rivet Scan shows owner pulls, load, and escape readiness—in one read.",
  metrics: [
    { label: "Owner pulls / week", value: "17" },
    { label: "Owner load index", value: "68" },
    { label: "Escape readiness", value: "28%" },
  ] as const,
} as const

/** 4 · Mechanism — five moves */
export const LANDING_MECHANISM = {
  eyebrow: "The mechanism",
  title: "Five moves out of your head",
  hook: "Each one reduces how much the business routes back to you.",
  steps: [
    {
      title: "Capture procedures",
      detail: "Record how work actually runs—on the line, not in a template graveyard.",
    },
    {
      title: "Train people",
      detail: "Training Center modules tied to real tasks so “trained” means something on the floor.",
    },
    {
      title: "Answer questions",
      detail: "Ask Rivet pulls answers from operating memory before staff ping you.",
    },
    {
      title: "Reduce interruptions",
      detail: "Log owner pulls until repeats stop—and Rivet suggests the play or training that fixes them.",
    },
    {
      title: "Increase owner-free capacity",
      detail: "Escape readiness tracks whether the business holds when you step back.",
    },
  ] as const,
} as const

/** 5 · Transformation */
export const LANDING_TRANSFORMATION = {
  eyebrow: "Transformation",
  title: "Before Rivet vs after Rivet",
  hook: "Same business. Less of you in the middle.",
  comparison: {
    before: { label: "Before Rivet", value: 17, unit: "owner pulls / week" },
    after: { label: "After Rivet", value: 7, unit: "owner pulls / week" },
    maxValue: 17,
  },
  estimated: {
    label: "Illustrative recovery",
    value: 260,
    unit: "owner hours / year",
  },
  beforeBullets: [
    "Procedures live in your head—and your phone",
    "Training is shadowing you on a busy day",
    "Every exception waits on your OK",
  ] as const,
  afterBullets: [
    "Plays the crew runs without calling you",
    "Training assigned before the first shift alone",
    "Pulls drop because the system got fixed",
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
      label: PLAY_COVERAGE_LABEL,
      percent: 52,
      hint: "Roughly half of critical tasks have clear plays—not enough to step away calmly.",
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
      label: UNDOCUMENTED_MEMORY_LABEL,
      percent: 44,
      hint: "Several plays still live only in your head—not in Rivet's operating memory.",
    },
  ],
})

/** 6 · Escape readiness payoff */
export const LANDING_ESCAPE_PAYOFF = {
  eyebrow: "Escape readiness",
  title: "Can your business survive without you?",
  hook: "One score for whether operating memory is strong enough to hold when you step away.",
} as const

/** 7 · Founder pricing */
export const LANDING_VALUE = {
  eyebrow: "Founder pricing",
  title: "Founder Lifetime Access",
  hook: "Pay once. Build operating memory. No subscription on your workspace.",
  limitedFounderRelease: RIVET_PRICING.limitedFounderRelease,
  productName: RIVET_PRICING.productName,
  priceOnce: RIVET_PRICING.priceOnce,
  priceInstallment: RIVET_PRICING.priceInstallment,
  included: RIVET_PRICING.included,
  ownerTimeAtRisk: {
    label: "Illustrative owner time at risk",
    value: "260 hrs",
    note: "recovered annually in the example outcome",
  },
  rivetCost: {
    label: RIVET_PRICING.productName,
    value: RIVET_PRICING.priceDisplay,
    note: RIVET_PRICING.priceOnce,
    installment: RIVET_PRICING.priceInstallment,
  },
  microcopy:
    "Owner time is the expensive line item. This buys the system that gives it back.",
} as const

export const LANDING_PRICING = {
  productName: RIVET_PRICING.productName,
  priceDisplay: RIVET_PRICING.priceDisplay,
  priceOnce: RIVET_PRICING.priceOnce,
  priceInstallment: RIVET_PRICING.priceInstallment,
  currencyLabel: RIVET_PRICING.currencyOnce,
  positioningLines: RIVET_PRICING.positioningLines,
  included: RIVET_PRICING.included,
  ctaPrimary: RIVET_PRICING.cta,
} as const

export const LANDING_FAQ_TITLE = "Questions" as const

export const LANDING_FOOTER_TRUST =
  "Built with owner-operators who were tired of being the default answer."

export const LANDING_FOOTER_TAGLINE = `Rivet — ${EMOTIONAL_PROMISE}`

/** 8 · Final CTA */
export const LANDING_FINAL_CTA = {
  title: "Take the free Rivet Scan",
  body: "See what still depends on you—before you buy anything.",
} as const

export const LANDING_FAQ = [
  {
    q: "Is this a subscription?",
    a: `No. ${RIVET_PRICING.productName} is ${RIVET_PRICING.priceOnce} ${RIVET_PRICING.priceInstallment}. ${RIVET_PRICING.included.join(" · ")}—grandfathered permanently on your workspace.`,
  },
  {
    q: "What is Rivet?",
    a: "Operating memory: procedures, training, Ask Rivet, owner pulls, and escape readiness—not payroll or POS.",
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
    "How work runs is still in your head",
    "Training not tied to real tasks",
    "No named owner on recurring decisions",
  ] as const,
  diagnosisEyebrow: "Examples",
  diagnosis: [
    { id: "PLAY", line: "Opening steps still live in memory—not in Rivet" },
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