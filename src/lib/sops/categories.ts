/** Primary values for new standards (Capture + forms). Stored in `standards.category`. */
export const SOP_CATEGORIES = [
  { value: "opening", label: "Opening" },
  { value: "closing", label: "Closing" },
  { value: "product_quality", label: "Product Quality" },
  { value: "customer_experience", label: "Customer Experience" },
  { value: "cleaning", label: "Cleaning" },
  { value: "cash_handling", label: "Cash Handling" },
  { value: "training", label: "Training" },
  { value: "other", label: "Other" },
] as const

/** Older workspaces may still have these category strings on rows. */
export const LEGACY_SOP_CATEGORY_VALUES = [
  "coffee",
  "donuts",
  "customer_service",
  "inventory",
  "emergency",
  "general",
  "operations",
  "guest_experience",
  "quality",
  "onboarding",
  "escalation",
  "roles",
] as const

/** Legacy labels for filters / template library tabs. */
export const LEGACY_SOP_CATEGORY_OPTIONS = [
  { value: "coffee", label: "Coffee" },
  { value: "donuts", label: "Donuts" },
  { value: "customer_service", label: "Customer Service" },
  { value: "inventory", label: "Inventory" },
  { value: "emergency", label: "Emergency" },
  { value: "general", label: "General" },
] as const

export type SopCategoryValue = (typeof SOP_CATEGORIES)[number]["value"] | (typeof LEGACY_SOP_CATEGORY_VALUES)[number]

const LABEL_BY_VALUE: Record<string, string> = {
  ...Object.fromEntries(SOP_CATEGORIES.map((c) => [c.value, c.label])),
  ...Object.fromEntries(LEGACY_SOP_CATEGORY_OPTIONS.map((c) => [c.value, c.label])),
}

export function formatSopCategory(value: string): string {
  return LABEL_BY_VALUE[value] ?? value.replace(/_/g, " ")
}

const KNOWN = new Set<string>([
  ...SOP_CATEGORIES.map((c) => c.value),
  ...LEGACY_SOP_CATEGORY_OPTIONS.map((c) => c.value),
])

/** Primary + legacy — for template library tab ordering. */
export const ALL_SOP_CATEGORY_TAB_ORDER: SopCategoryValue[] = [
  ...(SOP_CATEGORIES.map((c) => c.value) as SopCategoryValue[]),
  ...(LEGACY_SOP_CATEGORY_OPTIONS.map((c) => c.value) as SopCategoryValue[]),
]

export function isSopCategory(value: string): value is SopCategoryValue {
  return KNOWN.has(value)
}

/** First option for selects when the stored value is missing from the primary list. */
export function primaryCategoryOrFallback(stored: string | undefined): (typeof SOP_CATEGORIES)[number]["value"] {
  if (stored && SOP_CATEGORIES.some((c) => c.value === stored)) {
    return stored as (typeof SOP_CATEGORIES)[number]["value"]
  }
  return "opening"
}
