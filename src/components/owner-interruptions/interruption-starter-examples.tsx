import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { InterruptionSeverityBadge } from "@/components/owner-interruptions/interruption-severity-badge"
import { INTERRUPTION_STARTER_EXAMPLES } from "@/lib/owner-interruptions/starter-examples"
import { COPY } from "@/lib/interface-copy"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function InterruptionStarterExamples({
  variant = "featured",
  limit,
  className,
}: {
  variant?: "featured" | "inline"
  limit?: number
  className?: string
}) {
  const featured = variant === "featured"
  const examples = limit != null ? INTERRUPTION_STARTER_EXAMPLES.slice(0, limit) : INTERRUPTION_STARTER_EXAMPLES

  return (
    <div
      className={cn(
        featured
          ? "rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 sm:px-6 sm:py-8"
          : "space-y-3",
        className
      )}
    >
      {featured ? (
        <div className="mx-auto max-w-2xl space-y-2 text-center">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {COPY.interruptions.starterEyebrow}
          </p>
          <h3 className="text-lg font-semibold tracking-tight text-foreground">
            {COPY.interruptions.starterTitle}
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{COPY.interruptions.starterLead}</p>
        </div>
      ) : null}

      <ul className={cn("space-y-2", featured && "mx-auto mt-6 max-w-2xl")}>
        {examples.map((example) => {
          const Icon = example.icon
          return (
            <li
              key={example.kind}
              className={cn(
                "flex items-start gap-3 rounded-xl border border-border/50 bg-background/80 px-3 py-3 text-sm",
                featured ? "shadow-sm" : "bg-muted/10"
              )}
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-muted/30 text-muted-foreground">
                <Icon className="size-4" aria-hidden />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <InterruptionSeverityBadge severity={example.severity} />
                  <Badge variant="outline" className="text-[0.65rem] font-normal">
                    {example.kindLabel}
                  </Badge>
                  <span className="text-[0.65rem] text-muted-foreground">{example.sourceLabel}</span>
                  <span className="text-[0.65rem] tabular-nums text-muted-foreground">
                    {example.estimatedMinutes}m
                  </span>
                  {featured ? (
                    <Badge variant="secondary" className="text-[0.6rem] font-normal">
                      {COPY.interruptions.starterExampleBadge}
                    </Badge>
                  ) : null}
                </div>
                <p className="font-medium leading-snug text-foreground">{example.summary}</p>
              </div>
            </li>
          )
        })}
      </ul>

      {featured ? (
        <div className="mx-auto mt-6 flex max-w-2xl justify-center">
          <Button className="h-11" nativeButton={false} render={<Link href="/interruptions/log" />}>
            {COPY.interruptions.logFirstPullCta}
            <ArrowRight className="size-3.5 opacity-80" data-icon="inline-end" />
          </Button>
        </div>
      ) : null}
    </div>
  )
}
