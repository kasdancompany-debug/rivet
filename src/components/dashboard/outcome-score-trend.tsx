"use client"

import type { EscapeReadinessProgressPoint } from "@/lib/escape-readiness/types"
import { cn } from "@/lib/utils"

export function OutcomeScoreTrend({
  points,
  className,
}: {
  points: EscapeReadinessProgressPoint[]
  className?: string
}) {
  if (points.length < 2) return null

  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date)).slice(-14)
  const scores = sorted.map((p) => p.score)
  const min = Math.min(...scores)
  const max = Math.max(...scores)
  const range = Math.max(max - min, 8)
  const w = 200
  const h = 48
  const pad = 4

  const coords = scores.map((score, i) => {
    const x = pad + (i / Math.max(scores.length - 1, 1)) * (w - pad * 2)
    const y = pad + (1 - (score - min) / range) * (h - pad * 2)
    return `${x},${y}`
  })

  const first = scores[0]!
  const last = scores[scores.length - 1]!
  const delta = last - first

  return (
    <div className={cn("flex items-end gap-3", className)}>
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        className="shrink-0 overflow-visible"
        aria-hidden
      >
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-sky-500/70 dark:text-sky-400/80"
          points={coords.join(" ")}
        />
      </svg>
      <p
        className={cn(
          "pb-1 text-xs font-semibold tabular-nums",
          delta > 0
            ? "text-emerald-700 dark:text-emerald-300"
            : delta < 0
              ? "text-amber-800 dark:text-amber-200"
              : "text-muted-foreground"
        )}
      >
        {delta > 0 ? `+${delta}` : delta === 0 ? "—" : delta} pts
      </p>
    </div>
  )
}
