import { DependencyHeatmap } from "@/components/operational/dependency-heatmap"
import { COPY } from "@/lib/interface-copy"
import { LANDING_DEMO_HEATMAP } from "@/lib/marketing-showcase-data"
import { cn } from "@/lib/utils"

/**
 * Logged-out marketing only: illustrative Rivet heatmap + caption.
 * Live authenticated dashboards use real workspace queries instead.
 */
export function MarketingDemoDashboardStrip({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-zinc-800 bg-zinc-950/80 p-5 text-zinc-100", className)}>
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
        {COPY.dashboard.marketingDemoCaption}
      </p>
      <div className="mt-4 [&_.rounded-xl]:border-zinc-800 [&_.rounded-xl]:bg-zinc-900/40 [&_span.text-lg]:text-zinc-50">
        <DependencyHeatmap categories={LANDING_DEMO_HEATMAP} />
      </div>
    </div>
  )
}
