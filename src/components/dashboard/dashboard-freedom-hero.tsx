import Link from "next/link"
import {
  AlertTriangle,
  CalendarDays,
  Clock,
  GraduationCap,
  MessageCircleQuestion,
  ShieldCheck,
} from "lucide-react"

import { EscapeAbsenceSimulationTrigger } from "@/components/escape-readiness/escape-absence-simulation"
import type { DashboardViewModel } from "@/lib/dashboard/types"
import type { QuestionsPreventedMetrics } from "@/lib/ask-rivet/questions-prevented"
import { buildFreedomHeroMetrics } from "@/lib/dashboard/freedom-hero"
import { COPY } from "@/lib/interface-copy"
import { cn } from "@/lib/utils"

type MetricProps = {
  href: string
  icon: typeof ShieldCheck
  label: string
  value: string
  suffix?: string
  sub?: string
  accent?: "default" | "risk" | "positive"
}

function MetricTile({ href, icon: Icon, label, value, suffix, sub, accent = "default" }: MetricProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex min-h-[7.5rem] flex-col justify-between rounded-2xl border px-4 py-4 transition-[border-color,box-shadow,transform] hover:-translate-y-px hover:shadow-md",
        accent === "risk"
          ? "border-amber-500/30 bg-amber-500/[0.05] hover:border-amber-500/45"
          : accent === "positive"
            ? "border-emerald-500/25 bg-emerald-500/[0.04] hover:border-emerald-500/40"
            : "border-border/55 bg-card/90 hover:border-border"
      )}
    >
      <span className="flex items-center gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        <Icon className="size-3.5 shrink-0 opacity-70" aria-hidden />
        {label}
      </span>
      <div>
        <p className="mt-2 text-[1.75rem] font-semibold leading-none tabular-nums tracking-tight text-foreground sm:text-[2rem]">
          {value}
          {suffix ? (
            <span className="ml-0.5 text-lg font-medium text-muted-foreground">{suffix}</span>
          ) : null}
        </p>
        {sub ? <p className="mt-1.5 text-xs leading-snug text-muted-foreground">{sub}</p> : null}
      </div>
    </Link>
  )
}

export function DashboardFreedomHero({
  model,
  askMetrics,
}: {
  model: DashboardViewModel
  askMetrics: QuestionsPreventedMetrics | null
}) {
  const m = buildFreedomHeroMetrics(model, askMetrics)
  const escapeDisplay = m.escapeReadinessScore == null ? "—" : String(m.escapeReadinessScore)
  const teamDisplay = m.teamReadinessPercent == null ? "—" : String(m.teamReadinessPercent)
  const preventedDisplay =
    m.questionsPreventedThisMonth == null ? "—" : String(m.questionsPreventedThisMonth)
  const capacityParts = (() => {
    const label = m.ownerFreeCapacityLabel
    if (label === "—" || label === "Estimating…") return { value: label, suffix: undefined as string | undefined }
    const match = label.match(/^([\d.]+)\s+(day|days)$/)
    if (match) return { value: match[1], suffix: ` ${match[2]}` }
    return { value: label, suffix: undefined as string | undefined }
  })()
  const hoursDisplay = m.ownerHoursReturned == null ? "—" : String(m.ownerHoursReturned)

  return (
    <section
      className="overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card via-card to-muted/20 shadow-sm"
      aria-labelledby="freedom-hero-heading"
    >
      <div className="border-b border-border/50 px-5 py-6 sm:px-8 sm:py-8">
        {model.businessName ? (
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {model.businessName}
          </p>
        ) : null}
        <h1
          id="freedom-hero-heading"
          className="mt-2 max-w-3xl text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-[2rem] lg:leading-tight"
        >
          {COPY.dashboard.freedomHero.question}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {COPY.dashboard.freedomHero.lead}
        </p>
        {model.escapeReadiness.score != null ? (
          <div className="mt-5">
            <EscapeAbsenceSimulationTrigger
              model={model.escapeReadiness}
              askMetrics={askMetrics}
              teamReadinessPercent={model.staffReadinessPercent}
            />
          </div>
        ) : null}
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3 xl:gap-4 xl:p-6">
        <MetricTile
          href="/escape-plan"
          icon={CalendarDays}
          label={COPY.dashboard.freedomHero.ownerFreeCapacity}
          value={capacityParts.value}
          suffix={capacityParts.suffix}
          sub={COPY.dashboard.freedomHero.ownerFreeCapacityHint}
          accent={m.escapeReadinessScore != null && m.escapeReadinessScore >= 70 ? "positive" : "default"}
        />
        <MetricTile
          href="/escape-plan"
          icon={ShieldCheck}
          label={COPY.dashboard.freedomHero.escapeReadiness}
          value={escapeDisplay}
          suffix={escapeDisplay !== "—" ? "%" : undefined}
          sub={model.escapeReadiness.statusBadge ?? COPY.dashboard.freedomHero.escapeReadinessHint}
          accent={
            m.escapeReadinessScore != null && m.escapeReadinessScore >= 65
              ? "positive"
              : m.escapeReadinessScore != null && m.escapeReadinessScore < 35
                ? "risk"
                : "default"
          }
        />
        <MetricTile
          href="/questions-prevented"
          icon={MessageCircleQuestion}
          label={COPY.dashboard.freedomHero.questionsPrevented}
          value={preventedDisplay}
          sub={COPY.dashboard.freedomHero.questionsPreventedHint}
        />
        <MetricTile
          href="/questions-prevented"
          icon={Clock}
          label={COPY.dashboard.freedomHero.ownerHoursReturned}
          value={hoursDisplay}
          suffix={hoursDisplay !== "—" ? "h" : undefined}
          sub={COPY.dashboard.freedomHero.ownerHoursReturnedHint}
          accent={m.ownerHoursReturned != null && m.ownerHoursReturned > 0 ? "positive" : "default"}
        />
        <MetricTile
          href="/training"
          icon={GraduationCap}
          label={COPY.dashboard.freedomHero.teamReadiness}
          value={teamDisplay}
          suffix={teamDisplay !== "—" ? "%" : undefined}
          sub={COPY.dashboard.freedomHero.teamReadinessHint}
        />
        <div
          className={cn(
            "flex min-h-[7.5rem] flex-col justify-between rounded-2xl border px-4 py-4",
            "border-amber-500/35 bg-amber-500/[0.06]"
          )}
        >
          <span className="flex items-center gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-amber-900/80 dark:text-amber-100/80">
            <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
            {COPY.dashboard.freedomHero.highestRisk}
          </span>
          <div>
            {m.highestRisk.href ? (
              <Link
                href={m.highestRisk.href}
                className="mt-2 block text-base font-semibold leading-snug text-foreground hover:text-primary"
              >
                {m.highestRisk.label}
              </Link>
            ) : (
              <p className="mt-2 text-base font-semibold leading-snug text-foreground">{m.highestRisk.label}</p>
            )}
            <p className="mt-1.5 text-xs leading-snug text-muted-foreground">
              {COPY.dashboard.freedomHero.highestRiskHint}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
