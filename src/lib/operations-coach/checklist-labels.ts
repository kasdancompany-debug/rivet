import type { DailyChecklistType } from "@/types/database"

const LABELS: Record<DailyChecklistType, string> = {
  opening: "Opening",
  closing: "Closing",
  cleaning: "Cleaning",
  production: "Production",
  quality_check: "Quality check",
}

export function labelForChecklistType(type: DailyChecklistType): string {
  return LABELS[type] ?? type
}
