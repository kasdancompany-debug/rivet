"use client"

import { useMemo, useState } from "react"

import { COPY } from "@/lib/interface-copy"
import { formatTrainingRole } from "@/lib/training/roles"
import {
  applyMatrixFilters,
  cellForMatrix,
  MATRIX_ROW_KIND_LABELS,
  MATRIX_STATUS_LABELS,
  type MatrixCellStatus,
  type MatrixRowKind,
  type TeamReadinessMatrix,
} from "@/lib/training/readiness-matrix/build-matrix"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

function statusCellClass(status: MatrixCellStatus, highlighted: boolean): string {
  const base = highlighted ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "ring-1 ring-inset"
  switch (status) {
    case "ready":
      return cn("bg-emerald-500/85 ring-emerald-600/30", base)
    case "in_progress":
      return cn("bg-amber-400/90 ring-amber-500/35", base)
    case "not_assigned":
      return cn("bg-muted/70 ring-border/60", base)
    default:
      return cn("bg-red-500/80 ring-red-600/30", base)
  }
}

function MatrixLegend() {
  const items: MatrixCellStatus[] = ["ready", "in_progress", "not_trained", "not_assigned"]
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
      {items.map((status) => (
        <li key={status} className="flex items-center gap-2">
          <span
            className={cn("size-3 rounded-sm", statusCellClass(status, false))}
            aria-hidden
          />
          {MATRIX_STATUS_LABELS[status]}
        </li>
      ))}
    </ul>
  )
}

function QuickAnswerPanel({
  matrix,
  activeId,
  onSelect,
}: {
  matrix: TeamReadinessMatrix
  activeId: string | null
  onSelect: (id: string | null, rowIds: string[]) => void
}) {
  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-4">
      <p className="text-sm font-medium text-foreground">{COPY.readinessMatrix.quickAnswersTitle}</p>
      <p className="mt-1 text-xs text-muted-foreground">{COPY.readinessMatrix.quickAnswersLead}</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {matrix.quickAnswers.map((qa) => {
          const active = activeId === qa.id
          const names =
            qa.readyEmployeeIds.length === 0
              ? COPY.readinessMatrix.quickAnswerNobody
              : qa.readyEmployeeIds
                  .map((id) => matrix.employees.find((e) => e.id === id)?.name.split(/\s+/)[0])
                  .filter(Boolean)
                  .join(", ")
          return (
            <li key={qa.id}>
              <button
                type="button"
                onClick={() => onSelect(active ? null : qa.id, active ? [] : qa.rowIds)}
                className={cn(
                  "rounded-xl border px-3 py-2 text-left text-sm transition-colors",
                  active
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border/60 bg-background/80 hover:border-primary/30"
                )}
              >
                <span className="font-medium">{qa.question}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{names}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function TeamReadinessMatrixView({ matrix }: { matrix: TeamReadinessMatrix }) {
  const [rowKind, setRowKind] = useState<MatrixRowKind | "all">("all")
  const [roleFilter, setRoleFilter] = useState("all")
  const [locationFilter, setLocationFilter] = useState("all")
  const [certFilter, setCertFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState<MatrixCellStatus | "all">("all")
  const [quickAnswerId, setQuickAnswerId] = useState<string | null>(null)
  const [highlightRowIds, setHighlightRowIds] = useState<string[]>([])

  const filtered = useMemo(
    () =>
      applyMatrixFilters(matrix, {
        rowKind,
        role: roleFilter,
        location: locationFilter,
        certification: certFilter,
        status: statusFilter,
        highlightRowIds,
      }),
    [matrix, rowKind, roleFilter, locationFilter, certFilter, statusFilter, highlightRowIds]
  )

  const rowsByKind = useMemo(() => {
    const groups: Record<MatrixRowKind, typeof filtered.rows> = {
      skill: [],
      play: [],
      certification: [],
    }
    for (const row of filtered.rows) {
      groups[row.kind].push(row)
    }
    return groups
  }, [filtered.rows])

  if (matrix.rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
        {COPY.readinessMatrix.noModules}
      </p>
    )
  }

  if (matrix.employees.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
        {COPY.readinessMatrix.noEmployees}
      </p>
    )
  }

  function handleQuickAnswer(id: string | null, rowIds: string[]) {
    setQuickAnswerId(id)
    setHighlightRowIds(rowIds)
    if (id) setRowKind("all")
  }

  const kindTabs: (MatrixRowKind | "all")[] = ["all", "skill", "play", "certification"]

  return (
    <div className="space-y-5">
      <QuickAnswerPanel matrix={matrix} activeId={quickAnswerId} onSelect={handleQuickAnswer} />

      <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
        <div className="flex flex-wrap gap-2">
          {kindTabs.map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => setRowKind(kind)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                rowKind === kind
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border/60 text-muted-foreground hover:text-foreground"
              )}
            >
              {kind === "all" ? COPY.readinessMatrix.allRowKinds : MATRIX_ROW_KIND_LABELS[kind]}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          <div className="space-y-1">
            <Label htmlFor="matrix-role">{COPY.readinessMatrix.employeeRoleFilter}</Label>
            <select
              id="matrix-role"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="flex h-10 w-full min-w-[10rem] rounded-lg border border-input bg-background px-3 text-sm"
            >
              {matrix.roleOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="matrix-location">{COPY.readinessMatrix.locationFilter}</Label>
            <select
              id="matrix-location"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="flex h-10 w-full min-w-[10rem] rounded-lg border border-input bg-background px-3 text-sm"
            >
              {matrix.locationOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="matrix-cert">{COPY.readinessMatrix.certificationFilter}</Label>
            <select
              id="matrix-cert"
              value={certFilter}
              onChange={(e) => setCertFilter(e.target.value)}
              className="flex h-10 w-full min-w-[10rem] rounded-lg border border-input bg-background px-3 text-sm"
            >
              {matrix.certificationOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="matrix-status">{COPY.readinessMatrix.statusFilter}</Label>
            <select
              id="matrix-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as MatrixCellStatus | "all")}
              className="flex h-10 w-full min-w-[10rem] rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="all">{COPY.readinessMatrix.allStatuses}</option>
              {(Object.keys(MATRIX_STATUS_LABELS) as MatrixCellStatus[]).map((status) => (
                <option key={status} value={status}>
                  {MATRIX_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <MatrixLegend />

      <div className="overflow-x-auto rounded-xl border border-border/60 bg-card/80 shadow-sm">
        <table className="w-full min-w-[36rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30">
              <th
                scope="col"
                className="sticky left-0 z-10 min-w-[11rem] bg-muted/30 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {COPY.readinessMatrix.rowColumn}
              </th>
              {filtered.employees.map((emp) => (
                <th
                  key={emp.id}
                  scope="col"
                  className="min-w-[4.75rem] px-2 py-3 text-center text-xs font-medium text-foreground"
                >
                  <span className="block max-w-[5.5rem] truncate" title={emp.name}>
                    {emp.name.split(/\s+/)[0]}
                  </span>
                  {emp.location !== matrix.businessName ? (
                    <span className="mt-0.5 block truncate text-[0.58rem] font-normal text-muted-foreground">
                      {emp.location}
                    </span>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(["skill", "play", "certification"] as MatrixRowKind[]).map((kind) => {
              const sectionRows = rowsByKind[kind]
              if (sectionRows.length === 0) return null
              if (rowKind !== "all" && rowKind !== kind) return null

              return (
                <SectionRows
                  key={kind}
                  kind={kind}
                  rows={sectionRows}
                  employees={filtered.employees}
                  matrix={filtered}
                  highlightRowIds={highlightRowIds}
                />
              )
            })}
          </tbody>
        </table>
      </div>

      {filtered.rows.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">{COPY.readinessMatrix.noFilterResults}</p>
      ) : null}
    </div>
  )
}

function SectionRows({
  kind,
  rows,
  employees,
  matrix,
  highlightRowIds,
}: {
  kind: MatrixRowKind
  rows: TeamReadinessMatrix["rows"]
  employees: TeamReadinessMatrix["employees"]
  matrix: TeamReadinessMatrix
  highlightRowIds: string[]
}) {
  return (
    <>
      <tr className="bg-muted/20">
        <th
          scope="colgroup"
          colSpan={employees.length + 1}
          className="sticky left-0 px-3 py-2 text-left text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
        >
          {MATRIX_ROW_KIND_LABELS[kind]}
        </th>
      </tr>
      {rows.map((row) => {
        const highlighted = highlightRowIds.includes(row.id)
        return (
          <tr
            key={row.id}
            className={cn(
              "border-b border-border/40 last:border-0",
              highlighted && "bg-primary/[0.03]"
            )}
          >
            <th
              scope="row"
              className={cn(
                "sticky left-0 z-10 bg-card/95 px-3 py-2.5 text-left font-medium text-foreground backdrop-blur",
                highlighted && "bg-primary/[0.06]"
              )}
            >
              <span className="block leading-snug">{row.title}</span>
              {row.subtitle || row.assignedRole ? (
                <span className="mt-0.5 block text-[0.65rem] font-normal text-muted-foreground">
                  {row.subtitle ?? formatTrainingRole(row.assignedRole)}
                </span>
              ) : null}
              {highlighted ? (
                <Badge variant="outline" className="mt-1 text-[0.58rem]">
                  {COPY.readinessMatrix.highlighted}
                </Badge>
              ) : null}
            </th>
            {employees.map((emp) => {
              const cell = cellForMatrix(matrix, row.id, emp.id)
              const status = cell?.status ?? "not_assigned"
              const title = COPY.readinessMatrix.cellTitle(
                emp.name,
                row.title,
                MATRIX_STATUS_LABELS[status]
              )
              return (
                <td key={emp.id} className="px-2 py-2.5 text-center">
                  <span
                    className={cn(
                      "mx-auto inline-block size-7 rounded-md",
                      statusCellClass(status, highlighted && status === "ready")
                    )}
                    title={title}
                    aria-label={title}
                  />
                </td>
              )
            })}
          </tr>
        )
      })}
    </>
  )
}
