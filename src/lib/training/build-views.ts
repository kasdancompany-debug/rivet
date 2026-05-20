import type { TrainingModuleDeep } from "@/lib/db/queries"
import type {
  Tables,
  TrainingProgressStatus,
  ReadinessBadge,
} from "@/types/database"

export type AssignedSopRow = {
  trainingItemId: string
  moduleId: string
  title: string
  completed: boolean
}

export type ModuleProgressView = {
  moduleId: string
  title: string
  assignedRole: string | null
  progressId: string
  status: TrainingProgressStatus
  requiredTotal: number
  requiredDone: number
  pct: number | null
  completedSopTitles: string[]
  remainingSopTitles: string[]
  sopRows: AssignedSopRow[]
}

export type EmployeeTrainingViewModel = {
  profile: Tables<"profiles">
  modules: ModuleProgressView[]
  aggregatePct: number | null
  readiness: {
    open_alone: ReadinessBadge
    close_alone: ReadinessBadge
    train_others: ReadinessBadge
    handle_complaints: ReadinessBadge
  }
}

const DEFAULT_READINESS: EmployeeTrainingViewModel["readiness"] = {
  open_alone: "not_ready",
  close_alone: "not_ready",
  train_others: "not_ready",
  handle_complaints: "not_ready",
}

function sopTitle(item: TrainingModuleDeep["training_items"][0]): string {
  return item.standards?.title?.trim() || "Untitled standard"
}

export function buildEmployeeTrainingViewModel(
  profile: Tables<"profiles">,
  progressRows: Tables<"training_progress">[],
  modulesById: Map<string, TrainingModuleDeep>,
  completions: Tables<"employee_training_sop_completions">[],
  readinessRow: Tables<"employee_readiness"> | undefined
): EmployeeTrainingViewModel {
  const myCompletionSet = new Set(
    completions.filter((c) => c.employee_id === profile.id).map((c) => c.training_item_id)
  )

  const modules: ModuleProgressView[] = []

  for (const pr of progressRows) {
    if (pr.employee_id !== profile.id) continue
    const mod = modulesById.get(pr.training_module_id)
    if (!mod) continue

    const required = (mod.training_items ?? []).filter((t) => t.required)
    const requiredIds = required.map((t) => t.id)
    const doneCount = requiredIds.filter((id) => myCompletionSet.has(id)).length
    const total = required.length
    const pct =
      total === 0 ? (pr.status === "completed" ? 100 : null) : Math.round((doneCount / total) * 100)

    const completedSopTitles: string[] = []
    const remainingSopTitles: string[] = []
    const sopRows: AssignedSopRow[] = []
    for (const item of required) {
      const title = sopTitle(item)
      const completed = myCompletionSet.has(item.id)
      sopRows.push({
        trainingItemId: item.id,
        moduleId: mod.id,
        title,
        completed,
      })
      if (completed) completedSopTitles.push(title)
      else remainingSopTitles.push(title)
    }

    modules.push({
      moduleId: mod.id,
      title: mod.title,
      assignedRole: mod.assigned_role,
      progressId: pr.id,
      status: pr.status,
      requiredTotal: total,
      requiredDone: doneCount,
      pct,
      completedSopTitles,
      remainingSopTitles,
      sopRows,
    })
  }

  let sum = 0
  let n = 0
  for (const m of modules) {
    if (m.pct === null) continue
    sum += m.pct
    n += 1
  }
  const aggregatePct = n === 0 ? null : Math.round(sum / n)

  const readiness = readinessRow
    ? {
        open_alone: readinessRow.open_alone,
        close_alone: readinessRow.close_alone,
        train_others: readinessRow.train_others,
        handle_complaints: readinessRow.handle_complaints,
      }
    : DEFAULT_READINESS

  return {
    profile,
    modules,
    aggregatePct,
    readiness,
  }
}
