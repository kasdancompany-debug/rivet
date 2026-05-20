import { Check, Circle } from "lucide-react"

import { DEMO_OPENING_LINES } from "@/lib/operational-preview/demo-data"
import { cn } from "@/lib/utils"

export function OpeningChecklistPreview({
  variant = "demo",
  title = "Opening checklist (example lines)",
}: {
  variant?: "demo" | "compact"
  title?: string
}) {
  const lines = DEMO_OPENING_LINES
  const done = lines.filter((l) => l.done).length
  const pct = Math.round((done / lines.length) * 100)

  return (
    <div
      className={cn(
        "rounded-xl border border-border/60 bg-card/90",
        variant === "compact" ? "p-4" : "p-5 sm:p-6"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/50 pb-3">
        <div>
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Daily Execution
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">{title}</p>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <span className="font-medium tabular-nums text-foreground">{done}/{lines.length}</span> lines
          <span className="mx-1.5 text-border">·</span>
          {pct}% complete
        </div>
      </div>
      <div className="mb-3 mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-emerald-600/80" style={{ width: `${pct}%` }} />
      </div>
      <ul className="space-y-2.5 text-sm">
        {lines.map((line) => (
          <li key={line.id} className="flex gap-2.5 text-foreground/90">
            <span className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden>
              {line.done ? (
                <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Circle className="size-4 opacity-40" />
              )}
            </span>
            <span className={cn(line.done && "text-muted-foreground line-through decoration-muted-foreground/40")}>
              {line.text}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[0.65rem] leading-relaxed text-muted-foreground">
        Example only — your real opening run lives under{" "}
        <span className="font-medium text-foreground/90">Daily Execution</span> once checklists are linked.
      </p>
    </div>
  )
}
