import type { LucideIcon } from "lucide-react"

import type { IndustryId } from "@/lib/sop-templates/types"
import type { OwnerInterruptionKind } from "@/types/database"

/** Rivet onboarding industry cards (8 verticals). */
export type RivetIndustryTemplateId =
  | "cafe"
  | "restaurant"
  | "cleaning"
  | "contractor"
  | "auto_dealership"
  | "salon"
  | "retail"
  | "office"

export type IndustryTemplateCard = {
  id: RivetIndustryTemplateId
  name: string
  subtitle: string
  icon: LucideIcon
  /** Maps to `businesses.industry` and SOP pack id. */
  sopPackId: IndustryId
}

export type IndustryTrainingModuleTemplate = {
  title: string
  description: string
  assignedRole: string
  /** Starter template ids linked as training_items after install. */
  standardTemplateIds: string[]
}

export type IndustryInterruptionWorkflowTemplate = {
  title: string
  kind: OwnerInterruptionKind
  summary: string
  detail: string
}

export type IndustryIssueWorkflowTemplate = {
  title: string
  category: string
  severity: string
  description: string
}

export type IndustryTemplateBundle = {
  id: RivetIndustryTemplateId
  sopPackId: IndustryId
  /** Exactly 12 starter SOP template ids to install. */
  sopTemplateIds: readonly string[]
  trainingModules: readonly IndustryTrainingModuleTemplate[]
  interruptionWorkflows: readonly IndustryInterruptionWorkflowTemplate[]
  issueWorkflows: readonly IndustryIssueWorkflowTemplate[]
}

export type IndustryTemplateInstallCounts = {
  sops: number
  trainingModules: number
  interruptionWorkflows: number
  issueWorkflows: number
}
