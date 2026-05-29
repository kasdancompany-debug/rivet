import { describe, expect, it } from "vitest"

import {
  applyMatrixFilters,
  buildTeamReadinessMatrix,
  certificationCellStatus,
  matrixCellStatus,
  playCellStatus,
  skillCellStatus,
} from "@/lib/training/readiness-matrix/build-matrix"
import type { EmployeeTrainingViewModel } from "@/lib/training/build-views"
import { parseEmployeeLocation, parseEmployeeRoleOnly } from "@/lib/training/readiness-matrix/employee-location"

describe("matrixCellStatus (legacy)", () => {
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

  it("returns not_assigned when unassigned", () => {
    expect(
      matrixCellStatus({
        assigned: false,
        certified: false,
        progressStatus: null,
        progressPct: null,
      })
    ).toBe("not_assigned")
  })
})

describe("certificationCellStatus", () => {
  it("returns gray when not assigned", () => {
    expect(certificationCellStatus(false, undefined)).toBe("not_assigned")
  })

  it("returns ready when certified", () => {
    expect(
      certificationCellStatus(true, {
        moduleId: "m1",
        moduleTitle: "Opening",
        moduleCompleted: true,
        quizzesPassed: true,
        proofUploaded: true,
        managerSignedOff: true,
        certified: true,
        certifiedAt: "2026-01-01",
      })
    ).toBe("ready")
  })
})

describe("playCellStatus", () => {
  it("returns ready when play completed", () => {
    expect(playCellStatus(true, true, false)).toBe("ready")
  })

  it("returns gray when play not assigned", () => {
    expect(playCellStatus(false, false, false)).toBe("not_assigned")
  })
})

describe("skillCellStatus", () => {
  it("returns gray without relevant modules", () => {
    expect(skillCellStatus([], 0, false, false)).toBe("not_assigned")
  })
})

describe("parseEmployeeLocation", () => {
  it("extracts location suffix from role", () => {
    expect(parseEmployeeLocation("Barista · Main St", "Acme")).toBe("Main St")
    expect(parseEmployeeRoleOnly("Barista · Main St")).toBe("Barista")
  })

  it("falls back to business name", () => {
    expect(parseEmployeeLocation("Barista", "Acme Cafe")).toBe("Acme Cafe")
  })
})

function stubVm(overrides: Partial<EmployeeTrainingViewModel> = {}): EmployeeTrainingViewModel {
  return {
    profile: { id: "e1", full_name: "Alex", role: "barista", email: "", business_id: "b1", is_owner: false, created_at: "", updated_at: "" },
    modules: [],
    aggregatePct: null,
    readiness: {
      overallScore: 0,
      signals: {
        sopCompletion: 0,
        quizCompletion: 0,
        videoWatched: 0,
        shiftObservations: 0,
        managerSignOffs: 0,
        practicalCertifications: 0,
      },
      capabilities: [],
    },
    certifications: [],
    certifiedBadges: [],
    observations: [],
    ...overrides,
  } as EmployeeTrainingViewModel
}

describe("buildTeamReadinessMatrix", () => {
  it("builds skill, play, and certification rows", () => {
    const matrix = buildTeamReadinessMatrix({
      businessName: "Acme",
      employees: [{ id: "e1", full_name: "Alex", role: "barista" }],
      modules: [
        {
          id: "m1",
          title: "Opening",
          assigned_role: "barista",
          business_id: "b1",
          description: null,
          created_at: "",
          updated_at: "",
          training_items: [
            {
              id: "t1",
              standard_id: "s1",
              required: true,
              business_id: "b1",
              created_at: "",
              standards: { id: "s1", title: "Opening checklist", status: "active", category: "opening", estimated_time_minutes: 10 },
            },
          ],
        } as unknown as Parameters<typeof buildTeamReadinessMatrix>[0]["modules"][0],
      ],
      viewModels: [
        stubVm({
          modules: [
            {
              moduleId: "m1",
              title: "Opening",
              assignedRole: "barista",
              progressId: "p1",
              status: "in_progress",
              requiredTotal: 1,
              requiredDone: 0,
              pct: 40,
              completedSopTitles: [],
              remainingSopTitles: ["Opening checklist"],
              sopRows: [
                {
                  trainingItemId: "t1",
                  moduleId: "m1",
                  standardId: "s1",
                  title: "Opening checklist",
                  completed: false,
                  standardCategory: "opening",
                },
              ],
            },
          ],
          certifications: [
            {
              moduleId: "m1",
              moduleTitle: "Opening",
              moduleCompleted: false,
              quizzesPassed: false,
              proofUploaded: false,
              managerSignedOff: false,
              certified: false,
              certifiedAt: null,
            },
          ],
        }),
      ],
    })

    expect(matrix.rows.some((r) => r.kind === "skill")).toBe(true)
    expect(matrix.rows.some((r) => r.kind === "play")).toBe(true)
    expect(matrix.rows.some((r) => r.kind === "certification")).toBe(true)
    expect(matrix.quickAnswers.some((q) => q.id === "can_open")).toBe(true)
  })

  it("filters by certification module", () => {
    const matrix = buildTeamReadinessMatrix({
      businessName: "Acme",
      employees: [{ id: "e1", full_name: "Alex", role: "" }],
      modules: [
        { id: "m1", title: "Open", assigned_role: null, business_id: "b1", description: null, created_at: "", training_items: [] },
        { id: "m2", title: "Close", assigned_role: null, business_id: "b1", description: null, created_at: "", training_items: [] },
      ] as unknown as Parameters<typeof buildTeamReadinessMatrix>[0]["modules"],
      viewModels: [stubVm()],
    })
    const filtered = applyMatrixFilters(matrix, {
      rowKind: "all",
      role: "all",
      location: "all",
      certification: "m1",
      status: "all",
      highlightRowIds: [],
    })
    expect(filtered.rows.every((r) => r.kind === "skill" || r.moduleId === "m1")).toBe(true)
  })
})
