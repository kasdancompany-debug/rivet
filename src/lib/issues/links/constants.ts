import type { IssueLinkKind } from "@/types/database"

export const ISSUE_LINK_KINDS = [
  { value: "standard" as const, label: "SOP" },
  { value: "training_module" as const, label: "Training module" },
  { value: "owner_interruption" as const, label: "Owner pull" },
  { value: "staff_member" as const, label: "Staff member" },
] satisfies { value: IssueLinkKind; label: string }[]

const LABEL_BY_KIND = Object.fromEntries(ISSUE_LINK_KINDS.map((k) => [k.value, k.label])) as Record<
  IssueLinkKind,
  string
>

export function isAllowedIssueLinkKind(value: string): value is IssueLinkKind {
  return ISSUE_LINK_KINDS.some((k) => k.value === value)
}

export function labelForIssueLinkKind(kind: IssueLinkKind): string {
  return LABEL_BY_KIND[kind] ?? kind
}

export function issueLinkKindBadgeClass(kind: IssueLinkKind): string {
  switch (kind) {
    case "standard":
      return "border-sky-500/25 bg-sky-500/5 text-sky-950 dark:text-sky-200"
    case "training_module":
      return "border-violet-500/25 bg-violet-500/5 text-violet-950 dark:text-violet-200"
    case "owner_interruption":
      return "border-amber-500/30 bg-amber-500/5 text-amber-950 dark:text-amber-200"
    case "staff_member":
      return "border-emerald-500/25 bg-emerald-500/5 text-emerald-950 dark:text-emerald-200"
    default:
      return "border-border/60 bg-muted/30 text-muted-foreground"
  }
}
