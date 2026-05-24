"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

import {
  rankHauntingWeekItems,
  sortHauntingWeekItems,
} from "@/lib/issues/haunting-week/build-haunting-week"
import type { HauntingWeekItem, HauntingWeekSort } from "@/lib/issues/haunting-week/types"
import { PAIN_LEVEL_STYLES } from "@/lib/issues/pain-score/pain-levels"
import { COPY } from "@/lib/interface-copy"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const SORT_OPTIONS: { value: HauntingWeekSort; label: string }[] = [
  { value: "frequency", label: COPY.issues.hauntingWeekSortFrequency },
  { value: "impact", label: COPY.issues.hauntingWeekSortImpact },
  { value: "time_cost", label: COPY.issues.hauntingWeekSortTimeCost },
]

function MetricBar({
  label,
  value,
  max,
  toneClass,
  display,
}: {
  label: string
  value: number
  max: number
  toneClass: string
  display: string
}) {
  const width = max > 0 ? Math.max(8, Math.round((value / max) * 100)) : 0

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2 text-[0.68rem]">
        <span className="font-medium text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums text-foreground">{display}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted/70">
        <div
          className={cn("h-full rounded-full transition-all duration-300", toneClass)}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  )
}

function HauntingWeekCard({
  item,
  maxFrequency,
  maxImpact,
  maxTimeCost,
  activeSort,
}: {
  item: HauntingWeekItem
  maxFrequency: number
  maxImpact: number
  maxTimeCost: number
  activeSort: HauntingWeekSort
}) {
  const painStyles = PAIN_LEVEL_STYLES[item.painLevel]

  return (
    <article className="rounded-xl border border-border/50 bg-muted/10 px-4 py-4 dark:bg-muted/5 sm:px-5 sm:py-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-lg border text-sm font-semibold tabular-nums",
              item.rank === 1
                ? "border-rose-500/40 bg-rose-500/10 text-rose-950 dark:text-rose-100"
                : item.rank === 2
                  ? "border-amber-500/35 bg-amber-500/10 text-amber-950 dark:text-amber-100"
                  : "border-border/60 bg-background/80 text-muted-foreground"
            )}
            aria-label={`Rank ${item.rank}`}
          >
            {item.rank}
          </span>
          <div className="min-w-0 space-y-1">
            <Link
              href={`/issues/${item.issueId}`}
              className="text-base font-semibold leading-snug text-foreground underline-offset-4 hover:underline"
            >
              {item.title}
            </Link>
            {item.ownerRequired ? (
              <p className="text-xs font-medium text-rose-800 dark:text-rose-300">{COPY.issues.hauntingWeekNeedsYou}</p>
            ) : null}
          </div>
        </div>
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wide",
            painStyles.badge
          )}
        >
          {COPY.issues.hauntingWeekImpactShort(item.estimatedImpact)}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <MetricBar
          label={COPY.issues.hauntingWeekFrequencyLabel}
          value={item.frequency}
          max={maxFrequency}
          toneClass={activeSort === "frequency" ? painStyles.bar : "bg-sky-500/80"}
          display={`×${item.frequency}`}
        />
        <MetricBar
          label={COPY.issues.hauntingWeekImpactLabel}
          value={item.estimatedImpact}
          max={maxImpact}
          toneClass={activeSort === "impact" ? painStyles.bar : "bg-violet-500/80"}
          display={String(item.estimatedImpact)}
        />
        <MetricBar
          label={COPY.issues.hauntingWeekTimeCostLabel}
          value={item.timeCostScore}
          max={maxTimeCost}
          toneClass={activeSort === "time_cost" ? painStyles.bar : "bg-orange-500/80"}
          display={String(item.timeCostScore)}
        />
      </div>
    </article>
  )
}

export function HauntingWeekPanel({ items }: { items: HauntingWeekItem[] }) {
  const [sort, setSort] = useState<HauntingWeekSort>("frequency")

  const ranked = useMemo(
    () => rankHauntingWeekItems(sortHauntingWeekItems(items, sort)),
    [items, sort]
  )

  const maxFrequency = Math.max(1, ...ranked.map((item) => item.frequency))
  const maxImpact = Math.max(1, ...ranked.map((item) => item.estimatedImpact))
  const maxTimeCost = Math.max(1, ...ranked.map((item) => item.timeCostScore))

  return (
    <Card variant="quiet">
      <CardHeader className="pb-2">
        <CardTitle className="text-[15px] font-semibold tracking-tight">{COPY.issues.hauntingWeekTitle}</CardTitle>
        <CardDescription>{COPY.issues.hauntingWeekHint}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <nav className="flex flex-wrap gap-2" aria-label={COPY.issues.hauntingWeekSortAria}>
          {SORT_OPTIONS.map((option) => {
            const active = sort === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setSort(option.value)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-foreground text-background"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                aria-pressed={active}
              >
                {option.label}
              </button>
            )
          })}
        </nav>

        {ranked.length === 0 ? (
          <p className="text-sm text-muted-foreground">{COPY.issues.hauntingWeekEmpty}</p>
        ) : (
          <div className="space-y-3">
            {ranked.map((item) => (
              <HauntingWeekCard
                key={item.key}
                item={item}
                maxFrequency={maxFrequency}
                maxImpact={maxImpact}
                maxTimeCost={maxTimeCost}
                activeSort={sort}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
