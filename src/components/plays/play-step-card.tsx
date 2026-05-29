"use client"

import { AlertTriangle, Check, ShieldCheck } from "lucide-react"

import { PlayMediaPreview } from "@/components/plays/play-media-preview"
import { PlayGoodBadExample } from "@/components/plays/play-good-bad"
import { parseStandardMediaApiId } from "@/lib/standards/standard-media-display"
import type { StandardMediaRowSigned } from "@/lib/standards/standard-media-types"
import type { StepProofRequirements } from "@/lib/completion-proof/types"
import type { StepPlayMetadata } from "@/lib/sops/play-metadata"
import { COPY } from "@/lib/interface-copy"
import { cn } from "@/lib/utils"

export type PlayStepView = {
  id: string
  index: number
  title: string
  instructions: string
  verification: string | null
  estimatedMinutes: number | null
  isCritical: boolean
  /** @deprecated Use proofRequirements.photo */
  requiresPhoto: boolean
  proofRequirements: StepProofRequirements
  mediaUrl: string | null
  playMetadata: StepPlayMetadata
  attachedMedia: StandardMediaRowSigned[]
}

type PlayStepCardProps = {
  step: PlayStepView
  completed: boolean
  onToggleComplete?: () => void
  /** Highlights this step in the run progress strip. */
  isActive?: boolean
  /** Staff reference mode — hide completion toggle. */
  readOnly?: boolean
}

export function PlayStepCard({
  step,
  completed,
  onToggleComplete,
  isActive,
  readOnly = false,
}: PlayStepCardProps) {
  const meta = step.playMetadata
  const mistakes = meta.commonMistakes ?? []
  const stepMedia = collectStepMedia(step)
  const mediaById = new Map(step.attachedMedia.map((m) => [m.id, m]))

  return (
    <article
      id={`play-step-${step.id}`}
      className={cn(
        "scroll-mt-28 overflow-hidden rounded-3xl bg-card shadow-sm ring-1 transition-shadow duration-300",
        completed
          ? "ring-emerald-500/35"
          : step.isCritical
            ? "ring-amber-500/40"
            : isActive
              ? "ring-primary/50 shadow-md"
              : "ring-border/50"
      )}
    >
      <div className="flex items-start gap-4 px-5 pb-2 pt-5 sm:px-6 sm:pt-6">
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-2xl text-lg font-bold tabular-nums transition-colors",
            completed
              ? "bg-emerald-500 text-white"
              : "bg-muted text-foreground"
          )}
          aria-hidden
        >
          {completed ? <Check className="size-6" strokeWidth={2.5} /> : step.index + 1}
        </div>
        <div className="min-w-0 flex-1 space-y-2 pb-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold leading-tight tracking-tight text-foreground sm:text-2xl">
              {step.title}
            </h2>
            {step.isCritical ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-950 dark:text-amber-100">
                <AlertTriangle className="size-3.5" aria-hidden />
                Critical
              </span>
            ) : null}
          </div>
          {step.estimatedMinutes != null ? (
            <p className="text-sm text-muted-foreground">~{step.estimatedMinutes} min</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-8 px-5 pb-5 sm:space-y-9 sm:px-6 sm:pb-6">
        <section>
          <p className="text-sm font-medium text-muted-foreground">What to do</p>
          <p className="mt-2 text-lg font-medium leading-relaxed text-foreground sm:text-xl sm:leading-relaxed">
            {step.instructions.trim() || "Follow the standard for this step."}
          </p>
        </section>

        {meta.whyItMatters ? (
          <section className="border-l-[3px] border-primary/30 pl-4">
            <p className="text-sm font-medium text-muted-foreground">Why it matters</p>
            <p className="mt-2 text-base leading-relaxed text-foreground">{meta.whyItMatters}</p>
          </section>
        ) : null}

        {meta.visualTarget ? (
          <section>
            <p className="text-sm font-medium text-muted-foreground">Visual target</p>
            <p className="mt-2 text-base font-medium leading-relaxed text-foreground">{meta.visualTarget}</p>
          </section>
        ) : null}

        {(meta.goodExample || meta.badExample) && (
          <PlayGoodBadExample good={meta.goodExample} bad={meta.badExample} mediaById={mediaById} />
        )}

        {mistakes.length > 0 ? (
          <section>
            <p className="text-sm font-medium text-muted-foreground">Common mistakes</p>
            <ul className="mt-3 space-y-2.5">
              {mistakes.map((m) => (
                <li
                  key={m}
                  className="flex gap-3 text-[15px] leading-snug text-foreground before:mt-2 before:size-1.5 before:shrink-0 before:rounded-full before:bg-amber-500/80"
                >
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {step.verification ? (
          <section
            className="rounded-2xl bg-emerald-500/[0.06] px-4 py-4 ring-1 ring-emerald-500/20 sm:px-5"
            aria-label="Verification requirement"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900 dark:text-emerald-100">
              <ShieldCheck className="size-4 shrink-0" aria-hidden />
              Verification
            </div>
            <p className="mt-2 text-base font-medium leading-relaxed text-foreground">{step.verification}</p>
          </section>
        ) : null}

        {stepMedia.length > 0 ? (
          <section>
            <p className="text-sm font-medium text-muted-foreground">Attached media</p>
            <ul className="mt-3 space-y-3">
              {stepMedia.map((m) => (
                <li key={m.id} className="overflow-hidden rounded-2xl ring-1 ring-border/50">
                  <PlayMediaPreview media={m} aspect="auto" />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {step.proofRequirements.photo ||
        step.proofRequirements.video ||
        step.proofRequirements.manager_signoff ||
        step.proofRequirements.checklist ? (
          <p className="text-sm text-muted-foreground">
            {[

              step.proofRequirements.checklist ? COPY.completionProof.proofChecklist : null,

              step.proofRequirements.photo ? COPY.completionProof.proofPhoto : null,

              step.proofRequirements.video ? COPY.completionProof.proofVideo : null,

              step.proofRequirements.manager_signoff ? COPY.completionProof.proofSignoff : null,

            ]

              .filter(Boolean)

              .join(" · ")}{" "}

            required before you mark complete.

          </p>

        ) : null}

        {!readOnly ? (
          <button
            type="button"
            onClick={onToggleComplete}
            aria-pressed={completed}
            className={cn(
              "flex w-full min-h-[3.5rem] items-center justify-center gap-3 rounded-2xl px-5 py-4 text-base font-semibold transition-all active:scale-[0.99]",
              completed
                ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/25"
                : "bg-foreground text-background hover:opacity-95"
            )}
          >
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-lg border-2 transition-colors",
                completed
                  ? "border-white/40 bg-white/20"
                  : "border-background/30 bg-transparent"
              )}
            >
              {completed ? <Check className="size-4" strokeWidth={3} aria-hidden /> : null}
            </span>
            {completed ? "Step complete" : "Mark step complete"}
          </button>
        ) : null}
      </div>
    </article>
  )
}

function collectStepMedia(step: PlayStepView): StandardMediaRowSigned[] {
  const excludeIds = new Set<string>()
  if (step.playMetadata.goodExample?.mediaId) excludeIds.add(step.playMetadata.goodExample.mediaId)
  if (step.playMetadata.badExample?.mediaId) excludeIds.add(step.playMetadata.badExample.mediaId)

  const seen = new Set<string>()
  const out: StandardMediaRowSigned[] = []

  for (const m of step.attachedMedia) {
    if (excludeIds.has(m.id) || seen.has(m.id)) continue
    seen.add(m.id)
    out.push(m)
  }

  if (step.mediaUrl) {
    const id = parseStandardMediaApiId(step.mediaUrl)
    if (id && !excludeIds.has(id)) {
      const attached = step.attachedMedia.find((m) => m.id === id)
      if (attached && !seen.has(attached.id)) {
        seen.add(attached.id)
        out.unshift(attached)
      }
    }
  }

  return out
}
