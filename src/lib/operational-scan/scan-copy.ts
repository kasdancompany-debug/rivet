import { RIVET_PRICING } from "@/lib/pricing-copy"
import { EMOTIONAL_PROMISE, PRODUCT_POSITIONING } from "@/lib/product-voice"

/** Rivet Scan — marketing & UX copy (urgency + conversion). */

export const SCAN_INTRO = {
  eyebrow: "Free · 2 minutes",
  headline: "How much of your business is still in your head?",
  subhead:
    "Eight honest questions. Rivet reads how fused you are to the operation—what is leaking hours, and the first captures that actually move the needle.",
  cta: "Start the read",
  footnote: "No account required · blunt numbers on purpose",
} as const

export const SCAN_EMAIL_STEP = {
  title: "Where should we send your report?",
  body: "Enter your work email. You get your score, severity, and cost estimate immediately—and we can send the full read to your inbox.",
  submit: "Email me my read",
  submitting: "Sending your report…",
} as const

export const SCAN_SAVE_REPORT = {
  title: "Send this diagnosis to your inbox",
  hook: "You have seen the read—save the full report, PDF, and fastest-path plan.",
  firstNameLabel: "First name",
  emailLabel: "Email",
  businessNameLabel: "Business name",
  optional: "Optional",
  benefits: [
    "PDF summary",
    "Your top three fixes",
    "Progress tracking",
    "Re-run later",
  ] as const,
  submit: "Send my report",
  submitting: "Sending your report…",
  successTitle: "Report sent successfully",
  successBody: "Your PDF and hosted link are on the way to",
  resend: "Resend report",
  resending: "Resending…",
  viewReport: "View your report",
} as const

export const SCAN_RESULTS = {
  revealEyebrow: "Your operational diagnosis",
  revealCta: "See the full diagnosis",
  revealHint: "Failure points, fastest path, and what to fix first—next screen.",
  fullReportEyebrow: "Full operational diagnosis",
  hook: "Rivet mapped owner dependency, trapped knowledge, training gaps, and where the operation breaks without you.",
  biggestRisksHeading: "Biggest operational risks",
  whyBelievesHeading: "Grounded in what you told us",
  whyBelievesSubtext: "No generic benchmarks—your answers about pulls, training, and tribal knowledge.",
  failurePointsHeading: "Where the business is likely to fail without you",
  failurePointsSubtext:
    "Trapped knowledge, training gaps, interruptions, and missing procedures—not abstract category scores.",
  underestimate: "Most owners underestimate this by 2–3× once they track a real week.",
  fixesHeading: "What Rivet would fix next",
  hoursLeakageHeading: "Where your hours are leaking",
  hoursLeakageSubtext: "What routing everything through you likely costs in time and money each year.",
  annualCostLabel: "Estimated annual cost of owner dependency",
  bottomCtaHeadline: RIVET_PRICING.productName,
  bottomCtaSubtext: RIVET_PRICING.positioningShort,
  bottomCtaPriceLine: `${RIVET_PRICING.priceOnce} ${RIVET_PRICING.priceInstallment}`,
  bottomCtaBullets: RIVET_PRICING.included,
  primaryCta: RIVET_PRICING.cta,
  secondaryCta: "Email my report",
  emailedNote: "Report sent to",
  disclaimer: "Directional model from your answers · not tax or legal advice",
  scoringEyebrow: "Transparent scoring",
  scoringTitle: "How Rivet calculated this",
  positioningLine: PRODUCT_POSITIONING,
  promiseLine: EMOTIONAL_PROMISE,
} as const
