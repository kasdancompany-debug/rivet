import type { IssueStatus } from "@/types/database"

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

export const ISSUE_STATUSES = [
  { value: "not_started", label: "Not started" },
  { value: "investigating", label: "Investigating" },
  { value: "fix_in_progress", label: "Fix in progress" },
  { value: "resolved", label: "Resolved" },
] as const

const ISSUE_STATUS_LABELS = Object.fromEntries(
  ISSUE_STATUSES.map((s) => [s.value, s.label])
) as Record<string, string>

const ISSUE_STATUS_SET = new Set<string>(ISSUE_STATUSES.map((s) => s.value))

/** Unresolved workflow statuses (everything except resolved). */
export const ISSUE_UNRESOLVED_STATUSES: IssueStatus[] = [
  "not_started",
  "investigating",
  "fix_in_progress",
]

export function isAllowedIssueStatus(value: string): value is IssueStatus {
  return ISSUE_STATUS_SET.has(value)
}

export function isIssueUnresolved(status: IssueStatus): boolean {
  return status !== "resolved"
}

export function formatIssueStatus(value: string): string {
  return ISSUE_STATUS_LABELS[value] ?? value.replace(/_/g, " ")
}

export function issueStatusBadgeClass(status: IssueStatus): string {
  switch (status) {
    case "not_started":
      return "border-amber-500/30 bg-amber-500/5 text-amber-950 dark:text-amber-200"
    case "investigating":
      return "border-sky-500/25 bg-sky-500/5 text-sky-950 dark:text-sky-200"
    case "fix_in_progress":
      return "border-violet-500/30 bg-violet-500/5 text-violet-950 dark:text-violet-200"
    default:
      return "border-emerald-500/25 bg-emerald-500/5 text-emerald-950 dark:text-emerald-200"
  }
}
