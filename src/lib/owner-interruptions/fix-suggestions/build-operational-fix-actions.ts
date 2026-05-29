import type { OwnerInterruptionKind } from "@/types/database"

import type { RelatedModuleRef, RelatedStandardRef } from "@/lib/owner-interruptions/action-plan/types"
import type { InterruptionFixAction, InterruptionFixActionKind } from "@/lib/owner-interruptions/fix-suggestions/types"
import { COPY } from "@/lib/interface-copy"

const REPEAT_THRESHOLD = 2

function playCaptureHref(title: string, prompt: string): string {
  const params = new URLSearchParams()
  params.set("title", title)
  params.set("prompt", prompt)
  return `/sops/capture?${params.toString()}`
}

function trainingNewHref(title: string, description: string, standardId: string | null): string {
  const params = new URLSearchParams()
  params.set("title", title)
  if (description) params.set("description", description)
  if (standardId) params.set("standardId", standardId)
  return `/training/modules/new?${params.toString()}`
}

function playHref(standard: RelatedStandardRef): string {
  return standard.status === "draft" ? `/sops/capture/${standard.id}` : `/sops/${standard.id}`
}

function pushAction(
  actions: InterruptionFixAction[],
  kind: InterruptionFixActionKind,
  label: string,
  detail: string,
  href: string
) {
  if (actions.some((a) => a.kind === kind)) return
  actions.push({ kind, label, detail, href })
}

/** Bundle plays, media, training, and Ask Rivet for repeat owner pulls. */
export function buildOperationalFixActions(input: {
  label: string
  repeatCount: number
  kind: OwnerInterruptionKind | null
  suggestedTitle: string
  suggestedDescription: string
  capturePrompt: string
  relatedStandard: RelatedStandardRef | null
  relatedModule: RelatedModuleRef | null
  standardHasMedia: boolean
  askMatchCount: number
}): InterruptionFixAction[] {
  if (input.repeatCount < REPEAT_THRESHOLD) return []

  const actions: InterruptionFixAction[] = []
  const standard = input.relatedStandard
  const standardId = standard?.id ?? null

  if (!standardId) {
    pushAction(
      actions,
      "create_play",
      COPY.interruptions.fixActionCreatePlay,
      input.suggestedTitle,
      playCaptureHref(input.suggestedTitle, input.capturePrompt)
    )
  } else if (standard && !input.standardHasMedia) {
    pushAction(
      actions,
      "add_media",
      COPY.interruptions.fixActionAddMedia,
      standard.title,
      playHref(standard)
    )
  } else if (standard) {
    pushAction(
      actions,
      "improve_play",
      COPY.interruptions.fixActionImprovePlay,
      standard.title,
      playHref(standard)
    )
  }

  if (!input.relatedModule) {
    pushAction(
      actions,
      "assign_training",
      COPY.interruptions.fixActionAssignTraining,
      input.suggestedTitle,
      trainingNewHref(input.suggestedTitle, input.suggestedDescription, standardId)
    )
  } else {
    pushAction(
      actions,
      "assign_training",
      COPY.interruptions.fixActionAssignTrainingExisting(input.relatedModule.title),
      input.relatedModule.title,
      `/training/modules/${input.relatedModule.id}`
    )
  }

  if (input.askMatchCount > 0 || input.kind === "staff_ping") {
    const detail =
      input.askMatchCount > 0
        ? COPY.interruptions.fixActionAskRivetMatchDetail(input.askMatchCount)
        : COPY.interruptions.fixActionAskRivetDetail
    pushAction(actions, "wire_ask_rivet", COPY.interruptions.fixActionAskRivet, detail, "/ask")
  }

  const order: InterruptionFixActionKind[] = [
    "create_play",
    "improve_play",
    "add_media",
    "assign_training",
    "wire_ask_rivet",
  ]

  return actions.sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind))
}
