import { Checkbox } from "@/components/ui/checkbox"
import { COPY } from "@/lib/interface-copy"

export type StepProofRequirementValues = {
  requiresPhoto: boolean
  requiresVideo: boolean
  requiresManagerSignoff: boolean
  requiresChecklist: boolean
}

export function StepProofRequirementFields({
  values,
  onChange,
  compact = false,
}: {
  values: StepProofRequirementValues
  onChange: (patch: Partial<StepProofRequirementValues>) => void
  compact?: boolean
}) {
  const p = COPY.completionProof

  return (
    <div
      className={
        compact
          ? "flex flex-col gap-2 rounded-lg border border-border/50 bg-muted/15 px-3 py-3"
          : "flex flex-col gap-2.5 rounded-lg border border-border/50 bg-muted/15 px-3 py-3"
      }
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {p.requirementsHeading}
      </p>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
        <Checkbox
          checked={values.requiresChecklist}
          onCheckedChange={(c) => onChange({ requiresChecklist: Boolean(c) })}
        />
        {p.requireChecklist}
      </label>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
        <Checkbox
          checked={values.requiresPhoto}
          onCheckedChange={(c) => onChange({ requiresPhoto: Boolean(c) })}
        />
        {p.requirePhoto}
      </label>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
        <Checkbox
          checked={values.requiresVideo}
          onCheckedChange={(c) => onChange({ requiresVideo: Boolean(c) })}
        />
        {p.requireVideo}
      </label>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
        <Checkbox
          checked={values.requiresManagerSignoff}
          onCheckedChange={(c) => onChange({ requiresManagerSignoff: Boolean(c) })}
        />
        {p.requireManagerSignoff}
      </label>
    </div>
  )
}
