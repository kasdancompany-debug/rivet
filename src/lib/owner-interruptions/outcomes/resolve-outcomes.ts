import type { StandardStatus, Tables } from "@/types/database"

import type { InterruptionOutcomeItem } from "@/lib/owner-interruptions/outcomes/types"

type StandardRow = Pick<Tables<"standards">, "id" | "title" | "status">
type ModuleRow = Pick<Tables<"training_modules">, "id" | "title">
type ProgressRow = Pick<Tables<"training_progress">, "training_module_id">

export function resolveInterruptionOutcomes(input: {
  plan: Tables<"interruption_action_plans">
  interruptionSummary: string
  standards: StandardRow[]
  modules: ModuleRow[]
  trainingProgress: ProgressRow[]
  askStandardId: string | null
  askVerified: boolean
  standardHasMedia?: boolean
}): InterruptionOutcomeItem[] {
  const standardById = new Map(input.standards.map((s) => [s.id, s]))
  const moduleById = new Map(input.modules.map((m) => [m.id, m]))
  const assignedModuleIds = new Set(input.trainingProgress.map((p) => p.training_module_id))

  const resolvedPlayId =
    input.plan.draft_standard_id ??
    input.plan.related_standard_id ??
    input.askStandardId

  const play = resolvedPlayId ? standardById.get(resolvedPlayId) : null
  const moduleId = input.plan.draft_module_id ?? input.plan.related_module_id
  const module = moduleId ? moduleById.get(moduleId) : null

  const sopComplete = Boolean(play && play.status !== "archived")
  const sopPublished = play?.status === "active"
  const trainingComplete = Boolean(moduleId && assignedModuleIds.has(moduleId))
  const askComplete =
    input.askVerified ||
    Boolean(
      play &&
        play.status === "active" &&
        (input.plan.fix_type === "sop" || input.askStandardId === play.id)
    )

  const mediaComplete = Boolean(play && (input.standardHasMedia ?? false))

  return [
    {
      kind: "sop_created",
      label: sopPublished ? "Play published" : "Play drafted",
      detail: play?.title ?? null,
      href: play ? playHref(play.id, play.status) : null,
      complete: sopComplete,
    },
    {
      kind: "media_added",
      label: mediaComplete ? "Video example on play" : "Add video example",
      detail: play?.title ?? null,
      href: play ? playHref(play.id, play.status) : null,
      complete: mediaComplete,
    },
    {
      kind: "training_assigned",
      label: "Training assigned",
      detail: module?.title ?? null,
      href: module ? `/training/modules/${module.id}` : null,
      complete: trainingComplete,
    },
    {
      kind: "ask_rivet_answer",
      label: "Ask Rivet answer added",
      detail: askComplete && play ? play.title : null,
      href: askComplete && play ? `/ask` : play ? playHref(play.id, play.status) : "/ask",
      complete: askComplete,
    },
  ]
}

function playHref(id: string, status: StandardStatus): string {
  return status === "draft" ? `/sops/capture/${id}` : `/sops/${id}`
}

export function buildRecommendations(input: {
  repeatCount: number
  fixType: Tables<"interruption_action_plans">["fix_type"]
  relatedStandard: { title: string } | null
  relatedModule: { title: string } | null
  standardHasMedia: boolean
  askMatchCount: number
  kind: Tables<"owner_interruptions">["kind"] | null
}): {
  suggestNewPlay: boolean
  suggestTraining: boolean
  suggestMedia: boolean
  suggestAskRivet: boolean
} {
  return {
    suggestNewPlay: !input.relatedStandard && input.fixType === "sop",
    suggestMedia: Boolean(input.relatedStandard) && !input.standardHasMedia,
    suggestTraining:
      input.fixType === "training_module" ||
      input.repeatCount >= 2 ||
      Boolean(input.relatedModule),
    suggestAskRivet:
      input.kind === "staff_ping" ||
      input.askMatchCount > 0 ||
      (input.repeatCount >= 2 && input.fixType === "sop"),
  }
}
