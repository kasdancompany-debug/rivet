import { cn } from "@/lib/utils"

export function ScanProgress({
  step,
  total,
  className,
}: {
  step: number
  total: number
  className?: string
}) {
  const pct = total > 0 ? Math.round((step / total) * 100) : 0
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Question {step} of {total}
        </p>
        <p className="font-mono text-[10px] tabular-nums text-zinc-400">{pct}%</p>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-zinc-950 transition-[width] duration-300 ease-out dark:bg-white"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={step}
          aria-valuemin={0}
          aria-valuemax={total}
        />
      </div>
    </div>
  )
}
