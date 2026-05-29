/**
 * Public legal and support contact details.
 * Override via env when your production inbox or legal entity name differs.
 */

/** Legal name of the operator shown on policies (your incorporated name if applicable). */
export const LEGAL_OPERATOR_NAME =
  process.env.NEXT_PUBLIC_LEGAL_OPERATOR_NAME?.trim() || "Rivet"

/** Monitored inbox for product, billing, privacy, and refund requests. */
export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "support@rivet.app"

export const SUPPORT_MAILTO = `mailto:${SUPPORT_EMAIL}`

/** Shown at the top of Terms, Privacy, and Refund Policy. */
export const LEGAL_EFFECTIVE_DATE = "May 25, 2026"

export const LEGAL_LAST_UPDATED = LEGAL_EFFECTIVE_DATE
