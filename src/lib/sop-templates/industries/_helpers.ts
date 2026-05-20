import type { IndustryId, SopStarterTemplate } from "../types"

export type IndustryTemplateDraft = Omit<SopStarterTemplate, "industryId">

export function withIndustry(industryId: IndustryId, templates: IndustryTemplateDraft[]): SopStarterTemplate[] {
  return templates.map((t) => ({ ...t, industryId }))
}
