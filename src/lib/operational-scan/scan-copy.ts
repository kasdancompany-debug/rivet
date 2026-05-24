/** Rivet Scan — marketing & UX copy (urgency + conversion). */

export const SCAN_INTRO = {
  eyebrow: "Free · 2 minutes",
  headline: "How dependent is your business on you?",
  subhead:
    "Eight honest questions. You will see your Owner Dependency Score, what it is costing you in time and money, and the first three fixes that actually move the needle.",
  cta: "Start the scan",
  footnote: "No account required · blunt numbers on purpose",
} as const

export const SCAN_EMAIL_STEP = {
  title: "Where should we send your report?",
  body: "Enter your work email. You will get your score, severity, and cost estimate immediately—and we can send the full read to your inbox.",
  submit: "Email me my scan",
  submitting: "Sending your report…",
} as const

export const SCAN_SAVE_REPORT = {
  title: "Save Your Report",
  hook: "Keep your score, fixes, and progress—pick up where you left off.",
  firstNameLabel: "First name",
  emailLabel: "Email",
  businessNameLabel: "Business name",
  phoneLabel: "Phone",
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
  hook: "This is what routing everything through you is costing—every week, every month.",
  underestimate: "Most owners underestimate this by 2–3× once they track a real week.",
  fixesHeading: "Your first three fixes",
  annualCostLabel: "Estimated annual cost of owner dependency",
  bottomCtaHeadline: "Ready to stop being step one?",
  bottomCtaSubtext: "Install Rivet and turn interruptions into systems.",
  primaryCta: "Install Rivet — $799 once",
  secondaryCta: "Email my report",
  emailedNote: "Report sent to",
  disclaimer: "Directional model from your answers · not tax or legal advice",
} as const
