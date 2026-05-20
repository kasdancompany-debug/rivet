import { EMOTIONAL_PROMISE } from "@/lib/product-voice"

/** Long-form marketing landing — Rivet positioning. */
export { EMOTIONAL_PROMISE }

export const LANDING_POSITIONING_LINE =
  "Built for live-service and owner-led floors—not another login you forget."

export const LANDING_OG_TITLE = `Rivet — ${EMOTIONAL_PROMISE}`

export const LANDING_META_DESCRIPTION =
  "$799 CAD once. Operational infrastructure for teams still running on founder memory. No subscription."

export const LANDING_HEADER_SIGN_IN = "Sign in" as const

export const LANDING_CTA = {
  primary: "Get Rivet",
  secondary: "View layers",
} as const

/** Free diagnostic — linked from hero + pricing; not a substitute for the paid install CTA. */
export const LANDING_SCAN_CTA = {
  label: "Run the free Rivet Scan",
  subline: "Get your Owner Dependency Score and what it is costing you per year—in two minutes.",
} as const

export const LANDING_HERO = {
  eyebrow: "Operations · Rivet",
  headline: "If every answer still routes through you,\nthe business is not transferable yet.",
  subheadline:
    "Rivet installs structure the floor can hold—standards, execution proof, and dependency reads without hunting you for the missing line.",
  ctaPrimary: LANDING_CTA.primary,
  ctaSecondary: LANDING_CTA.secondary,
  trustChips: ["$799 CAD once", "No monthly subscription", "Lifetime access"] as const,
} as const

/** Existing accounts: sign in first, then Stripe Checkout on `/subscribe`. */
export const LANDING_EXISTING_WORKSPACE_CHECKOUT = {
  lead: "Already have a workspace?",
  linkLabel: "Sign in to complete checkout",
  href: "/login?next=/subscribe",
} as const

/** Single dark-band narrative: spine + compact diagnosis (no second section). */
export const LANDING_OWNER_SPINE = {
  eyebrow: "Signal · 7d window",
  title: "The week is not busy. You are the router.",
  subtitle: "Noise becomes legible when the spine is visible.",
  events: [
    { time: "7:14 AM", text: "Where is the prep list?" },
    { time: "8:42 AM", text: "Can we comp this?" },
    { time: "10:13 AM", text: "Who closes tonight?" },
    { time: "11:52 AM", text: "Fridge temp seems high" },
  ] as const,
  statLine: "17 owner pings this week",
  statDelta: "↑ 32% week over week",
  traceTitle: "Most consolidate to",
  traces: ["Gaps in published plays", "Unsigned certifications", "Unnamed owners on records"] as const,
  diagnosisEyebrow: "Trace · same window",
  diagnosis: [
    { id: "ISS-218", line: "Prep publish timing → no open play on file" },
    { id: "ISS-229", line: "Module #ESP-01 → attestation gate open" },
    { id: "ISS-241", line: "Waste line → no named closer owner" },
  ] as const,
  footnote: "Illustrative · anonymized",
} as const

export const LANDING_YOU_FEEL_THIS = {
  eyebrow: "Field signal",
  title: "If this is your week, you are not alone.",
  cards: [
    "The same questions recycle every shift",
    "Training lives in memory, not records",
    "Work still finds your phone first",
  ],
} as const

/** Operational layers — not “features.” */
export const LANDING_INSTALLS = {
  title: "What $799 installs.",
  lead: "Five layers. One purchase. Structure your team can run.",
  pillars: [
    {
      title: "Standards your team can run",
      sentence: "Plays for open, close, and service—short enough to follow when the line is hot.",
    },
    {
      title: "Daily execution proof",
      sentence: "Shift lines with names and timestamps—gaps show before the guest does.",
    },
    {
      title: "Training tied to real work",
      sentence: "Modules anchored to the procedures you run—not a binder nobody opens under pressure.",
    },
    {
      title: "Bottleneck tracking",
      sentence: "What still hunts you gets logged, owned, and cleared—instead of recycling as texts.",
    },
    {
      title: "Rivet Index",
      sentence: "One read on whether the place can hold a week without you in the building.",
    },
  ],
} as const

/** Illustrative escape readiness for marketing (not live workspace data). */
export const LANDING_ESCAPE_READINESS_DEMO = {
  headlineQuestion: "Can your business survive if you disappear for a week?",
  score: 41,
  band: "fragile" as const,
  verdict:
    "A week away would stress the business: critical paths and staffing depth are still thin.",
  demo: true,
  factors: [
    {
      id: "procedures" as const,
      label: "Procedures complete",
      percent: 52,
      hint: "Documentation depth averages 52% across active plays—several load-bearing tasks still lack steps.",
    },
    {
      id: "training" as const,
      label: "Training coverage",
      percent: 61,
      hint: "Average module completion is about 61%—not enough backup before you step away.",
    },
    {
      id: "owner_dependencies" as const,
      label: "Critical owner dependencies",
      percent: 38,
      hint: "3 high–owner-dependency plays still lack runnable steps; 4 issues still need you.",
    },
    {
      id: "staffing" as const,
      label: "Staffing risk",
      percent: 44,
      hint: "2 teammates not cleared to open alone—first call-out puts the week back on your phone.",
    },
  ],
}

export const LANDING_RESULTS = {
  eyebrow: "Results",
  title: "Measurable outcomes owners actually track",
  lead: "Not vanity dashboards—four numbers that move when plays, teaching, and interrupts get structured on the floor.",
  scenario: "Example · neighbourhood café · 14 staff · 90 days after install",
  beforeCard: {
    heading: "Before",
    snapshot: "You are the default answer. Training happens when someone is free—and standards live in your head.",
  },
  afterCard: {
    heading: "After",
    snapshot: "The floor runs the plays. You see gaps in the index before they become another week on your phone.",
  },
  deltaHeading: "Typical shift",
  metrics: [
    {
      id: "interrupts",
      label: "Owner interruptions",
      hint: "Logged pulls per week",
      unit: "count" as const,
      before: 42,
      after: 12,
      deltaLabel: "−71%",
      deltaDirection: "down" as const,
    },
    {
      id: "training_time",
      label: "Training time",
      hint: "Owner hours teaching per week",
      unit: "hours" as const,
      before: 11,
      after: 3,
      deltaLabel: "−8 hrs",
      deltaDirection: "down" as const,
    },
    {
      id: "procedures",
      label: "Procedures documented",
      hint: "Critical floor tasks with published steps",
      unit: "fraction" as const,
      before: { of: 9, total: 28 },
      after: { of: 26, total: 28 },
      deltaLabel: "+17 plays",
      deltaDirection: "up" as const,
    },
    {
      id: "consistency",
      label: "Consistency score",
      hint: "Rivet execution + standards depth composite",
      unit: "percent" as const,
      before: 58,
      after: 87,
      deltaLabel: "+29 pts",
      deltaDirection: "up" as const,
    },
  ],
  disclaimer:
    "Illustrative composite from operator interviews and early installs—not a guarantee. Your Rivet Index and pulse metrics update from your workspace once you are live.",
} as const

export const LANDING_BEFORE_AFTER = {
  eyebrow: "Operational state",
  title: "Before vs. after",
  before: [
    "Quality follows whoever showed up that day",
    "Judgment calls still land in your texts",
    "Training depends on who is teaching",
  ],
  after: [
    "Plays live where the team can read them",
    "Exceptions become owned tickets with receipts",
    "Modules lock to the procedures you publish",
  ],
} as const

export const LANDING_PRICING = {
  cardTitle: "What $799 gets you",
  priceDisplay: "$799",
  currencyLabel: "CAD · one-time",
  installmentLine: "Or 3 payments of $299 CAD.",
  includes: [
    "Unlimited SOPs",
    "Staff training",
    "Owner interruption tracking",
    "Industry templates",
    "Escape plan score",
    "One year updates",
    "Lifetime access",
  ],
  paysForItselfHeading: "Pays for itself if it saves:",
  paysForItselfItems: [
    "4 owner hours/month",
    "one employee retraining cycle",
    "one major mistake",
  ],
  microcopy: "Buy once. No subscription on your playbook.",
  ctaPrimary: LANDING_CTA.primary,
} as const

export const LANDING_PRICING_SECTION = {
  eyebrow: "Pricing",
  title: "$799 once. Everything your floor needs to run without you in the loop.",
} as const

export const LANDING_FAQ_TITLE = "Technical questions" as const

export const LANDING_FOOTER_TRUST =
  "Built from owner-led floors. Designed for live pressure—opens, closes, drift."

export const LANDING_FOOTER_TAGLINE =
  "Rivet — operational infrastructure. Not another rented dashboard."

export const LANDING_FINAL_CTA = {
  title: "Install the bar. Prove the shifts.",
  body: "Rivet reinforces the operation when the structure is visible.",
} as const

export const LANDING_FAQ = [
  {
    q: "Is this a subscription?",
    a: "No. One payment in CAD, lifetime access, one year of updates included.",
  },
  {
    q: "What is Rivet—not payroll or POS?",
    a: "It is how work gets done: plays, proof, training, bottlenecks. Pay and tickets live elsewhere.",
  },
  {
    q: "Why $799?",
    a: "Because inconsistency and single-point failure are expensive. This buys a durable way to transfer load—with receipts—not another tab you cancel.",
  },
] as const
