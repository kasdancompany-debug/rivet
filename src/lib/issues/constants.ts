/** Stored in `issues.category` (text). */
export const ISSUE_CATEGORIES = [
  { value: "product_quality", label: "Product Quality" },
  { value: "customer_complaint", label: "Customer Complaint" },
  { value: "equipment", label: "Equipment" },
  { value: "staff_question", label: "Staff Question" },
  { value: "inventory", label: "Inventory" },
  { value: "cleaning", label: "Cleaning" },
  { value: "scheduling", label: "Scheduling" },
  { value: "other", label: "Other" },
] as const

export type IssueCategorySlug = (typeof ISSUE_CATEGORIES)[number]["value"]

/** Legacy / API-only slugs still valid in the database. */
const LEGACY_CATEGORY_LABELS: Record<string, string> = {
  shift: "Shift report",
  general: "General",
}

const LABEL_BY_VALUE = Object.fromEntries(
  ISSUE_CATEGORIES.map((c) => [c.value, c.label])
) as Record<string, string>

const ALLOWED = new Set<string>([
  ...ISSUE_CATEGORIES.map((c) => c.value),
  "shift",
  "general",
])

export function isAllowedIssueCategory(value: string): boolean {
  return ALLOWED.has(value)
}

export function formatIssueCategory(value: string): string {
  return LABEL_BY_VALUE[value] ?? LEGACY_CATEGORY_LABELS[value] ?? value.replace(/_/g, " ")
}

export const ISSUE_SEVERITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
] as const

const SEVERITY_LABELS = Object.fromEntries(
  ISSUE_SEVERITIES.map((s) => [s.value, s.label])
) as Record<string, string>

const SEVERITY_SET = new Set<string>(ISSUE_SEVERITIES.map((s) => s.value))

export function isAllowedIssueSeverity(value: string): boolean {
  return SEVERITY_SET.has(value)
}

export function formatIssueSeverity(value: string): string {
  return SEVERITY_LABELS[value] ?? value
}
