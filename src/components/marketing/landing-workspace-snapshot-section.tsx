import { LANDING_WORKSPACE_SNAPSHOT } from "@/lib/marketing-landing-copy"
import { cn } from "@/lib/utils"

function MetricTile({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div
      className={cn(
        "rounded-md border p-3 sm:p-4",
        highlight
          ? "border-emerald-500/20 bg-emerald-950/25"
          : "border-white/[0.06] bg-white/[0.02]"
      )}
    >
      <p
        className={cn(
          "font-mono text-[9px] font-semibold uppercase tracking-[0.12em]",
          highlight ? "text-emerald-300/85" : "text-zinc-500"
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "mt-1.5 text-xl font-semibold tabular-nums sm:text-2xl",
          highlight ? "text-emerald-100" : "text-zinc-100"
        )}
      >
        {value}
      </p>
    </div>
  )
}

export function LandingWorkspaceSnapshotSection() {
  const { title, disclaimer, workspaceLabel, metrics } = LANDING_WORKSPACE_SNAPSHOT

  return (
    <section
      className="border-b border-zinc-200 bg-white py-14 sm:py-16 dark:border-zinc-800 dark:bg-zinc-950"
      aria-labelledby="workspace-snapshot-heading"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2
          id="workspace-snapshot-heading"
          className="text-2xl font-semibold tracking-[-0.03em] text-zinc-950 sm:text-[1.75rem] dark:text-white"
        >
          {title}
        </h2>

        <div
          className={cn(
            "mt-8 overflow-hidden rounded-lg border border-white/[0.09] bg-zinc-950",
            "shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset] ring-1 ring-black/50"
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-2.5 sm:px-5">
            <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
              {workspaceLabel}
            </span>
            <span className="font-mono text-[9px] tabular-nums text-zinc-600">Overview · 7d</span>
          </div>

          <div className="grid gap-2 p-3 sm:grid-cols-2 sm:gap-3 sm:p-4 lg:grid-cols-5">
            {metrics.map((m) => (
              <MetricTile
                key={m.id}
                label={m.label}
                value={m.value}
                highlight={m.id === "escape"}
              />
            ))}
          </div>

          <p className="border-t border-white/[0.06] px-4 py-3 font-mono text-[9px] font-medium uppercase tracking-[0.12em] text-zinc-600 sm:px-5">
            {disclaimer}
          </p>
        </div>
      </div>
    </section>
  )
}
