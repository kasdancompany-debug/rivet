import {
  computeSopDependencyRisk,
  dependencyRiskBandStyles,
} from "@/lib/sops/dependency-risk-score"
import type { SopPlayCompletion } from "@/lib/sops/sop-play-completion"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Tables } from "@/types/database"

export function SopDependencyRiskBlock({
  sop,
  stepCount,
  playCompletion,
}: {
  sop: Tables<"standards">
  stepCount?: number
  playCompletion?: Pick<SopPlayCompletion, "documentation" | "training" | "ownership" | "overall">
}) {
  const risk = computeSopDependencyRisk(sop, stepCount, playCompletion)
  const styles = dependencyRiskBandStyles(risk.band)

  return (
    <div className="space-y-2 border-t border-border/40 pt-3">
      <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
        Dependency Risk Score (0–100)
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <p className={cn("text-xl font-semibold tabular-nums tracking-tight", styles.score)}>
          {risk.score}
        </p>
        <Badge variant="outline" className={cn("rounded-full text-[0.65rem] font-semibold", styles.badge)}>
          {risk.bandLabel}
        </Badge>
      </div>

      <div className="space-y-1.5 pt-1">
        <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
          Why this score
        </p>
        <ul className="space-y-1">
          {risk.causes.map((cause) => (
            <li key={cause} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
              <span className={cn("mt-1.5 size-1 shrink-0 rounded-full", styles.dot)} aria-hidden />
              <span>{cause}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
