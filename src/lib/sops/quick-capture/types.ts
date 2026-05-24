import type { SopCategoryValue } from "@/lib/sops/categories"

export type QuickCaptureStep = {
  title: string
  instructions: string
}

export type QuickCaptureDraft = {
  title: string
  category: SopCategoryValue
  purpose: string
  steps: QuickCaptureStep[]
  trainingCheckpoints: string[]
  assignedRoles: string[]
  estimatedTimeMinutes: number
  ownerDependencyLevel: number
  importanceLevel: number
}

export type QuickCaptureSource = "openai" | "heuristic"
