import type { TrainingModuleDeep } from "@/lib/db/queries"
import type { EmployeeTrainingViewModel, ModuleProgressView } from "@/lib/training/build-views"
import type { ModuleCertificationView } from "@/lib/training/certifications/build-views"
import {
  READINESS_CAPABILITY_FIELDS,
  READINESS_CAPABILITY_DISPLAY_LABELS,
  READINESS_READY_THRESHOLD,
  type ReadinessCapabilityField,
} from "@/lib/training/compute-readiness"
import { moduleMatchesField } from "@/lib/training/training-center-summary"
import { parseEmployeeLocation, parseEmployeeRoleOnly } from "@/lib/training/readiness-matrix/employee-location"
import type { Tables } from "@/types/database"

export type MatrixCellStatus = "ready" | "in_progress" | "not_trained" | "not_assigned"

export type MatrixRowKind = "skill" | "play" | "certification"

export type MatrixEmployeeColumn = {
  id: string
  name: string
  role: string
  roleOnly: string
  location: string
}

export type MatrixRow = {
  id: string
  kind: MatrixRowKind
  title: string
  subtitle: string | null
  moduleId: string | null
  standardId: string | null
  capabilityField: ReadinessCapabilityField | null
  assignedRole: string | null
}

export type MatrixCell = {
  employeeId: string
  rowId: string
  status: MatrixCellStatus
}

export type MatrixQuickAnswer = {
  id: string
  question: string
  description: string
  rowIds: string[]
  readyEmployeeIds: string[]
}

export type TeamReadinessMatrix = {
  businessName: string
  employees: MatrixEmployeeColumn[]
  rows: MatrixRow[]
  cells: MatrixCell[]
  roleOptions: { value: string; label: string }[]
  locationOptions: { value: string; label: string }[]
  certificationOptions: { value: string; label: string }[]
  quickAnswers: MatrixQuickAnswer[]
}

export const MATRIX_STATUS_LABELS: Record<MatrixCellStatus, string> = {
  ready: "Ready",
  in_progress: "In progress",
  not_trained: "Not trained",
  not_assigned: "Not assigned",
}

export const MATRIX_ROW_KIND_LABELS: Record<MatrixRowKind, string> = {
  skill: "Skills",
  play: "Plays",
  certification: "Certifications",
}

export function certificationCellStatus(
  assigned: boolean,
  cert: ModuleCertificationView | undefined
): MatrixCellStatus {
  if (!assigned) return "not_assigned"
  if (cert?.certified) return "ready"
  if (
    cert?.moduleCompleted ||
    cert?.quizzesPassed ||
    cert?.proofUploaded ||
    cert?.managerSignedOff
  ) {
    return "in_progress"
  }
  return "not_trained"
}

export function playCellStatus(
  assigned: boolean,
  completed: boolean,
  inProgress: boolean
): MatrixCellStatus {
  if (!assigned) return "not_assigned"
  if (completed) return "ready"
  if (inProgress) return "in_progress"
  return "not_trained"
}

export function skillCellStatus(
  relevantModules: ModuleProgressView[],
  capabilityScore: number,
  capabilityReady: boolean,
  certifiedOnRelevant: boolean
): MatrixCellStatus {
  if (relevantModules.length === 0) return "not_assigned"
  if (capabilityReady || certifiedOnRelevant || capabilityScore >= READINESS_READY_THRESHOLD) {
    return "ready"
  }
  const anyProgress = relevantModules.some(
    (m) =>
      m.status === "in_progress" ||
      (m.pct ?? 0) > 0 ||
      m.status === "completed"
  )
  if (anyProgress) return "in_progress"
  return "not_trained"
}

function relevantModulesForField(
  modules: ModuleProgressView[],
  field: ReadinessCapabilityField
): ModuleProgressView[] {
  return modules.filter((m) =>
    moduleMatchesField(
      {
        title: m.title,
        assignedRole: m.assignedRole,
        sopRows: m.sopRows.map((r) => ({
          title: r.title,
          completed: r.completed,
          standardCategory: r.standardCategory,
          standardId: r.standardId,
        })),
      },
      field
    )
  )
}

function collectPlayRows(modules: TrainingModuleDeep[]): MatrixRow[] {
  const byStandard = new Map<string, MatrixRow>()
  for (const mod of modules) {
    for (const item of mod.training_items ?? []) {
      const standardId = item.standard_id
      if (byStandard.has(standardId)) continue
      byStandard.set(standardId, {
        id: `play:${standardId}`,
        kind: "play",
        title: item.standards?.title?.trim() || "Play",
        subtitle: mod.title,
        moduleId: mod.id,
        standardId,
        capabilityField: null,
        assignedRole: mod.assigned_role,
      })
    }
  }
  return [...byStandard.values()].sort((a, b) => a.title.localeCompare(b.title))
}

function buildQuickAnswers(
  employees: MatrixEmployeeColumn[],
  rows: MatrixRow[],
  cells: MatrixCell[]
): MatrixQuickAnswer[] {
  const statusFor = (rowId: string, employeeId: string) =>
    cells.find((c) => c.rowId === rowId && c.employeeId === employeeId)?.status

  const readyForRow = (rowId: string) =>
    employees.filter((e) => statusFor(rowId, e.id) === "ready").map((e) => e.id)

  const openRow = rows.find((r) => r.capabilityField === "open_alone")
  const closeRow = rows.find((r) => r.capabilityField === "close_alone")
  const trainRow = rows.find((r) => r.capabilityField === "train_others")

  const backupReady = employees
    .filter((e) => {
      if (!openRow || !closeRow) return false
      return (
        statusFor(openRow.id, e.id) === "ready" &&
        statusFor(closeRow.id, e.id) === "ready"
      )
    })
    .map((e) => e.id)

  const answers: MatrixQuickAnswer[] = []
  if (openRow) {
    answers.push({
      id: "can_open",
      question: "Who can open?",
      description: "Ready on opening skills",
      rowIds: [openRow.id],
      readyEmployeeIds: readyForRow(openRow.id),
    })
  }
  if (closeRow) {
    answers.push({
      id: "can_close",
      question: "Who can close?",
      description: "Ready on closing skills",
      rowIds: [closeRow.id],
      readyEmployeeIds: readyForRow(closeRow.id),
    })
  }
  if (trainRow) {
    answers.push({
      id: "can_train",
      question: "Who can train others?",
      description: "Ready to train and certify others",
      rowIds: [trainRow.id],
      readyEmployeeIds: readyForRow(trainRow.id),
    })
  }
  answers.push({
    id: "backup",
    question: "Who is the backup?",
    description: "Ready to open and close without you",
    rowIds: [openRow?.id, closeRow?.id].filter(Boolean) as string[],
    readyEmployeeIds: backupReady,
  })

  return answers
}

export function buildTeamReadinessMatrix(input: {
  businessName: string
  employees: Pick<Tables<"profiles">, "id" | "full_name" | "role">[]
  modules: TrainingModuleDeep[]
  viewModels: EmployeeTrainingViewModel[]
}): TeamReadinessMatrix {
  const vmById = new Map(input.viewModels.map((vm) => [vm.profile.id, vm]))

  const employees: MatrixEmployeeColumn[] = input.employees.map((p) => ({
    id: p.id,
    name: p.full_name,
    role: p.role?.trim() || "",
    roleOnly: parseEmployeeRoleOnly(p.role ?? ""),
    location: parseEmployeeLocation(p.role ?? "", input.businessName),
  }))

  const skillRows: MatrixRow[] = READINESS_CAPABILITY_FIELDS.map((field) => ({
    id: `skill:${field}`,
    kind: "skill",
    title: READINESS_CAPABILITY_DISPLAY_LABELS[field],
    subtitle: null,
    moduleId: null,
    standardId: null,
    capabilityField: field,
    assignedRole: null,
  }))

  const playRows = collectPlayRows(input.modules)

  const certRows: MatrixRow[] = input.modules.map((mod) => ({
    id: `cert:${mod.id}`,
    kind: "certification",
    title: mod.title,
    subtitle: mod.assigned_role ? null : "General",
    moduleId: mod.id,
    standardId: null,
    capabilityField: null,
    assignedRole: mod.assigned_role,
  }))

  const rows = [...skillRows, ...playRows, ...certRows]
  const cells: MatrixCell[] = []

  for (const emp of employees) {
    const vm = vmById.get(emp.id)
    if (!vm) continue

    for (const row of skillRows) {
      const field = row.capabilityField!
      const relevant = relevantModulesForField(vm.modules, field)
      const cap = vm.readiness.capabilities.find((c) => c.field === field)
      const certifiedOnRelevant = relevant.some((m) =>
        vm.certifications.find((c) => c.moduleId === m.moduleId)?.certified
      )
      cells.push({
        employeeId: emp.id,
        rowId: row.id,
        status: skillCellStatus(
          relevant,
          cap?.score ?? 0,
          cap?.effective === "ready",
          certifiedOnRelevant
        ),
      })
    }

    for (const row of playRows) {
      const standardId = row.standardId!
      const assignedRows = vm.modules.flatMap((m) =>
        m.sopRows.filter((r) => r.standardId === standardId).map((r) => ({ module: m, sop: r }))
      )
      const assigned = assignedRows.length > 0
      const completed = assignedRows.some((x) => x.sop.completed)
      const inProgress = assignedRows.some(
        (x) => x.module.status === "in_progress" || (x.module.pct ?? 0) > 0
      )
      cells.push({
        employeeId: emp.id,
        rowId: row.id,
        status: playCellStatus(assigned, completed, inProgress && !completed),
      })
    }

    for (const row of certRows) {
      const moduleId = row.moduleId!
      const assigned = vm.modules.some((m) => m.moduleId === moduleId)
      const cert = vm.certifications.find((c) => c.moduleId === moduleId)
      cells.push({
        employeeId: emp.id,
        rowId: row.id,
        status: certificationCellStatus(assigned, cert),
      })
    }
  }

  const roleValues = new Set<string>()
  const locationValues = new Set<string>()
  for (const e of employees) {
    if (e.roleOnly) roleValues.add(e.roleOnly)
    locationValues.add(e.location)
  }

  const roleOptions = [
    { value: "all", label: "All roles" },
    ...[...roleValues].sort().map((v) => ({ value: v, label: v })),
  ]

  const locationOptions = [
    { value: "all", label: "All locations" },
    ...[...locationValues].sort().map((v) => ({ value: v, label: v })),
  ]

  const certificationOptions = [
    { value: "all", label: "All certifications" },
    ...input.modules.map((m) => ({ value: m.id, label: m.title })),
  ]

  return {
    businessName: input.businessName,
    employees,
    rows,
    cells,
    roleOptions,
    locationOptions,
    certificationOptions,
    quickAnswers: buildQuickAnswers(employees, rows, cells),
  }
}

export function cellForMatrix(
  matrix: TeamReadinessMatrix,
  rowId: string,
  employeeId: string
): MatrixCell | undefined {
  return matrix.cells.find((c) => c.rowId === rowId && c.employeeId === employeeId)
}

export type MatrixFilters = {
  rowKind: MatrixRowKind | "all"
  role: string
  location: string
  certification: string
  status: MatrixCellStatus | "all"
  highlightRowIds: string[]
}

export function applyMatrixFilters(
  matrix: TeamReadinessMatrix,
  filters: MatrixFilters
): TeamReadinessMatrix {
  let employees = matrix.employees
  let rows = matrix.rows

  if (filters.role !== "all") {
    employees = employees.filter((e) => e.roleOnly === filters.role)
  }
  if (filters.location !== "all") {
    employees = employees.filter((e) => e.location === filters.location)
  }

  if (filters.rowKind !== "all") {
    rows = rows.filter((r) => r.kind === filters.rowKind)
  }
  if (filters.certification !== "all") {
    const modId = filters.certification
    rows = rows.filter(
      (r) =>
        r.kind === "skill" ||
        (r.kind === "certification" && r.moduleId === modId) ||
        (r.kind === "play" && r.moduleId === modId)
    )
  }

  const employeeIds = new Set(employees.map((e) => e.id))
  const rowIds = new Set(rows.map((r) => r.id))
  let cells = matrix.cells.filter(
    (c) => employeeIds.has(c.employeeId) && rowIds.has(c.rowId)
  )

  if (filters.status !== "all") {
    const matchingEmployeeIds = new Set(
      cells.filter((c) => c.status === filters.status).map((c) => c.employeeId)
    )
    employees = employees.filter((e) => matchingEmployeeIds.has(e.id))
    const filteredEmployeeIds = new Set(employees.map((e) => e.id))
    cells = cells.filter((c) => filteredEmployeeIds.has(c.employeeId))
  }

  return {
    ...matrix,
    employees,
    rows,
    cells,
  }
}

/** @deprecated Use applyMatrixFilters */
export function filterMatrixByRole(
  matrix: TeamReadinessMatrix,
  roleFilter: string
): TeamReadinessMatrix {
  return applyMatrixFilters(matrix, {
    rowKind: "all",
    role: "all",
    location: "all",
    certification: roleFilter === "all" ? "all" : roleFilter,
    status: "all",
    highlightRowIds: [],
  })
}

/** Legacy alias for tests */
export function matrixCellStatus(input: {
  assigned: boolean
  certified: boolean
  progressStatus: string | null
  progressPct: number | null
}): MatrixCellStatus {
  if (!input.assigned) return "not_assigned"
  if (input.certified) return "ready"
  if (input.progressStatus === "completed") return "in_progress"
  if (input.progressStatus === "in_progress" || (input.progressPct ?? 0) > 0) {
    return "in_progress"
  }
  return "not_trained"
}
