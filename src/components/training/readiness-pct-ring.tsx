import { readinessRingStroke, readinessScoreTone } from "@/lib/training/readiness/presentation"
import { cn } from "@/lib/utils"

const R = 28
const C = 2 * Math.PI * R

export function ReadinessPctRing({
  score,
  size = "md",
  className,
}: {
  score: number
  size?: "sm" | "md" | "lg"
  className?: string
}) {
  const clamped = Math.min(100, Math.max(0, Math.round(score)))
  const offset = C - (clamped / 100) * C
  const dim = size === "sm" ? 56 : size === "lg" ? 88 : 72
  const stroke = size === "sm" ? 4 : 5

  return (
    <div
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: dim, height: dim }}
      aria-hidden
    >
      <svg width={dim} height={dim} viewBox="0 0 64 64" className="-rotate-90">
        <circle
          cx="32"
          cy="32"
          r={R}
          fill="none"
          className="stroke-muted/30"
          strokeWidth={stroke}
        />
        <circle
          cx="32"
          cy="32"
          r={R}
          fill="none"
          className={readinessRingStroke(clamped)}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={offset}
        />
      </svg>
      <span
        className={cn(
          "absolute font-semibold tabular-nums",
          readinessScoreTone(clamped),
          size === "sm" ? "text-xs" : size === "lg" ? "text-lg" : "text-sm"
        )}
      >
        {clamped}%
      </span>
    </div>
  )
}
