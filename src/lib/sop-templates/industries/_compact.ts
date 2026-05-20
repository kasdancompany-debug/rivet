import type { SopCategoryValue } from "@/lib/sops/categories"

import type { IndustryTemplateDraft } from "./_helpers"

export function compactSop(
  id: string,
  title: string,
  shortDescription: string,
  category: SopCategoryValue | string,
  steps: { title: string; instructions: string }[],
  opts?: { importance?: number; ownerDep?: number; minutes?: number }
): IndustryTemplateDraft {
  return {
    id,
    title,
    shortDescription,
    category: category as SopCategoryValue,
    importance_level: opts?.importance ?? 4,
    owner_dependency_level: opts?.ownerDep ?? 3,
    estimated_time_minutes: opts?.minutes ?? 35,
    walkthrough_minutes: Math.max(6, Math.min(14, steps.length * 2)),
    steps,
  }
}
