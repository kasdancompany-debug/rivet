import { describe, expect, it } from "vitest"

import { buildTrainingCenterStaffSummary } from "@/lib/training/training-center-summary"
import { computeEmployeeReadiness } from "@/lib/training/compute-readiness"

describe("buildTrainingCenterStaffSummary", () => {
  it("formats capability lines with ready, sign-off, and certified states", () => {
    const readiness = computeEmployeeReadiness({
      modules: [
        {
          moduleId: "open-mod",
          title: "Opening",
          assignedRole: "shift_lead",
          status: "completed",
          pct: 100,
          sopRows: [
            {
              title: "Opening checklist",
              completed: true,
              standardCategory: "opening",
              standardId: "s1",
            },
          ],
        },
        {
          moduleId: "cash-mod",
          title: "Cash handling",
          assignedRole: "shift_lead",
          status: "completed",
          pct: 100,
          sopRows: [
            {
              title: "Close drawer",
              completed: true,
              standardCategory: "closing",
              standardId: "s2",
            },
          ],
        },
      ].map((m) => ({
        moduleId: m.moduleId,
        title: m.title,
        assignedRole: m.assignedRole,
        status: m.status as "completed",
        pct: m.pct,
        sopRows: m.sopRows,
      })),
      completedShiftRuns: 2,
      managerObservations: [],
      passedQuizStandardIds: new Set(["s1", "s2"]),
      certifiedModuleIds: new Set(["recovery-mod"]),
      managerSignedOffModuleIds: new Set(["open-mod"]),
      overrides: {},
    })

    const summary = buildTrainingCenterStaffSummary({
      readiness,
      modules: [
        {
          moduleId: "open-mod",
          title: "Opening checklist",
          assignedRole: "shift_lead",
          progressId: "p1",
          status: "completed",
          requiredTotal: 1,
          requiredDone: 1,
          pct: 100,
          completedSopTitles: ["Opening checklist"],
          remainingSopTitles: [],
          sopRows: [
            {
              trainingItemId: "t1",
              moduleId: "open-mod",
              standardId: "s1",
              title: "Opening checklist",
              completed: true,
              standardCategory: "opening",
            },
          ],
        },
        {
          moduleId: "cash-mod",
          title: "Cash handling",
          assignedRole: "shift_lead",
          progressId: "p2",
          status: "completed",
          requiredTotal: 1,
          requiredDone: 1,
          pct: 100,
          completedSopTitles: ["Close drawer"],
          remainingSopTitles: [],
          sopRows: [
            {
              trainingItemId: "t2",
              moduleId: "cash-mod",
              standardId: "s2",
              title: "Close drawer",
              completed: true,
              standardCategory: "closing",
            },
          ],
        },
        {
          moduleId: "recovery-mod",
          title: "Customer recovery",
          assignedRole: "front_counter",
          progressId: "p3",
          status: "completed",
          requiredTotal: 1,
          requiredDone: 1,
          pct: 100,
          completedSopTitles: ["Guest recovery"],
          remainingSopTitles: [],
          sopRows: [
            {
              trainingItemId: "t3",
              moduleId: "recovery-mod",
              standardId: "s3",
              title: "Guest recovery",
              completed: true,
              standardCategory: "customer_experience",
            },
          ],
        },
      ],
      certifications: [
        {
          moduleId: "recovery-mod",
          moduleTitle: "Customer recovery",
          moduleCompleted: true,
          quizzesPassed: true,
          proofUploaded: true,
          managerSignedOff: true,
          certified: true,
          certifiedAt: "2026-01-01T00:00:00Z",
        },
        {
          moduleId: "cash-mod",
          moduleTitle: "Cash handling",
          moduleCompleted: true,
          quizzesPassed: true,
          proofUploaded: false,
          managerSignedOff: false,
          certified: false,
          certifiedAt: null,
        },
      ],
    })

    const opening = summary.capabilityLines.find((l) => l.label === "Opening Ready")
    const closing = summary.capabilityLines.find((l) => l.label === "Closing Ready")
    const recovery = summary.capabilityLines.find((l) => l.label === "Customer Recovery Ready")

    expect(opening?.display).toBe("Ready")
    expect(closing?.display).toMatch(/cash handling sign-off/i)
    expect(recovery?.display).toBe("Certified")
    expect(summary.trainingScore).toBeGreaterThan(0)
    expect(summary.pendingSignOffs.some((s) => s.moduleTitle === "Cash handling")).toBe(true)
  })
})
