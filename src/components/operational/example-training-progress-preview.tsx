import { DEMO_TRAINING_MODULES } from "@/lib/operational-preview/demo-data"

export function ExampleTrainingProgressPreview() {
  return (
    <div className="rounded-xl border border-border/60 bg-card/90 p-5">
      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Training · example progress bars
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground">Modules tied to standards</p>
      <ul className="mt-4 space-y-4">
        {DEMO_TRAINING_MODULES.map((m) => (
          <li key={m.title}>
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-medium text-foreground">{m.title}</span>
              <span className="tabular-nums text-muted-foreground">{m.pct}%</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-foreground/70"
                style={{ width: `${m.pct}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[0.65rem] leading-relaxed text-muted-foreground">
        Example layout — real bars fill from assigned modules in{" "}
        <span className="font-medium text-foreground/90">Training</span>.
      </p>
    </div>
  )
}
