import type { ModuleCertificationView } from "@/lib/training/certifications/build-views"
import type { ModuleProgressView } from "@/lib/training/build-views"
import {
  type ComputedEmployeeReadiness,
  type ReadinessCapabilityField,
  type ReadinessModuleInput,
} from "@/lib/training/compute-readiness"

export type TrainingCenterCapabilityLine = {
  field: ReadinessCapabilityField
  label: string
  tone: "ready" | "certified" | "needs_sign_off" | "needs_work"
  display: string
}

export type TrainingCenterStaffSummary = {
  trainingScore: number
  quizScore: number
  capabilityLines: TrainingCenterCapabilityLine[]
  readySkills: string[]
  needsWorkSkills: string[]
  pendingSignOffs: { moduleTitle: string; moduleId: string }[]
  completedSignOffs: { moduleTitle: string; moduleId: string }[]
}

export function moduleMatchesField(
  mod: Pick<ReadinessModuleInput, "title" | "assignedRole" | "sopRows">,
  field: ReadinessCapabilityField,
  opts?: { strongOnly?: boolean }
): boolean {
  const hints: Record<
    ReadinessCapabilityField,
    { roles: string[]; categories: string[]; keywords: string[] }
  > = {
    open_alone: {
      roles: ["shift_lead", "manager"],
      categories: ["opening"],
      keywords: ["open", "opening", "morning", "start"],
    },
    close_alone: {
      roles: ["shift_lead", "manager"],
      categories: ["closing"],
      keywords: ["close", "closing", "shutdown", "end of shift", "cash"],
    },
    train_others: {
      roles: ["shift_lead", "manager"],
      categories: ["training"],
      keywords: ["train", "onboard", "cert", "shadow", "teach"],
    },
    handle_complaints: {
      roles: ["shift_lead", "front_counter", "manager"],
      categories: ["customer_experience"],
      keywords: ["guest", "complaint", "recovery", "service", "customer"],
    },
  }

  const h = hints[field]
  const title = mod.title.toLowerCase()
  const role = (mod.assignedRole ?? "").toLowerCase()
  const categoryMatch = mod.sopRows.some((row) => {
    const cat = (row.standardCategory ?? "").toLowerCase()
    return h.categories.some((c) => cat === c)
  })
  const keywordMatch = h.keywords.some((k) => title.includes(k))
  const roleMatch = h.roles.some((r) => role.includes(r))

  if (opts?.strongOnly) {
    return categoryMatch || keywordMatch
  }

  return roleMatch || categoryMatch || keywordMatch
}

function relevantModules(
  modules: ModuleProgressView[],
  field: ReadinessCapabilityField
): ModuleProgressView[] {
  return modules.filter((m) =>
    moduleMatchesField(
      {
        title: m.title,
        assignedRole: m.assignedRole,
        sopRows: m.sopRows,
      },
      field
    )
  )
}

function formatSignOffLabel(moduleTitle: string): string {
  const t = moduleTitle.trim()
  if (!t) return "Needs manager sign-off"
  return `Needs ${t.charAt(0).toLowerCase()}${t.slice(1)} sign-off`
}

export function buildTrainingCenterStaffSummary(input: {
  readiness: ComputedEmployeeReadiness
  modules: ModuleProgressView[]
  certifications: ModuleCertificationView[]
}): TrainingCenterStaffSummary {
  const { readiness, modules, certifications } = input

  const pendingSignOffs = certifications
    .filter((c) => c.moduleCompleted && c.quizzesPassed && !c.managerSignedOff)
    .map((c) => ({ moduleId: c.moduleId, moduleTitle: c.moduleTitle }))

  const completedSignOffs = certifications
    .filter((c) => c.managerSignedOff)
    .map((c) => ({ moduleId: c.moduleId, moduleTitle: c.moduleTitle }))

  const capabilityLines: TrainingCenterCapabilityLine[] = readiness.capabilities.map((cap) => {
    const label = cap.displayLabel
    const related = relevantModules(modules, cap.field)
    const relatedCerts = certifications.filter(
      (c) =>
        c.certified &&
        related.some((m) => m.moduleId === c.moduleId)
    )

    if (relatedCerts.length > 0) {
      return {
        field: cap.field,
        label,
        tone: "certified",
        display: "Certified",
      }
    }

    const pending = certifications.find((c) => {
      if (!c.moduleCompleted || !c.quizzesPassed || c.managerSignedOff) return false
      return modules.some(
        (m) =>
          m.moduleId === c.moduleId &&
          moduleMatchesField(
            {
              title: m.title,
              assignedRole: m.assignedRole,
              sopRows: m.sopRows,
            },
            cap.field,
            { strongOnly: true }
          )
      )
    })
    if (pending) {
      return {
        field: cap.field,
        label,
        tone: "needs_sign_off",
        display: formatSignOffLabel(pending.moduleTitle),
      }
    }

    if (cap.effective === "ready") {
      return {
        field: cap.field,
        label,
        tone: "ready",
        display: "Ready",
      }
    }

    return {
      field: cap.field,
      label,
      tone: "needs_work",
      display: "Needs work",
    }
  })

  const readySkills = capabilityLines
    .filter((l) => l.tone === "ready" || l.tone === "certified")
    .map((l) => l.label)
  const needsWorkSkills = capabilityLines
    .filter((l) => l.tone === "needs_work" || l.tone === "needs_sign_off")
    .map((l) => l.label)

  return {
    trainingScore: readiness.overallScore,
    quizScore: readiness.signals.quizCompletion,
    capabilityLines,
    readySkills,
    needsWorkSkills,
    pendingSignOffs,
    completedSignOffs,
  }
}

export function capabilityLineClass(tone: TrainingCenterCapabilityLine["tone"]): string {
  switch (tone) {
    case "ready":
      return "text-emerald-700 dark:text-emerald-300"
    case "certified":
      return "text-amber-700 dark:text-amber-300"
    case "needs_sign_off":
      return "text-sky-700 dark:text-sky-300"
    case "needs_work":
      return "text-amber-800 dark:text-amber-200"
  }
}
