import type { Tables, TrainingProgressStatus } from "@/types/database"

export type MatrixCellStatus = "ready" | "learning" | "not_trained"

export type MatrixEmployeeColumn = {
  id: string
  name: string
  role: string
}

export type MatrixModuleRow = {
  id: string
  title: string
  assignedRole: string | null
}

export type MatrixCell = {
  employeeId: string
  moduleId: string
  status: MatrixCellStatus
  assigned: boolean
  progressStatus: TrainingProgressStatus | null
  progressPct: number | null
  certified: boolean
}

export type TeamReadinessMatrix = {
  employees: MatrixEmployeeColumn[]
  modules: MatrixModuleRow[]
  cells: MatrixCell[]
  roleOptions: { value: string; label: string }[]
}

export const MATRIX_STATUS_LABELS: Record<MatrixCellStatus, string> = {
  ready: "Ready",
  learning: "Learning",
  not_trained: "Not trained",
}

export function matrixCellStatus(input: {
  assigned: boolean
  certified: boolean
  progressStatus: TrainingProgressStatus | null
  progressPct: number | null
}): MatrixCellStatus {
  if (!input.assigned) return "not_trained"
  if (input.certified) return "ready"
  if (input.progressStatus === "completed") return "learning"
  if (input.progressStatus === "in_progress" || (input.progressPct ?? 0) > 0) return "learning"
  return "not_trained"
}

export function buildTeamReadinessMatrix(input: {
  employees: Pick<Tables<"profiles">, "id" | "full_name" | "role">[]
  modules: Pick<Tables<"training_modules">, "id" | "title" | "assigned_role">[]
  progress: Tables<"training_progress">[]
  certificationRows: Tables<"employee_module_certifications">[]
}): TeamReadinessMatrix {
  const employees: MatrixEmployeeColumn[] = input.employees.map((p) => ({
    id: p.id,
    name: p.full_name,
    role: p.role?.trim() || "",
  }))

  const modules: MatrixModuleRow[] = input.modules.map((m) => ({
    id: m.id,
    title: m.title,
    assignedRole: m.assigned_role,
  }))

  const progressKey = (empId: string, modId: string) => `${empId}:${modId}`
  const progressByKey = new Map(
    input.progress.map((p) => [
      progressKey(p.employee_id, p.training_module_id),
      p,
    ])
  )

  const certByKey = new Map(
    input.certificationRows.map((c) => [
      progressKey(c.employee_id, c.training_module_id),
      c,
    ])
  )

  const cells: MatrixCell[] = []
  for (const mod of modules) {
    for (const emp of employees) {
      const key = progressKey(emp.id, mod.id)
      const pr = progressByKey.get(key)
      const cert = certByKey.get(key)
      const assigned = Boolean(pr)
      const certified = Boolean(cert?.certified_at)

      let progressPct: number | null = null
      if (pr) {
        if (pr.status === "completed") progressPct = 100
        else if (pr.status === "in_progress") progressPct = 50
        else progressPct = 0
      }

      cells.push({
        employeeId: emp.id,
        moduleId: mod.id,
        status: matrixCellStatus({
          assigned,
          certified,
          progressStatus: pr?.status ?? null,
          progressPct,
        }),
        assigned,
        progressStatus: pr?.status ?? null,
        progressPct,
        certified,
      })
    }
  }

  const roleValues = new Set<string>()
  for (const m of modules) {
    roleValues.add(m.assignedRole?.trim() || "general")
  }
  const roleOptions = [
    { value: "all", label: "All roles" },
    ...[...roleValues]
      .sort((a, b) => a.localeCompare(b))
      .map((value) => ({
        value,
        label: value === "general" ? "General" : value.replace(/_/g, " "),
      })),
  ]

  return { employees, modules, cells, roleOptions }
}

export function filterMatrixByRole(
  matrix: TeamReadinessMatrix,
  roleFilter: string
): TeamReadinessMatrix {
  if (roleFilter === "all") return matrix
  const modules = matrix.modules.filter((m) => (m.assignedRole?.trim() || "general") === roleFilter)
  const moduleIds = new Set(modules.map((m) => m.id))
  const cells = matrix.cells.filter((c) => moduleIds.has(c.moduleId))
  return { ...matrix, modules, cells }
}

export function cellForMatrix(
  matrix: TeamReadinessMatrix,
  moduleId: string,
  employeeId: string
): MatrixCell | undefined {
  return matrix.cells.find((c) => c.moduleId === moduleId && c.employeeId === employeeId)
}
