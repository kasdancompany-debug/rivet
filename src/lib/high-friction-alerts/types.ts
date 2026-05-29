export type HighFrictionAlertSource =
  | "ask_rivet_repeat"
  | "interruption_repeat"
  | "quiz_question_fail"
  | "high_views_low_training"

export type HighFrictionRecommendationKind =
  | "add_photo"
  | "add_video"
  | "clarify_step"
  | "assign_training"
  | "create_new_play"

export type HighFrictionRecommendation = {
  kind: HighFrictionRecommendationKind
  label: string
  href: string
}

export type HighFrictionAlert = {
  id: string
  source: HighFrictionAlertSource
  headline: string
  detail: string
  count: number
  standardId: string | null
  standardTitle: string | null
  recommendations: HighFrictionRecommendation[]
  primaryHref: string
}

export type HighFrictionAlertsView = {
  businessId: string
  alerts: HighFrictionAlert[]
}
