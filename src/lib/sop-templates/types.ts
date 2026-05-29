import type { SopCategoryValue } from "@/lib/sops/categories"

export type IndustryId =
  | "cafes"
  | "restaurant"
  | "cleaning"
  | "bakeries"
  | "salons"
  | "retail"
  | "service"
  | "contractors"
  | "auto_dealership"
  | "office"

export type SopTemplateStep = {
  title: string
  instructions: string
  /** Step needs a dated photo in your shop before sign-off. */
  requires_photo_confirmation?: boolean
  requires_video_proof?: boolean
  requires_manager_signoff?: boolean
  /** Defaults true when omitted (checklist tick required). */
  requires_checklist_completion?: boolean
}

export type SopStarterTemplate = {
  id: string
  /** When set, template belongs to an industry pack in the gallery. */
  industryId?: IndustryId
  title: string
  shortDescription: string
  category: SopCategoryValue
  importance_level: number
  owner_dependency_level: number
  estimated_time_minutes: number
  /** Shown in gallery as “About N min”. */
  walkthrough_minutes: number
  steps: SopTemplateStep[]
}
