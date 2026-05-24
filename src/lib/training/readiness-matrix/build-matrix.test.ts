import { describe, expect, it } from "vitest"

import {
  buildTeamReadinessMatrix,
  filterMatrixByRole,
  matrixCellStatus,
} from "@/lib/training/readiness-matrix/build-matrix"

describe("matrixCellStatus", () => {
  it("returns ready when certified", () => {
    expect(
      matrixCellStatus({
        assigned: true,
        certified: true,
        progressStatus: "completed",
        progressPct: 100,
      })
    ).toBe("ready")
  })

  it("returns learning when in progress", () => {
    expect(
      matrixCellStatus({
        assigned: true,
        certified: false,
        progressStatus: "in_progress",
        progressPct: 40,
      })
    ).toBe("learning")
  })

  it("returns not_trained when unassigned", () => {
    expect(
      matrixCellStatus({
        assigned: false,
        certified: false,
        progressStatus: null,
        progressPct: null,
      })
    ).toBe("not_trained")
  })
})

describe("buildTeamReadinessMatrix", () => {
  it("builds cells for each employee-module pair", () => {
    const matrix = buildTeamReadinessMatrix({
      employees: [{ id: "e1", full_name: "Alex", role: "barista" }],
      modules: [{ id: "m1", title: "Opening", assigned_role: "barista" }],
      progress: [
        {
          id: "p1",
          business_id: "b1",
          employee_id: "e1",
          training_module_id: "m1",
          status: "in_progress",
          completed_at: null,
          updated_at: "",
        },
      ],
      certificationRows: [],
    })
    expect(matrix.cells).toHaveLength(1)
    expect(matrix.cells[0]?.status).toBe("learning")
  })

  it("filters rows by module role", () => {
    const matrix = buildTeamReadinessMatrix({
      employees: [{ id: "e1", full_name: "Alex", role: "" }],
      modules: [
        { id: "m1", title: "Open", assigned_role: "barista" },
        { id: "m2", title: "Close", assigned_role: "shift_lead" },
      ],
      progress: [],
      certificationRows: [],
    })
    const filtered = filterMatrixByRole(matrix, "barista")
    expect(filtered.modules).toHaveLength(1)
    expect(filtered.modules[0]?.id).toBe("m1")
  })
})
