import Link from "next/link"
import { Bell, BookOpen, Gauge, GraduationCap, ListTodo, ShieldCheck } from "lucide-react"

import type { DashboardViewModel } from "@/lib/dashboard/types"
import { COPY } from "@/lib/interface-copy"
import { cn } from "@/lib/utils"

type PulseItem = {
  key: string
  href: string
  icon: typeof Bell
  label: string
  display: string
  tone: string
}

function buildPulseItems(model: DashboardViewModel): PulseItem[] {
  const rivet = model.rivetIndex
  const escape = model.escapeReadiness
  const survive = escape.score == null ? "—" : String(escape.score)
  const rivetScore = rivet.dependencyScore == null ? "—" : String(rivet.dependencyScore)
  const training =
    model.trainingProgressPercent == null ? "—" : `${model.trainingProgressPercent}%`

  return [
    {
      key: "interrupts",
      href: "/interruptions",
      icon: Bell,
      label: COPY.dashboard.pulse.ownerInterruptions,
      display: String(model.ownerInterruptionsThisWeekCount),
      tone:
        model.ownerInterruptionsThisWeekCount > 0
          ? "text-rose-900 dark:text-rose-100"
          : "text-foreground",
    },
    {
      key: "procedures",
      href: "/sops",
      icon: BookOpen,
      label: COPY.dashboard.pulse.proceduresMissing,
      display: String(model.proceduresMissingCount),
      tone:
        model.proceduresMissingCount > 0
          ? "text-amber-950 dark:text-amber-100"
          : "text-foreground",
    },
    {
      key: "training",
      href: "/training",
      icon: GraduationCap,
      label: COPY.dashboard.pulse.trainingCompletion,
      display: training,
      tone:
        model.trainingProgressPercent != null && model.trainingProgressPercent >= 80
          ? "text-emerald-900 dark:text-emerald-100"
          : "text-foreground",
    },
    {
      key: "issues",
      href: "/issues?view=unresolved",
      icon: ListTodo,
      label: COPY.dashboard.pulse.issuesUnresolved,
      display: String(model.unresolvedIssuesCount),
      tone:
        model.unresolvedIssuesCount > 0
          ? "text-amber-950 dark:text-amber-100"
          : "text-foreground",
    },
    {
      key: "escape",
      href: "/escape-plan",
      icon: ShieldCheck,
      label: COPY.dashboard.pulse.escapeReadiness,
      display: survive,
      tone:
        escape.score != null && escape.score >= 50
          ? "text-emerald-900 dark:text-emerald-100"
          : escape.score != null && escape.score < 35
            ? "text-rose-900 dark:text-rose-100"
            : "text-foreground",
    },
    {
      key: "rivet",
      href: "/dashboard#depth-heading",
      icon: Gauge,
      label: COPY.dashboard.pulse.rivetScore,
      display: rivetScore,
      tone:
        rivet.dependencyScore != null && rivet.dependencyScore >= 66
          ? "text-rose-900 dark:text-rose-100"
          : rivet.dependencyScore != null && rivet.dependencyScore <= 40
            ? "text-emerald-900 dark:text-emerald-100"
            : "text-foreground",
    },
  ]
}

export function DashboardPulseMetrics({ model }: { model: DashboardViewModel }) {
  const items = buildPulseItems(model)

  return (
    <section aria-labelledby="dashboard-pulse-heading" className="space-y-3">
      <h2 id="dashboard-pulse-heading" className="rivet-section-label">
        {COPY.dashboard.pulseHeading}
      </h2>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {items.map((it) => (
          <Link
            key={it.key}
            href={it.href}
            className="group flex min-h-[6.25rem] flex-col justify-between rounded-xl border border-border/50 bg-card px-3.5 py-3 text-left transition-colors hover:border-border hover:bg-muted/20"
          >
            <span className="flex items-start gap-1.5 text-[10px] font-semibold uppercase leading-snug tracking-[0.05em] text-muted-foreground sm:text-[11px]">
              <it.icon className="mt-0.5 size-3 shrink-0 opacity-60" strokeWidth={1.75} aria-hidden />
              <span>{it.label}</span>
            </span>
            <span
              className={cn(
                "mt-2 text-2xl font-semibold tabular-nums tracking-tight sm:text-[1.65rem]",
                it.tone
              )}
            >
              {it.display}
              {it.display !== "—" && (it.key === "rivet" || it.key === "escape") ? (
                <span className="text-lg font-medium text-muted-foreground">%</span>
              ) : null}
            </span>
            {it.key === "rivet" ? (
              <span className="mt-1 text-[10px] leading-snug text-muted-foreground">{COPY.dashboard.pulseRivetHint}</span>
            ) : it.key === "escape" ? (
              <span className="mt-1 text-[10px] leading-snug text-muted-foreground">{COPY.dashboard.pulseEscapeHint}</span>
            ) : null}
          </Link>
        ))}
      </div>
    </section>
  )
}
