import { computeSopImpactIfMissing } from "@/lib/sops/sop-impact-if-missing"
import type { Tables } from "@/types/database"

export function SopImpactIfMissingBlock({ sop }: { sop: Tables<"standards"> }) {
  const impacts = computeSopImpactIfMissing(sop)

  return (
    <div className="space-y-1.5">
      <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
        Impact if missing
      </p>
      <ul className="space-y-1">
        {impacts.map((line) => (
          <li key={line} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
            <span className="mt-0.5 shrink-0 text-foreground/45" aria-hidden>
              •
            </span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
