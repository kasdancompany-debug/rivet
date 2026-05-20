import Link from "next/link"

import { COPY } from "@/lib/interface-copy"
import { cn } from "@/lib/utils"

export type IssuesListView = "all" | "owner_required" | "unresolved" | "resolved"

const TABS: { view: IssuesListView; label: string; href: string }[] = [
  { view: "all", label: COPY.issues.tabsAll, href: "/issues" },
  { view: "owner_required", label: COPY.issues.tabsYou, href: "/issues?view=owner_required" },
  { view: "unresolved", label: COPY.issues.tabsOpen, href: "/issues?view=unresolved" },
  { view: "resolved", label: COPY.issues.tabsCleared, href: "/issues?view=resolved" },
]

export function IssueViewTabs({ current }: { current: IssuesListView }) {
  return (
    <nav
      className="flex flex-wrap gap-2 border-b border-border/60 pb-3"
      aria-label={COPY.issues.tabsAria}
    >
      {TABS.map((t) => {
        const active = t.view === current
        return (
          <Link
            key={t.view}
            href={t.href}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-foreground text-background"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            aria-current={active ? "page" : undefined}
          >
            {t.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function parseIssuesView(raw: string | undefined): IssuesListView {
  if (
    raw === "owner_required" ||
    raw === "unresolved" ||
    raw === "resolved"
  ) {
    return raw
  }
  return "all"
}
