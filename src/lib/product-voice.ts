/** Core promise — hero, marketing, key moments. */
export const EMOTIONAL_PROMISE = "Get your business out of your head."

/** Canonical positioning — shells, metadata. */
export const PRODUCT_ONE_LINER =
  "Rivet helps owner-led businesses document how work runs, train the team, and log what still pulls you back—so the place can hold without you as the default answer."

/** Sidebar / compact strapline. */
export const PRODUCT_SHELL_TAGLINE =
  "Procedures, training, and owner-load in one calm workspace—not another dashboard you cancel."

export const PRODUCT_VALUE_LINE =
  "Write down what only you know, assign training to real work, and see whether the business could run a week without you on the phone."

/** Legacy dashboard strings — prefer `COPY` from `@/lib/interface-copy` in new UI. */
export const DASHBOARD_COPY = {
  heroEyebrow: "Overview",
  heroTitle: "Can the business run without you?",
  heroBody:
    "What still routes back to you, missing procedures, training, open issues, escape readiness, and your Rivet Score—in plain numbers.",
  operatingPrompt:
    "If you disappeared for a week, could open, close, quality, and judgment calls still hold—or would your phone become the schedule?",
  metricsAriaLabel: "Overview metrics",
  ownerWeekTitle: "What pulled you in this week",
  ownerWeekLead:
    "Each line is something the team could not finish without your sign-off. Shorten this list and the shop gets calmer—not busier.",
  risksTitle: "Where load still stacks on you",
  risksLead:
    "Missing procedures, unfinished training, exceptions only you can clear—these are what keep a place from growing past your calendar.",
  nextMoveFoot:
    "One lever, finished, then come back. Slow reinforcement beats another half-built push.",
} as const

export const MARKETING_COPY = {
  eyebrow: "Owner-operated businesses",
  proofLine: "For owners who are tired of being the default answer—not another rented dashboard.",
  ctaPrimary: "Get Rivet",
  ctaSecondary: "Sign in",
} as const
