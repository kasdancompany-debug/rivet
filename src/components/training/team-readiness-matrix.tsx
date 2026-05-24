"use client"

import { useMemo, useState } from "react"

import { COPY } from "@/lib/interface-copy"
import { formatTrainingRole } from "@/lib/training/roles"
import {
  cellForMatrix,
  filterMatrixByRole,
  MATRIX_STATUS_LABELS,
  type MatrixCellStatus,
  type TeamReadinessMatrix,
} from "@/lib/training/readiness-matrix/build-matrix"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

function statusCellClass(status: MatrixCellStatus): string {
  switch (status) {
    case "ready":
      return "bg-emerald-500/85 ring-emerald-600/30"
    case "learning":
      return "bg-amber-400/90 ring-amber-500/35"
    default:
      return "bg-red-500/80 ring-red-600/30"
  }
}

function MatrixLegend() {
  const items: MatrixCellStatus[] = ["ready", "learning", "not_trained"]
  return (
    <ul className="flex flex-wrap gap-4 text-xs text-muted-foreground">
      {items.map((status) => (
        <li key={status} className="flex items-center gap-2">
          <span
            className={cn("size-3 rounded-sm ring-1 ring-inset", statusCellClass(status))}
            aria-hidden
          />
          {MATRIX_STATUS_LABELS[status]}
        </li>
      ))}
    </ul>
  )
}

export function TeamReadinessMatrixView({ matrix }: { matrix: TeamReadinessMatrix }) {
  const [roleFilter, setRoleFilter] = useState("all")
  const [employeeRoleFilter, setEmployeeRoleFilter] = useState("all")

  const employeeRoleOptions = useMemo(() => {
    const roles = new Set<string>()
    for (const e of matrix.employees) {
      const r = e.role.trim()
      if (r) roles.add(r)
    }
    return [
      { value: "all", label: COPY.readinessMatrix.allEmployeeRoles },
      ...[...roles].sort().map((r) => ({ value: r, label: r })),
    ]
  }, [matrix.employees])

  const filtered = useMemo(() => {
    let m = filterMatrixByRole(matrix, roleFilter)
    if (employeeRoleFilter !== "all") {
      const ids = new Set(
        m.employees.filter((e) => e.role.trim() === employeeRoleFilter).map((e) => e.id)
      )
      m = {
        ...m,
        employees: m.employees.filter((e) => ids.has(e.id)),
        cells: m.cells.filter((c) => ids.has(c.employeeId)),
      }
    }
    return m
  }, [matrix, roleFilter, employeeRoleFilter])

  if (matrix.modules.length === 0) {
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="space-y-1">
          <Label htmlFor="matrix-module-role">{COPY.readinessMatrix.moduleRoleFilter}</Label>
          <select
            id="matrix-module-role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="flex h-10 min-w-[10rem] rounded-lg border border-input bg-background px-3 text-sm"
          >
            {matrix.roleOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.value === "all" ? opt.label : formatTrainingRole(opt.value === "general" ? null : opt.value)}
              </option>
            ))}
          </select>
        </div>
        {employeeRoleOptions.length > 1 ? (
          <div className="space-y-1">
            <Label htmlFor="matrix-employee-role">{COPY.readinessMatrix.employeeRoleFilter}</Label>
            <select
              id="matrix-employee-role"
              value={employeeRoleFilter}
              onChange={(e) => setEmployeeRoleFilter(e.target.value)}
              className="flex h-10 min-w-[10rem] rounded-lg border border-input bg-background px-3 text-sm"
            >
              {employeeRoleOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      <MatrixLegend />

      <div className="overflow-x-auto rounded-xl border border-border/60 bg-card/80 shadow-sm">
        <table className="w-full min-w-[32rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30">
              <th
                scope="col"
                className="sticky left-0 z-10 min-w-[10rem] bg-muted/30 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {COPY.readinessMatrix.moduleColumn}
              </th>
              {filtered.employees.map((emp) => (
                <th
                  key={emp.id}
                  scope="col"
                  className="min-w-[4.5rem] px-2 py-3 text-center text-xs font-medium text-foreground"
                >
                  <span className="block max-w-[5rem] truncate" title={emp.name}>
                    {emp.name.split(/\s+/)[0]}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.modules.map((mod) => (
              <tr key={mod.id} className="border-b border-border/40 last:border-0">
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-card/95 px-3 py-2.5 text-left font-medium text-foreground backdrop-blur"
                >
                  <span className="block leading-snug">{mod.title}</span>
                  <span className="mt-0.5 block text-[0.65rem] font-normal text-muted-foreground">
                    {formatTrainingRole(mod.assignedRole)}
                  </span>
                </th>
                {filtered.employees.map((emp) => {
                  const cell = cellForMatrix(filtered, mod.id, emp.id)
                  const status = cell?.status ?? "not_trained"
                  const title = COPY.readinessMatrix.cellTitle(
                    emp.name,
                    mod.title,
                    MATRIX_STATUS_LABELS[status]
                  )
                  return (
                    <td key={emp.id} className="px-2 py-2.5 text-center">
                      <span
                        className={cn(
                          "mx-auto inline-block size-7 rounded-md ring-1 ring-inset",
                          statusCellClass(status)
                        )}
                        title={title}
                        aria-label={title}
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
