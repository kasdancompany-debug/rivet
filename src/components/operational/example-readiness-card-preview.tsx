import { UserRound } from "lucide-react"

import { DEMO_READINESS_EMPLOYEE } from "@/lib/operational-preview/demo-data"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const BADGE: Record<string, string> = {
  not_ready: "border-border/70 bg-muted/50 text-muted-foreground",
  learning: "border-amber-500/25 bg-amber-500/5 text-amber-900 dark:text-amber-200",
  ready_with_support: "border-sky-500/25 bg-sky-500/5 text-sky-900 dark:text-sky-200",
  fully_ready: "border-emerald-500/25 bg-emerald-500/5 text-emerald-900 dark:text-emerald-200",
}

export function ExampleReadinessCardPreview() {
  const d = DEMO_READINESS_EMPLOYEE
  return (
    <Card className="border-border/60 bg-card/90 shadow-sm">
      <CardHeader className="border-b border-border/50 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/40">
              <UserRound className="size-5 text-muted-foreground" aria-hidden />
            </div>
            <div>
              <CardTitle className="text-lg">{d.name}</CardTitle>
              <CardDescription className="mt-0.5">{d.role}</CardDescription>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Readiness</p>
            <p className="text-2xl font-semibold tabular-nums text-foreground">{d.aggregatePct}%</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        <p className="text-xs font-medium text-muted-foreground">Delegation signals (example)</p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {d.badges.map((b) => (
            <li
              key={b.q}
              className="flex items-center justify-between gap-2 rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-xs"
            >
              <span className="text-foreground/90">{b.q}</span>
              <Badge variant="outline" className={cn("text-[0.65rem] capitalize", BADGE[b.v] ?? "")}>
                {b.v.replace(/_/g, " ")}
              </Badge>
            </li>
          ))}
        </ul>
        <p className="text-[0.65rem] leading-relaxed text-muted-foreground">
          Example card — your roster fills this from{" "}
          <span className="font-medium text-foreground/90">Training → Team readiness</span>.
        </p>
      </CardContent>
    </Card>
  )
}
