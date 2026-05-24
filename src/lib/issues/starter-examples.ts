import type { LucideIcon } from "lucide-react"
import {
  CalendarClock,
  Coffee,
  GraduationCap,
  PackageMinus,
  UserRound,
  Wrench,
} from "lucide-react"

import { formatIssueCategory } from "@/lib/issues/constants"
import type { IssueCategorySlug } from "@/lib/issues/constants"

export type IssueStarterExample = {
  id: IssueCategorySlug
  title: string
  categoryLabel: string
  icon: LucideIcon
}

function example(id: IssueCategorySlug, title: string, icon: LucideIcon): IssueStarterExample {
  return {
    id,
    title,
    categoryLabel: formatIssueCategory(id),
    icon,
  }
}

export const ISSUE_STARTER_EXAMPLES: IssueStarterExample[] = [
  example("customer_complaint", "Customer exceptions", UserRound),
  example("inventory", "Inventory shortages", PackageMinus),
  example("staff_question", "Training gaps", GraduationCap),
  example("equipment", "Equipment failures", Wrench),
  example("scheduling", "Scheduling confusion", CalendarClock),
  example("product_quality", "Drink remakes", Coffee),
]
