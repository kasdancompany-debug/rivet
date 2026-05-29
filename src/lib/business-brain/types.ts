export type BusinessBrainEventKind =
  | "sop_change"
  | "training_completion"
  | "certification"
  | "question_prevented"
  | "interruptions_reduced"
  | "escape_readiness_change"

export type BusinessBrainTimelineItem = {
  id: string
  kind: BusinessBrainEventKind
  at: string
  timeLabel: string
  title: string
  detail: string | null
  href: string | null
}

export type BusinessBrainTimelineView = {
  items: BusinessBrainTimelineItem[]
  countsByKind: Record<BusinessBrainEventKind, number>
}
