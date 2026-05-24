import { describe, expect, it } from "vitest"

import { computeEmployeeReadiness } from "./compute-readiness"

describe("computeEmployeeReadiness", () => {
  it("returns low scores when nothing is complete", () => {
    const result = computeEmployeeReadiness({
      modules: [
        {
          moduleId: "m1",
          title: "Opening alone",
          assignedRole: "shift_lead",
          status: "not_started",
          pct: 0,
          sopRows: [{ title: "Open safe", completed: false, standardCategory: "opening", standardId: "s1" }],
        },
      ],
      completedShiftRuns: 0,
      passedQuizStandardIds: new Set(),
      overrides: {},
    })

    expect(result.overallScore).toBeLessThan(50)
    expect(result.capabilities.find((c) => c.field === "open_alone")?.calculated).toBe("needs_work")
  })

  it("marks capabilities ready when signals and module progress are strong", () => {
    const result = computeEmployeeReadiness({
      modules: [
        {
          moduleId: "m1",
          title: "Closing checklist",
          assignedRole: "shift_lead",
          status: "completed",
          pct: 100,
          sopRows: [
            { title: "Lock up", completed: true, standardCategory: "closing", standardId: "s2" },
            { title: "Deposit", completed: true, standardCategory: "closing", standardId: "s3" },
          ],
        },
        {
          moduleId: "m2",
          title: "Guest recovery",
          assignedRole: "front_counter",
          status: "completed",
          pct: 100,
          sopRows: [{ title: "Complaint ladder", completed: true, standardCategory: "customer_experience", standardId: "s4" }],
        },
      ],
      completedShiftRuns: 5,
      managerObservations: [],
      passedQuizStandardIds: new Set(["s2", "s3", "s4"]),
      certifiedModuleIds: new Set(["m1", "m2"]),
      managerSignedOffModuleIds: new Set(["m1", "m2"]),
      overrides: {},
    })

    expect(result.overallScore).toBeGreaterThanOrEqual(75)
    expect(result.capabilities.find((c) => c.field === "close_alone")?.calculated).toBe("ready")
    expect(result.signals.shiftObservations).toBe(100)
  })

  it("uses manager override when set", () => {
    const result = computeEmployeeReadiness({
      modules: [],
      completedShiftRuns: 0,
      overrides: { open_alone: "ready" },
    })

    const open = result.capabilities.find((c) => c.field === "open_alone")!
    expect(open.calculated).toBe("needs_work")
    expect(open.effective).toBe("ready")
    expect(open.overridden).toBe(true)
  })
})
