import { AlertTriangle, Check, Minus } from "lucide-react"

import { DEMO_QUALITY_AUDIT } from "@/lib/operational-preview/demo-data"

function ResultCell({ result }: { result: "pass" | "watch" | "fail" }) {
  if (result === "pass") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/25 bg-emerald-500/[0.07] px-2 py-0.5 text-[0.65rem] font-medium text-emerald-900 dark:text-emerald-200/95">
        <Check className="size-3" aria-hidden />
        Pass
      </span>
    )
  }
  if (result === "watch") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/[0.08] px-2 py-0.5 text-[0.65rem] font-medium text-amber-950 dark:text-amber-200/95">
        <Minus className="size-3" aria-hidden />
        Watch
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-rose-500/25 bg-rose-500/[0.07] px-2 py-0.5 text-[0.65rem] font-medium text-rose-900 dark:text-rose-200/95">
      <AlertTriangle className="size-3" aria-hidden />
      Fail
    </span>
  )
}

export function QualityAuditPreview() {
  return (
    <div className="rounded-xl border border-border/60 bg-card/90 p-5 sm:p-6">
      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Standards · quality audit
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground">Line check (example)</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Same structure your leads can run before peak — pass/watch/fail with evidence, not vibes.
      </p>
      <div className="mt-4 overflow-hidden rounded-lg border border-border/50">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-muted/40 text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2">Check</th>
              <th className="px-3 py-2 text-right">Result</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_QUALITY_AUDIT.map((row) => (
              <tr key={row.check} className="border-b border-border/40 last:border-0">
                <td className="px-3 py-2.5 text-foreground/90">{row.check}</td>
                <td className="px-3 py-2.5 text-right">
                  <ResultCell result={row.result} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[0.65rem] leading-relaxed text-muted-foreground">
        Example only — build your real audit as a standard in{" "}
        <span className="font-medium text-foreground/90">Standards</span>.
      </p>
    </div>
  )
}
