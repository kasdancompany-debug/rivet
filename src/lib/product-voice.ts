import { RIVET_PRICING } from "@/lib/pricing-copy"

/** Core promise — hero, marketing, key moments. */
export const EMOTIONAL_PROMISE =
  "Get your business out of your head so it can run without you."

/** Canonical positioning — shells, metadata, scan intro. */
export const PRODUCT_POSITIONING = "The operating memory of the business"

/**
 * Owner loop — every major Rivet surface should reinforce these six moves.
 */
export const PRODUCT_LOOP = [
  {
    key: "capture",
    label: "Capture how work happens",
    detail: "Record how work actually runs—on the line, not in a template library.",
  },
  {
    key: "play",
    label: "Beautiful plays",
    detail: "Turn capture into runnable plays with success, failure, and proof the crew can trust.",
  },
  {
    key: "train",
    label: "Train the team",
    detail: "Training Center modules wired to real tasks so trained means something on the floor.",
  },
  {
    key: "ask",
    label: "Ask Rivet",
    detail: "Staff get answers from operating memory—without pulling you off the line.",
  },
  {
    key: "pulls",
    label: "Reduce owner pulls",
    detail: "Log what still routes to you until repeats stop and Questions prevented climb.",
  },
  {
    key: "capacity",
    label: "Owner-free capacity",
    detail: "Escape readiness and Owner-free capacity show whether the business holds when you step back.",
  },
] as const

/** @deprecated Prefer PRODUCT_LOOP — alias for existing imports. */
export const PRODUCT_ARC = PRODUCT_LOOP

export const PRODUCT_ARC_LABELS = PRODUCT_LOOP.map((step) => step.label)

export const PRODUCT_LOOP_SUMMARY = PRODUCT_LOOP.map((s) => s.label).join(" → ")

/** Owner-facing factor labels (internal ids may still say sop_*). */
export const PLAY_COVERAGE_LABEL = "Play coverage"
export const UNDOCUMENTED_MEMORY_LABEL = "Still in your head"

/** Sidebar / compact strapline. */
export const PRODUCT_SHELL_TAGLINE =
  "Operating memory—capture work, publish plays, train in the Training Center, let staff Ask Rivet, cut owner pulls, grow Owner-free capacity."

export const PRODUCT_ONE_LINER =
  "Rivet is the operating memory of your business—capture how work runs, turn it into plays, train the team in the Training Center, let staff Ask Rivet, reduce owner pulls, and grow Owner-free capacity."

export const PRODUCT_VALUE_LINE =
  "Stop being human middleware between what you meant and what happened on the floor."

export const MARKETING_COPY = {
  eyebrow: "Owner-operated businesses",
  proofLine: "For owners who are tired of being the default answer—not another rented dashboard.",
  ctaPrimary: RIVET_PRICING.cta,
  ctaSecondary: "Sign in",
} as const
