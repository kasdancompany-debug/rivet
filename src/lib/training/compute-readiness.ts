import type { ObservationRow } from "@/lib/training/observations/score-signal"
import { computeManagerObservationSignalScore } from "@/lib/training/observations/score-signal"
import type { TrainingProgressStatus } from "@/types/database"

export type DelegationReadinessStatus = "ready" | "needs_work"

export type ReadinessCapabilityField =
  | "open_alone"
  | "close_alone"
  | "train_others"
  | "handle_complaints"

export type ReadinessSignalKey =
  | "sopCompletion"
  | "quizCompletion"
  | "videoWatched"
  | "shiftObservations"
  | "managerSignOffs"
  | "practicalCertifications"

export const READINESS_SIGNAL_LABELS: Record<ReadinessSignalKey, string> = {
  sopCompletion: "SOP completion",
  quizCompletion: "Quiz completion",
  videoWatched: "Video watched",
  shiftObservations: "Manager observations",
  managerSignOffs: "Manager sign-offs",
  practicalCertifications: "Practical certifications",
}

export const READINESS_SIGNAL_ORDER: ReadinessSignalKey[] = [
  "sopCompletion",
  "quizCompletion",
  "videoWatched",
  "shiftObservations",
  "managerSignOffs",
  "practicalCertifications",
]

export const READINESS_CAPABILITY_FIELDS: ReadinessCapabilityField[] = [
  "open_alone",
  "close_alone",
  "train_others",
  "handle_complaints",
]

export const READINESS_CAPABILITY_LABELS: Record<ReadinessCapabilityField, string> = {
  open_alone: "Can open",
  close_alone: "Can close",
  train_others: "Can train",
  handle_complaints: "Can handle guest recovery",
}

export const DELEGATION_STATUS_LABELS: Record<DelegationReadinessStatus, string> = {
  ready: "Ready",
  needs_work: "Needs work",
}

export const READINESS_READY_THRESHOLD = 75

export type ReadinessModuleInput = {
  moduleId: string
  title: string
  assignedRole: string | null
  status: TrainingProgressStatus
  pct: number | null
  sopRows: {
    title: string
    completed: boolean
    standardCategory: string | null
    standardId: string
  }[]
}

export type ReadinessComputeInput = {
  modules: ReadinessModuleInput[]
  completedShiftRuns: number
  managerObservations?: ObservationRow[]
  passedQuizStandardIds?: Set<string>
  certifiedModuleIds?: Set<string>
  managerSignedOffModuleIds?: Set<string>
  overrides: Partial<Record<ReadinessCapabilityField, DelegationReadinessStatus | null>>
}

export type ReadinessSignalScores = Record<ReadinessSignalKey, number>

export type CapabilityReadiness = {
  field: ReadinessCapabilityField
  label: string
  score: number
  calculated: DelegationReadinessStatus
  effective: DelegationReadinessStatus
  overridden: boolean
  override: DelegationReadinessStatus | null
}

export type ComputedEmployeeReadiness = {
  overallScore: number
  signals: ReadinessSignalScores
  capabilities: CapabilityReadiness[]
}

type CapabilityHints = {
  roles: string[]
  categories: string[]
  keywords: string[]
}

const CAPABILITY_HINTS: Record<ReadinessCapabilityField, CapabilityHints> = {
  open_alone: {
    roles: ["shift_lead", "manager"],
    categories: ["opening"],
    keywords: ["open", "opening", "morning", "start"],
  },
  close_alone: {
    roles: ["shift_lead", "manager"],
    categories: ["closing"],
    keywords: ["close", "closing", "shutdown", "end of shift"],
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

function clampPct(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n)))
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

function moduleMatchesCapability(mod: ReadinessModuleInput, hints: CapabilityHints): boolean {
  const title = mod.title.toLowerCase()
  const role = (mod.assignedRole ?? "").toLowerCase()
  if (hints.roles.some((r) => role.includes(r))) return true
  if (hints.keywords.some((k) => title.includes(k))) return true
  return mod.sopRows.some((row) => {
    const cat = (row.standardCategory ?? "").toLowerCase()
    return hints.categories.some((c) => cat === c)
  })
}

function moduleProgressPct(mod: ReadinessModuleInput): number {
  if (mod.pct !== null) return mod.pct
  if (mod.status === "completed") return 100
  if (mod.status === "in_progress") return 40
  return 0
}

function computeSignals(input: ReadinessComputeInput): ReadinessSignalScores {
  const modules = input.modules
  const allSops = modules.flatMap((m) => m.sopRows)
  const sopDone = allSops.filter((s) => s.completed).length
  const sopCompletion = allSops.length === 0 ? 0 : clampPct((sopDone / allSops.length) * 100)

  const modulePcts = modules.map(moduleProgressPct)
  const linkedStandardIds = [
    ...new Set(allSops.map((s) => s.standardId).filter((id) => id.length > 0)),
  ]
  const quizPassedCount = linkedStandardIds.filter((id) =>
    (input.passedQuizStandardIds ?? new Set()).has(id)
  ).length
  const quizCompletion =
    linkedStandardIds.length === 0
      ? 0
      : clampPct((quizPassedCount / linkedStandardIds.length) * 100)

  const videoWatched =
    allSops.length === 0
      ? 0
      : clampPct(
          (allSops.filter((s) => s.completed).length / allSops.length) * 85 +
            (modules.some((m) => m.status === "completed") ? 15 : 0)
        )

  const shiftObservations = computeManagerObservationSignalScore(
    input.managerObservations ?? [],
    input.completedShiftRuns
  )

  const managerSignOffs =
    modules.length === 0
      ? 0
      : clampPct(
          (modules.filter((m) => (input.managerSignedOffModuleIds ?? new Set()).has(m.moduleId)).length /
            modules.length) *
            100
        )

  const practicalCertifications =
    modules.length === 0
      ? 0
      : clampPct(
          (modules.filter((m) => (input.certifiedModuleIds ?? new Set()).has(m.moduleId)).length /
            modules.length) *
            100
        )

  return {
    sopCompletion,
    quizCompletion,
    videoWatched,
    shiftObservations,
    managerSignOffs,
    practicalCertifications,
  }
}

function scoreToStatus(score: number): DelegationReadinessStatus {
  return score >= READINESS_READY_THRESHOLD ? "ready" : "needs_work"
}

function capabilityScore(
  signals: ReadinessSignalScores,
  modules: ReadinessModuleInput[],
  field: ReadinessCapabilityField
): number {
  const hints = CAPABILITY_HINTS[field]
  const relevant = modules.filter((m) => moduleMatchesCapability(m, hints))
  const signalAvg = avg(READINESS_SIGNAL_ORDER.map((k) => signals[k]))

  if (relevant.length === 0) {
    return clampPct(signalAvg * 0.85)
  }

  const relevantModulePct = avg(relevant.map(moduleProgressPct))
  const relevantSops = relevant.flatMap((m) => m.sopRows)
  const sopPct =
    relevantSops.length === 0
      ? relevantModulePct
      : clampPct((relevantSops.filter((s) => s.completed).length / relevantSops.length) * 100)

  return clampPct(signalAvg * 0.45 + relevantModulePct * 0.35 + sopPct * 0.2)
}

export function computeEmployeeReadiness(input: ReadinessComputeInput): ComputedEmployeeReadiness {
  const passedQuizStandardIds = input.passedQuizStandardIds ?? new Set<string>()
  const signals = computeSignals({ ...input, passedQuizStandardIds })
  const overallScore = clampPct(avg(READINESS_SIGNAL_ORDER.map((k) => signals[k])))

  const capabilities: CapabilityReadiness[] = READINESS_CAPABILITY_FIELDS.map((field) => {
    const score = capabilityScore(signals, input.modules, field)
    const calculated = scoreToStatus(score)
    const override = input.overrides[field] ?? null
    const effective = override ?? calculated
    return {
      field,
      label: READINESS_CAPABILITY_LABELS[field],
      score,
      calculated,
      effective,
      overridden: override != null,
      override,
    }
  })

  return { overallScore, signals, capabilities }
}

export function delegationStatusClass(status: DelegationReadinessStatus): string {
  return status === "ready"
    ? "border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-950 dark:text-emerald-200/95"
    : "border-amber-500/30 bg-amber-500/[0.08] text-amber-950 dark:text-amber-200/95"
}
