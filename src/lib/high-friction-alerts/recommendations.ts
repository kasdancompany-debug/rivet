import type {
  HighFrictionAlertSource,
  HighFrictionRecommendation,
  HighFrictionRecommendationKind,
} from "@/lib/high-friction-alerts/types"

type RecContext = {
  source: HighFrictionAlertSource
  standardId: string | null
  standardTitle: string | null
  topicLabel: string
}

function hrefFor(kind: HighFrictionRecommendationKind, ctx: RecContext): string {
  const std = ctx.standardId
  const title = encodeURIComponent(ctx.standardTitle ?? ctx.topicLabel)
  switch (kind) {
    case "add_photo":
      return std ? `/sops/${std}` : `/sops/capture?title=${title}`
    case "add_video":
      return std ? `/sops/${std}` : `/sops/capture?title=${title}`
    case "clarify_step":
      return std ? `/sops/${std}/edit` : `/sops/capture?title=${title}`
    case "assign_training":
      return std ? `/sops/${std}/training` : `/training/modules/new?title=${title}`
    case "create_new_play":
      return `/sops/capture?title=${title}`
  }
}

function rec(kind: HighFrictionRecommendationKind, label: string, ctx: RecContext): HighFrictionRecommendation {
  return { kind, label, href: hrefFor(kind, ctx) }
}

export function buildAlertRecommendations(ctx: RecContext): HighFrictionRecommendation[] {
  const hasPlay = Boolean(ctx.standardId)

  switch (ctx.source) {
    case "ask_rivet_repeat":
      if (!hasPlay) {
        return [
          rec("create_new_play", "Create new play", ctx),
          rec("clarify_step", "Clarify step", ctx),
          rec("add_photo", "Add photo", ctx),
        ]
      }
      return [
        rec("clarify_step", "Clarify step", ctx),
        rec("add_photo", "Add photo", ctx),
        rec("add_video", "Add video", ctx),
        rec("assign_training", "Assign training", ctx),
      ]
    case "interruption_repeat":
      return [
        rec("create_new_play", "Create new play", ctx),
        rec("assign_training", "Assign training", ctx),
        rec("clarify_step", "Clarify step", ctx),
      ]
    case "quiz_question_fail":
      return [
        rec("clarify_step", "Clarify step", ctx),
        rec("add_video", "Add video", ctx),
        rec("assign_training", "Assign training", ctx),
      ]
    case "high_views_low_training":
      return [
        rec("add_video", "Add video", ctx),
        rec("add_photo", "Add photo", ctx),
        rec("assign_training", "Assign training", ctx),
        rec("clarify_step", "Clarify step", ctx),
      ]
  }
}

export function primaryHrefForAlert(
  ctx: RecContext,
  recommendations: HighFrictionRecommendation[]
): string {
  return recommendations[0]?.href ?? hrefFor("create_new_play", ctx)
}
