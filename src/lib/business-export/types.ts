import type {
  BUSINESS_EXPORT_FORMAT_ID,
  BUSINESS_EXPORT_SCHEMA_VERSION,
} from "@/lib/business-export/format"
import type { Tables } from "@/types/database"

/**
 * Portable business snapshot for backup, migration, and future desktop hydration.
 * @see docs/architecture/desktop-local-first.md
 */
export type BusinessDataExportPayload = {
  format: typeof BUSINESS_EXPORT_FORMAT_ID
  schemaVersion: typeof BUSINESS_EXPORT_SCHEMA_VERSION
  exportedAt: string
  /** Where this file was produced (helps support). */
  generator: "rivet-web"
  business: {
    row: Tables<"businesses">
  }
  dataset: {
    profiles: Tables<"profiles">[]
    standards: Tables<"standards">[]
    standard_steps: Tables<"standard_steps">[]
    training_modules: Tables<"training_modules">[]
    training_items: Tables<"training_items">[]
    training_progress: Tables<"training_progress">[]
    employee_training_sop_completions: Tables<"employee_training_sop_completions">[]
    employee_readiness: Tables<"employee_readiness">[]
    daily_checklists: Tables<"daily_checklists">[]
    daily_checklist_items: Tables<"daily_checklist_items">[]
    execution_records: Tables<"execution_records">[]
    execution_record_items: Tables<"execution_record_items">[]
    bottlenecks: Tables<"bottlenecks">[]
    reality_checks: Tables<"reality_checks">[]
    owner_escape_plans: Tables<"owner_escape_plans">[]
    owner_escape_plan_tasks: Tables<"owner_escape_plan_tasks">[]
  }
}
