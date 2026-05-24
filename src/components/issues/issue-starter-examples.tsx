"use client"

import { ISSUE_STARTER_EXAMPLES } from "@/lib/issues/starter-examples"
import { COPY } from "@/lib/interface-copy"
import { IssueQuickCaptureTrigger } from "@/components/issues/issue-quick-capture-modal"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function IssueStarterExamples({
  className,
  businessId,
  profiles = [],
}: {
  className?: string
  businessId: string
  profiles?: { id: string; full_name: string | null; role: string | null }[]
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 sm:px-6 sm:py-8",
        className
      )}
    >
      <div className="mx-auto max-w-2xl space-y-2 text-center">
        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {COPY.issues.starterEyebrow}
        </p>
        <h3 className="text-lg font-semibold tracking-tight text-foreground">{COPY.issues.starterTitle}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{COPY.issues.starterLead}</p>
      </div>

      <ul className="mx-auto mt-6 max-w-2xl space-y-2">
        {ISSUE_STARTER_EXAMPLES.map((example) => {
          const Icon = example.icon
          return (
            <li
              key={example.id}
              className="flex items-start gap-3 rounded-xl border border-border/50 bg-background/80 px-3 py-3 text-sm shadow-sm"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-muted/30 text-muted-foreground">
                <Icon className="size-4" aria-hidden />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-[0.65rem] font-normal">
                    {example.categoryLabel}
                  </Badge>
                  <Badge variant="secondary" className="text-[0.6rem] font-normal">
                    {COPY.issues.starterExampleBadge}
                  </Badge>
                </div>
                <p className="font-medium leading-snug text-foreground">{example.title}</p>
              </div>
            </li>
          )
        })}
      </ul>

      <div className="mx-auto mt-6 flex max-w-2xl justify-center">
        <IssueQuickCaptureTrigger businessId={businessId} profiles={profiles} className="h-11" />
      </div>
    </div>
  )
}
