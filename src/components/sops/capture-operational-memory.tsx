"use client"

import type { OperationalMemory } from "@/lib/standards-capture/types"
import { COPY } from "@/lib/interface-copy"
import type { StandardMediaRowSigned } from "@/lib/standards/standard-media-types"
import { MediaUploadZone } from "@/components/sops/media-upload-zone"
import { EXAMPLE_ACCEPT } from "@/components/sops/capture-play-media-section"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export type OperationalMemoryState = OperationalMemory & {
  newHireMistakesText: string
}

export function emptyOperationalMemoryState(): OperationalMemoryState {
  return {
    successLooksLike: "",
    failureLooksLike: "",
    newHireMistakes: [],
    newHireMistakesText: "",
    ifNobodyAsks: "",
    ownerNote: "",
    goodExampleMediaId: null,
    badExampleMediaId: null,
  }
}

export function operationalMemoryFromState(state: OperationalMemoryState): OperationalMemory {
  const mistakes = state.newHireMistakesText
    .split("\n")
    .map((m) => m.trim())
    .filter(Boolean)
    .slice(0, 8)
  return {
    successLooksLike: state.successLooksLike.trim(),
    failureLooksLike: state.failureLooksLike.trim(),
    newHireMistakes: mistakes,
    ifNobodyAsks: state.ifNobodyAsks.trim(),
    ownerNote: state.ownerNote?.trim() || undefined,
    goodExampleMediaId: state.goodExampleMediaId ?? null,
    badExampleMediaId: state.badExampleMediaId ?? null,
  }
}

type Props = {
  state: OperationalMemoryState
  onChange: (patch: Partial<OperationalMemoryState>) => void
  onUploadGood: (file: File) => Promise<void>
  onUploadBad: (file: File) => Promise<void>
  onRemoveGood?: () => void
  onRemoveBad?: () => void
  goodExampleMedia?: StandardMediaRowSigned | null
  badExampleMedia?: StandardMediaRowSigned | null
  uploadPending?: boolean
  canUpload: boolean
}

export function CaptureOperationalMemory({
  state,
  onChange,
  onUploadGood,
  onUploadBad,
  onRemoveGood,
  onRemoveBad,
  goodExampleMedia,
  badExampleMedia,
  uploadPending,
  canUpload,
}: Props) {
  return (
    <section className="space-y-5 rounded-2xl border border-primary/20 bg-primary/[0.03] p-5 sm:p-6">
      <div>
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-primary/80">
          {COPY.product.arc[1]?.label} · {COPY.askRivet.eyebrow}
        </p>
        <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
          Teach Rivet how this play works on the floor
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Required before publish. Crew asks Rivet in plain language—these fields become instant answers.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="success-looks-like">What does success look like?</Label>
        <Textarea
          id="success-looks-like"
          value={state.successLooksLike}
          onChange={(e) => onChange({ successLooksLike: e.target.value })}
          placeholder="Observable finish state — what a shift lead would sign off on"
          className="min-h-[4.5rem]"
        />
      </div>

      <MediaUploadZone
        label="Good example photo or video"
        description="What done-right looks like on the floor."
        accept={EXAMPLE_ACCEPT}
        media={goodExampleMedia}
        canUpload={canUpload}
        uploadPending={uploadPending}
        onUpload={(file) => void onUploadGood(file)}
        onRemove={onRemoveGood}
        uploadLabel="Upload good example"
        replaceLabel="Replace good example"
        previewAspect="video"
      />

      <div className="space-y-1.5">
        <Label htmlFor="failure-looks-like">What does failure look like?</Label>
        <Textarea
          id="failure-looks-like"
          value={state.failureLooksLike}
          onChange={(e) => onChange({ failureLooksLike: e.target.value })}
          placeholder="The visible miss that pulls the owner back in"
          className="min-h-[4.5rem]"
        />
      </div>

      <MediaUploadZone
        label="Bad example photo or video"
        description="The miss you want crew to catch before it ships."
        accept={EXAMPLE_ACCEPT}
        media={badExampleMedia}
        canUpload={canUpload}
        uploadPending={uploadPending}
        onUpload={(file) => void onUploadBad(file)}
        onRemove={onRemoveBad}
        uploadLabel="Upload bad example"
        replaceLabel="Replace bad example"
        previewAspect="video"
      />

      <div className="space-y-1.5">
        <Label htmlFor="new-hire-mistakes">What mistakes do new hires make?</Label>
        <Textarea
          id="new-hire-mistakes"
          value={state.newHireMistakesText}
          onChange={(e) => onChange({ newHireMistakesText: e.target.value })}
          placeholder="One mistake per line"
          className="min-h-[4.5rem]"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="if-nobody-asks">What should happen if nobody asks for help?</Label>
        <Textarea
          id="if-nobody-asks"
          value={state.ifNobodyAsks}
          onChange={(e) => onChange({ ifNobodyAsks: e.target.value })}
          placeholder="Escalation path — shift lead, checklist hold, do not ship"
          className="min-h-[4.5rem]"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="owner-note">Owner note (optional)</Label>
        <Textarea
          id="owner-note"
          value={state.ownerNote ?? ""}
          onChange={(e) => onChange({ ownerNote: e.target.value })}
          placeholder="Context only you know — vendor quirks, seasonal exceptions"
          className="min-h-[3.5rem]"
        />
      </div>
    </section>
  )
}
