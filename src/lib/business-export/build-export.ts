import type { Tables, TypedSupabaseClient } from "@/types/database"
import {
  BUSINESS_EXPORT_FORMAT_ID,
  BUSINESS_EXPORT_SCHEMA_VERSION,
} from "@/lib/business-export/format"
import type { BusinessDataExportPayload } from "@/lib/business-export/types"

function throwIfError(label: string, error: { message: string } | null) {
  if (error) throw new Error(`${label}: ${error.message}`)
}

async function inChunks<T>(
  ids: string[],
  chunkSize: number,
  fetchChunk: (chunk: string[]) => Promise<T[]>
): Promise<T[]> {
  if (ids.length === 0) return []
  const out: T[] = []
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize)
    out.push(...(await fetchChunk(chunk)))
  }
  return out
}

/** Supabase `.in()` URL length guard — stay under typical limits. */
const IN_CHUNK = 120

/**
 * Builds a versioned JSON snapshot of all business-scoped tables the web app uses.
 * Call only after the caller has verified the session may access `businessId` (RLS also applies).
 */
export async function buildBusinessDataExport(
  supabase: TypedSupabaseClient,
  businessId: string
): Promise<BusinessDataExportPayload> {
  const { data: businessRow, error: bizErr } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", businessId)
    .maybeSingle()

  throwIfError("businesses", bizErr)
  if (!businessRow) throw new Error("businesses: not found")
  const ownerId = businessRow.owner_id

  const [
    { data: profiles, error: profilesErr },
    { data: standards, error: standardsErr },
    { data: trainingModules, error: tmErr },
    { data: dailyChecklists, error: dcErr },
    { data: executionRecords, error: drErr },
    { data: bottlenecks, error: bottlenecksErr },
    { data: realityChecks, error: daErr },
    { data: ownerEscapePlans, error: oepErr },
    { data: employeeReadiness, error: erErr },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .or(`business_id.eq.${businessId},id.eq.${ownerId}`)
      .order("full_name", { ascending: true }),
    supabase.from("standards").select("*").eq("business_id", businessId).order("title"),
    supabase.from("training_modules").select("*").eq("business_id", businessId),
    supabase.from("daily_checklists").select("*").eq("business_id", businessId),
    supabase.from("execution_records").select("*").eq("business_id", businessId),
    supabase.from("bottlenecks").select("*").eq("business_id", businessId).order("created_at", { ascending: false }),
    supabase
      .from("reality_checks")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false }),
    supabase.from("owner_escape_plans").select("*").eq("business_id", businessId),
    supabase.from("employee_readiness").select("*").eq("business_id", businessId),
  ])

  throwIfError("profiles", profilesErr)
  throwIfError("standards", standardsErr)
  throwIfError("training_modules", tmErr)
  throwIfError("daily_checklists", dcErr)
  throwIfError("execution_records", drErr)
  throwIfError("bottlenecks", bottlenecksErr)
  throwIfError("reality_checks", daErr)
  throwIfError("owner_escape_plans", oepErr)
  throwIfError("employee_readiness", erErr)

  const profilesList = profiles ?? []
  const standardsList = standards ?? []
  const trainingModulesList = trainingModules ?? []
  const dailyChecklistsList = dailyChecklists ?? []
  const executionRecordsList = executionRecords ?? []
  const bottlenecksList = bottlenecks ?? []
  const realityChecksList = realityChecks ?? []
  const ownerEscapePlansList = ownerEscapePlans ?? []
  const employeeReadinessList = employeeReadiness ?? []

  const sopIds = standardsList.map((s) => s.id)
  const moduleIds = trainingModulesList.map((m) => m.id)
  const checklistIds = dailyChecklistsList.map((c) => c.id)
  const runIds = executionRecordsList.map((r) => r.id)
  const planIds = ownerEscapePlansList.map((p) => p.id)

  const profileIds = profilesList.map((p) => p.id)

  const [standardSteps, trainingItems, dailyChecklistItems, ownerEscapePlanTasks] = await Promise.all([
    inChunks<Tables<"standard_steps">>(sopIds, IN_CHUNK, async (chunk) => {
      const { data, error } = await supabase.from("standard_steps").select("*").in("standard_id", chunk)
      throwIfError("standard_steps", error)
      return data ?? []
    }),
    inChunks<Tables<"training_items">>(moduleIds, IN_CHUNK, async (chunk) => {
      const { data, error } = await supabase.from("training_items").select("*").in("module_id", chunk)
      throwIfError("training_items", error)
      return data ?? []
    }),
    inChunks<Tables<"daily_checklist_items">>(checklistIds, IN_CHUNK, async (chunk) => {
      const { data, error } = await supabase
        .from("daily_checklist_items")
        .select("*")
        .in("checklist_id", chunk)
      throwIfError("daily_checklist_items", error)
      return data ?? []
    }),
    inChunks<Tables<"owner_escape_plan_tasks">>(planIds, IN_CHUNK, async (chunk) => {
      const { data, error } = await supabase
        .from("owner_escape_plan_tasks")
        .select("*")
        .in("plan_id", chunk)
      throwIfError("owner_escape_plan_tasks", error)
      return data ?? []
    }),
  ])

  const itemIds = trainingItems.map((t) => t.id)

  const [executionRecordItems, employeeTrainingProgress, employeeTrainingSopCompletions] =
    await Promise.all([
      inChunks<Tables<"execution_record_items">>(runIds, IN_CHUNK, async (chunk) => {
        const { data, error } = await supabase
          .from("execution_record_items")
          .select("*")
          .in("execution_record_id", chunk)
        throwIfError("execution_record_items", error)
        return data ?? []
      }),
      inChunks<Tables<"training_progress">>(moduleIds, IN_CHUNK, async (chunk) => {
        const { data, error } = await supabase
          .from("training_progress")
          .select("*")
          .in("training_module_id", chunk)
        throwIfError("training_progress", error)
        return data ?? []
      }),
      (async () => {
        if (itemIds.length === 0 || profileIds.length === 0) return []
        const rows: Tables<"employee_training_sop_completions">[] = []
        for (const itemChunk of Array.from(
          { length: Math.ceil(itemIds.length / IN_CHUNK) },
          (_, i) => itemIds.slice(i * IN_CHUNK, i * IN_CHUNK + IN_CHUNK)
        )) {
          const { data, error } = await supabase
            .from("employee_training_sop_completions")
            .select("*")
            .in("training_item_id", itemChunk)
            .in("employee_id", profileIds)
          throwIfError("employee_training_sop_completions", error)
          rows.push(...(data ?? []))
        }
        return rows
      })(),
    ])

  const payload: BusinessDataExportPayload = {
    format: BUSINESS_EXPORT_FORMAT_ID,
    schemaVersion: BUSINESS_EXPORT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    generator: "rivet-web",
    business: { row: businessRow },
    dataset: {
      profiles: profilesList,
      standards: standardsList,
      standard_steps: standardSteps,
      training_modules: trainingModulesList,
      training_items: trainingItems,
      training_progress: employeeTrainingProgress,
      employee_training_sop_completions: employeeTrainingSopCompletions,
      employee_readiness: employeeReadinessList,
      daily_checklists: dailyChecklistsList,
      daily_checklist_items: dailyChecklistItems,
      execution_records: executionRecordsList,
      execution_record_items: executionRecordItems,
      bottlenecks: bottlenecksList,
      reality_checks: realityChecksList,
      owner_escape_plans: ownerEscapePlansList,
      owner_escape_plan_tasks: ownerEscapePlanTasks,
    },
  }

  return payload
}
