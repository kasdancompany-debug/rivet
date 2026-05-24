import { describe, expect, it } from "vitest"

import { buildFirstDayChecklist } from "@/lib/dashboard/first-day-checklist"
import { INSTALLED_TEMPLATE_FOOTER } from "@/lib/sop-templates/installed-copy"
import type { Tables } from "@/types/database"

function std(partial: Partial<Tables<"standards">>): Tables<"standards"> {
  return {
    id: "s1",
    business_id: "b1",
    title: "Test",
    category: "ops",
    description: null,
    importance_level: 3,
    owner_dependency_level: 3,
    estimated_time_minutes: null,
    status: "draft",
    standards_capture: {},
    quiz_questions: [],
    created_by: "u1",
    created_at: "",
    updated_at: "",
    ...partial,
  }
}

describe("buildFirstDayChecklist", () => {
  it("marks nothing done on empty workspace", () => {
    const view = buildFirstDayChecklist({
      businessId: "b1",
      industryTemplateId: null,
      templateInstalledAt: null,
      standards: [],
      ownerInterruptionCount: 0,
      teamProfileCount: 1,
      escapeScore: null,
    })
    expect(view.completedCount).toBe(0)
    expect(view.allComplete).toBe(false)
    expect(view.items).toHaveLength(6)
  })

  it("detects user-authored procedure without template footer", () => {
    const view = buildFirstDayChecklist({
      businessId: "b1",
      industryTemplateId: "cafe",
      templateInstalledAt: new Date().toISOString(),
      standards: [std({ description: "Our real closing steps" })],
      ownerInterruptionCount: 1,
      teamProfileCount: 1,
      escapeScore: 42,
    })
    const procedure = view.items.find((i) => i.id === "procedure")
    expect(procedure?.done).toBe(true)
  })

  it("does not count template-only installs as real procedure", () => {
    const view = buildFirstDayChecklist({
      businessId: "b1",
      industryTemplateId: "cafe",
      templateInstalledAt: new Date().toISOString(),
      standards: [
        std({
          description: `Starter\n\n${INSTALLED_TEMPLATE_FOOTER}`,
          standards_capture: {},
        }),
      ],
      ownerInterruptionCount: 0,
      teamProfileCount: 1,
      escapeScore: null,
    })
    expect(view.items.find((i) => i.id === "procedure")?.done).toBe(false)
  })
})
