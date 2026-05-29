import { SOP_CATEGORIES, formatSopCategory, type SopCategoryValue } from "@/lib/sops/categories"

import type {
  QuickCaptureDraft,
  QuickCapturePriority,
  QuickCaptureRootCause,
  QuickCaptureStep,
} from "./types"

export type OperationalInferenceInput = {
  rawText: string
  fromWorkflow?: boolean
}

export type ParsedComplaint = {
  personName: string | null
  failureVerb: string
  taskRaw: string
  taskTitle: string
  timingHint: "opening" | "closing" | "shift" | null
}

const KNOWN_CATEGORIES = new Set<string>(SOP_CATEGORIES.map((c) => c.value))

function clampLevel(n: number): number {
  return Math.min(5, Math.max(1, Math.round(n)))
}

function normalizeWhitespace(text: string): string {
  return text.trim().replace(/\s+/g, " ")
}

function titleCase(text: string): string {
  const t = text.trim()
  if (!t) return t
  return t.charAt(0).toUpperCase() + t.slice(1)
}

export function parseStaffFailureComplaint(text: string): ParsedComplaint | null {
  const trimmed = normalizeWhitespace(text)

  const keepsForgetting = trimmed.match(
    /^(\w+)\s+keeps?\s+forgetting\s+(?:to\s+)?(.+?)(?:\s+at\s+(opening|open|closing|close|shift(?:\s+change)?))?\.?$/i
  )
  if (keepsForgetting?.[2]) {
    return buildParsedComplaint(keepsForgetting[1]!, "keeps forgetting", keepsForgetting[2], keepsForgetting[3])
  }

  const forgets = trimmed.match(
    /^(\w+)\s+forgets?\s+(?:to\s+)?(.+?)(?:\s+at\s+(opening|open|closing|close|shift(?:\s+change)?))?\.?$/i
  )
  if (forgets?.[2]) {
    return buildParsedComplaint(forgets[1]!, "forgets", forgets[2], forgets[3])
  }

  const genericKeeps = trimmed.match(
    /keeps?\s+forgetting\s+(?:to\s+)?(.+?)(?:\s+at\s+(opening|open|closing|close|shift(?:\s+change)?))?\.?$/i
  )
  if (genericKeeps?.[1]) {
    return buildParsedComplaint(null, "keeps forgetting", genericKeeps[1], genericKeeps[2])
  }

  return null
}

function buildParsedComplaint(
  personName: string | null,
  failureVerb: string,
  taskRaw: string,
  timingRaw?: string
): ParsedComplaint {
  let task = taskRaw.trim().replace(/[.!?]+$/, "")
  let timingHint: ParsedComplaint["timingHint"] = null

  if (timingRaw) {
    const when = timingRaw.toLowerCase()
    if (when.includes("open")) timingHint = "opening"
    else if (when.includes("clos")) timingHint = "closing"
    else timingHint = "shift"
  } else {
    const embedded = task.match(/\s+at\s+(opening|open|closing|close|shift(?:\s+change)?)$/i)
    if (embedded) {
      const when = embedded[1]!.toLowerCase()
      task = task.replace(/\s+at\s+(opening|open|closing|close|shift(?:\s+change)?)$/i, "").trim()
      if (when.includes("open")) timingHint = "opening"
      else if (when.includes("clos")) timingHint = "closing"
      else timingHint = "shift"
    }
  }

  return {
    personName,
    failureVerb,
    taskRaw: task,
    taskTitle: titleCase(task),
    timingHint,
  }
}

export function inferCategoryFromText(text: string, taskRaw?: string): SopCategoryValue {
  const lower = `${text} ${taskRaw ?? ""}`.toLowerCase()
  if (/\bfreezer|fridge|cooler|load(?:ing)?\s+the\s+freezer\b/.test(lower)) return "product_quality"
  if (/\bclos(e|ing|e-out|e out)\b/.test(lower)) return "closing"
  if (/\bopen(ing)?\b/.test(lower)) return "opening"
  if (/\bclean(ing)?\b/.test(lower)) return "cleaning"
  if (/\bcash|deposit|drawer|till\b/.test(lower)) return "cash_handling"
  if (/\btrain(ing)?\b/.test(lower)) return "training"
  if (/\bcustomer|guest|service|complaint\b/.test(lower)) return "customer_experience"
  if (/\bquality|product|recipe|dial-in|food safety|temp\b/.test(lower)) return "product_quality"
  return "other"
}

function inferPriority(category: SopCategoryValue, dependency: number): QuickCapturePriority {
  if (category === "opening" || category === "closing" || category === "cash_handling") {
    return dependency >= 4 ? "critical" : "high"
  }
  if (dependency >= 4) return "high"
  if (dependency >= 3) return "medium"
  return "low"
}

function inferRiskLabel(category: SopCategoryValue, dependency: number, taskRaw: string): string {
  const lower = taskRaw.toLowerCase()
  if (/\bfreezer|fridge|cooler|temp|food safety\b/.test(lower)) {
    return dependency >= 4 ? "High — product safety and spoilage risk" : "Moderate — quality drift and rework"
  }
  if (category === "cash_handling") return "High — cash and compliance exposure"
  if (category === "closing" || category === "opening") {
    return dependency >= 4 ? "High — day cannot start/end without owner" : "Moderate — shift handoff variance"
  }
  return dependency >= 4 ? "High — owner pulled back in repeatedly" : "Moderate — repeat mistakes and interrupts"
}

function buildRootCauses(
  parsed: ParsedComplaint | null,
  category: SopCategoryValue
): QuickCaptureRootCause[] {
  const causes: QuickCaptureRootCause[] = [
    {
      title: "Process undocumented",
      description: "The task lives in memory—not a checklist the team can run without guessing.",
    },
    {
      title: "No visual standard",
      description: "There is no photo, diagram, or reference for what done-right looks like on the floor.",
    },
    {
      title: "No proof of completion",
      description: "Nobody signs off or captures evidence—so misses surface only after the owner notices.",
    },
  ]

  if (parsed?.personName) {
    causes.push({
      title: "Single-person habit",
      description: `${parsed.personName} became the default—without a shared standard others can follow.`,
    })
  }

  if (category === "product_quality") {
    causes.push({
      title: "No measurable quality gate",
      description: "There is no sign-off for temperature, load pattern, or visual standard before handoff.",
    })
  } else if (category === "closing" || category === "opening") {
    causes.push({
      title: "Handoff gap",
      description: "Open/close steps are not sequenced with a named owner and spot-check.",
    })
  } else {
    causes.push({
      title: "No escalation path",
      description: "When unsure, staff route back to the owner instead of a documented decision.",
    })
  }

  return causes.slice(0, 4)
}

function buildFreezerLoadingSteps(_taskTitle: string): QuickCaptureStep[] {
  return [
    {
      title: "Check minimum stock levels",
      instructions:
        "Compare on-hand counts to par levels before loading. Flag shortages on the shift sheet—do not guess what to skip.",
      estimatedMinutes: 3,
      verification: "Par sheet updated; shortages called out before load starts.",
      supplies: ["Par level sheet", "Shift log"],
      isCritical: true,
      proofRequirements: { checklist: true },
    },
    {
      title: "Rotate oldest inventory forward",
      instructions:
        "Pull older product forward (FIFO). Remove expired or compromised items before adding new stock.",
      estimatedMinutes: 5,
      verification: "Oldest product is forward-facing; expired product removed and logged.",
      isCritical: true,
      proofRequirements: { checklist: true },
    },
    {
      title: "Load freezer by layout",
      instructions:
        "Follow the posted load diagram: heavy on bottom, no blocked vents, do not exceed the fill line.",
      estimatedMinutes: 8,
      verification: "Load matches diagram; vents clear; fill line visible.",
      supplies: ["Load diagram"],
      visualTarget: "Freezer matches posted layout with oldest product forward.",
      commonMistakes: ["Overfilling past the line", "Blocking air vents", "New stock behind old stock"],
      isCritical: true,
      proofRequirements: { checklist: true, photo: true },
    },
    {
      title: "Take completion photo",
      instructions: "Photograph the finished load from the standard angle before handoff or clock-out.",
      estimatedMinutes: 2,
      verification: "Photo attached to shift log or checklist tick.",
      isCritical: false,
      proofRequirements: { photo: true },
    },
    {
      title: "Sign off before clock-out",
      instructions:
        "Initial the checklist and confirm temp is in range. Shift lead spot-checks until the routine holds without reminders.",
      estimatedMinutes: 2,
      verification: "Signed checklist; lead initials on spot-check.",
      isCritical: true,
      proofRequirements: { checklist: true, managerSignoff: true },
    },
  ]
}

function buildGenericOperationalSteps(taskTitle: string, category: SopCategoryValue): QuickCaptureStep[] {
  const taskLower = taskTitle.toLowerCase()
  if (taskLower.includes("freezer") || taskLower.includes("load")) {
    return buildFreezerLoadingSteps(taskTitle)
  }

  const when =
    category === "closing" ? "before close" : category === "opening" ? "before open" : "during the shift"

  return [
    {
      title: "Set up for the task",
      instructions: `Gather tools and confirm prerequisites ${when}. Read the checklist—do not improvise from memory.`,
      estimatedMinutes: 3,
      verification: "Checklist tick or photo before starting.",
    },
    {
      title: taskTitle,
      instructions: `Complete ${taskTitle.toLowerCase()} using the written sequence. If anything is unclear, use the escalation note—not a text to the owner.`,
      estimatedMinutes: 10,
      verification: "Observable outcome matches the success criteria below.",
      isCritical: true,
    },
    {
      title: "Verify and hand off",
      instructions:
        "Run the verification step, sign the shift log, and call out exceptions to the shift lead—not the owner.",
      estimatedMinutes: 2,
      verification: "Shift log signed; lead spot-check recorded.",
    },
  ]
}

function buildPlayTitle(parsed: ParsedComplaint | null, category: SopCategoryValue): string {
  if (!parsed) {
    const label = formatSopCategory(category)
    return `${label} standard`
  }

  const task = parsed.taskTitle
  const taskLower = task.toLowerCase()
  if (taskLower.includes("freezer") && (parsed.timingHint === "closing" || category === "closing")) {
    return "Freezer loading and end-of-shift stocking"
  }
  if (taskLower.includes("freezer") || taskLower.includes("load")) {
    return "Freezer loading and end-of-shift stocking"
  }
  if (parsed.timingHint === "closing") return `${task} — closing`
  if (parsed.timingHint === "opening") return `${task} — opening`
  if (parsed.timingHint === "shift") return `${task} — shift change`

  if (category === "closing") return `${task} — closing`
  if (category === "opening") return `${task} — opening`
  if (category === "product_quality") return `${task} — quality standard`
  return task
}

function buildOperationalProblem(parsed: ParsedComplaint | null, category: SopCategoryValue): string {
  if (parsed) {
    const who = parsed.personName ? `${parsed.personName}'s misses` : "Repeat misses"
    return `${who} on "${parsed.taskRaw}" show the task is not owned by a written standard—so quality varies and the owner gets pulled back in.`
  }
  return `The team lacks a repeatable standard for this ${formatSopCategory(category).toLowerCase()} workflow—so judgment calls route back to the owner.`
}

function buildSuccessCriteria(parsed: ParsedComplaint | null, category: SopCategoryValue): string {
  const task = parsed?.taskRaw ?? "this task"
  if (/\bfreezer|fridge|cooler\b/i.test(task)) {
    return "Freezer is loaded to diagram, temp logged in range, and signed off before handoff—without owner reminders."
  }
  if (category === "closing") return "Close completes with every critical step signed off—no owner texts about missed tasks."
  if (category === "opening") return "Open completes on time with checklist signed—owner not needed for step one."
  return `${parsed?.taskTitle ?? "The task"} completes the same way every shift—with verification recorded, not remembered.`
}

function buildVerificationMethods(taskRaw: string, category: SopCategoryValue): string[] {
  const methods = ["Shift log sign-off", "Shift lead spot-check until habit sticks"]
  if (/\bfreezer|fridge|temp\b/i.test(taskRaw)) {
    methods.unshift("Temperature log in range before and after load")
    methods.unshift("Load diagram photo or checklist tick")
  }
  if (category === "cash_handling") methods.unshift("Dual verification on deposit count")
  return [...new Set(methods)].slice(0, 5)
}

function buildHiddenDependencies(
  parsed: ParsedComplaint | null,
  category: SopCategoryValue,
  taskRaw: string
): string[] {
  const lower = taskRaw.toLowerCase()
  const deps: string[] = []

  if (/\bfreezer|fridge|cooler\b/.test(lower)) {
    deps.push("Par levels must be confirmed before load—otherwise the team loads the wrong mix.")
    deps.push("Receiving labels and FIFO depend on each other—skip dating and rotation fails.")
    deps.push("Temp log must be in range before load—loading on a failing unit masks spoilage.")
  } else if (category === "closing") {
    deps.push("Cash and deposit steps depend on drawer count being complete first.")
    deps.push("Alarm and lock steps assume cleaning and equipment shutdown are done.")
  } else if (category === "opening") {
    deps.push("Equipment warm-up depends on utilities and safety checks completing first.")
  } else {
    deps.push("Upstream prep must be done—otherwise this step looks done but fails later.")
    deps.push("Shift handoff assumes the prior shift logged exceptions.")
  }

  if (parsed?.personName) {
    deps.push("Verbal reminders from one person do not scale—written standard must replace habit.")
  }

  return deps.slice(0, 5)
}

function buildTrainingGaps(
  parsed: ParsedComplaint | null,
  category: SopCategoryValue,
  taskRaw: string
): string[] {
  const lower = taskRaw.toLowerCase()
  const gaps: string[] = [
    "How to verify completion before handoff—not only how to start the task",
    "When to escalate to shift lead vs text the owner",
  ]

  if (/\bfreezer|fridge|load\b/.test(lower)) {
    gaps.push("How to read load diagram, fill line, and vent clearance")
    gaps.push("How to take the standard completion photo angle")
    gaps.push("How to log temperature and what range is acceptable")
  }
  if (category === "closing" || category === "opening") {
    gaps.push("Sequence order for open/close—what must never be skipped")
  }
  if (parsed?.personName) {
    gaps.push(`What "done right" looks like without ${parsed.personName} being on shift`)
  }

  return [...new Set(gaps)].slice(0, 6)
}

function buildTrainingRecommendations(
  parsed: ParsedComplaint | null,
  category: SopCategoryValue,
  taskTitle: string
): string[] {
  const recs = [
    `Module: ${taskTitle} — watch, demonstrate, then run once without coaching.`,
    "Sign-off requires completing the checklist on a live shift, not shadowing only.",
  ]
  if (parsed?.personName) {
    recs.push(`${parsed.personName} retrains on the written standard—not verbal reminders from the owner.`)
  }
  if (category === "closing" || category === "opening") {
    recs.push("Closing/opening competency badge tied to this checklist.")
  }
  return recs.slice(0, 4)
}

function inferDependency(text: string, parsed: ParsedComplaint | null): number {
  const lower = text.toLowerCase()
  let score = parsed ? 4 : 3
  if (/\b(only i|just me|owner only|i always|when i'm)\b/.test(lower)) score += 1
  if (/\b(without me|anyone can|team runs)\b/.test(lower)) score -= 1
  return clampLevel(score)
}

function inferImportance(category: SopCategoryValue, dependency: number): number {
  if (category === "opening" || category === "closing" || category === "cash_handling") {
    return clampLevel(Math.max(4, dependency))
  }
  if (category === "product_quality") return clampLevel(Math.max(4, dependency))
  return clampLevel(Math.max(3, dependency - 1))
}

function inferRoles(text: string, category: SopCategoryValue): string[] {
  const lower = text.toLowerCase()
  const roles: string[] = []
  if (/\bshift lead|lead\b/.test(lower) || category === "closing" || category === "opening") {
    roles.push("shift_lead")
  }
  if (/\bbarista|espresso|coffee\b/.test(lower)) roles.push("barista")
  if (/\bcounter|front\b/.test(lower)) roles.push("front_counter")
  if (roles.length === 0) {
    if (category === "closing" || category === "opening") roles.push("shift_lead")
    else roles.push("manager")
  }
  return [...new Set(roles)]
}

function estimateMinutes(steps: QuickCaptureStep[]): number {
  const sum = steps.reduce((acc, s) => acc + (s.estimatedMinutes ?? 5), 0)
  return Math.min(120, Math.max(10, sum))
}

/** Heuristic operational inference — never echo raw complaint as title. */
export function inferOperationalPlay(input: OperationalInferenceInput): QuickCaptureDraft {
  const text = normalizeWhitespace(input.rawText)
  const parsed = parseStaffFailureComplaint(text)
  const categoryFromTiming =
    parsed?.timingHint === "closing"
      ? "closing"
      : parsed?.timingHint === "opening"
        ? "opening"
        : null
  const category = categoryFromTiming ?? inferCategoryFromText(text, parsed?.taskRaw)
  const safeCategory = KNOWN_CATEGORIES.has(category) ? category : "other"
  const ownerDependencyLevel = inferDependency(text, parsed)
  const importanceLevel = inferImportance(safeCategory, ownerDependencyLevel)
  const title = buildPlayTitle(parsed, safeCategory)
  const taskTitle = parsed?.taskTitle ?? title
  const steps = buildGenericOperationalSteps(taskTitle, safeCategory)
  const operationalProblem = buildOperationalProblem(parsed, safeCategory)
  const successCriteria = buildSuccessCriteria(parsed, safeCategory)
  const rootCauses = buildRootCauses(parsed, safeCategory)
  const verificationMethods = buildVerificationMethods(parsed?.taskRaw ?? text, safeCategory)
  const trainingRecommendations = buildTrainingRecommendations(parsed, safeCategory, taskTitle)
  const hiddenDependencies = buildHiddenDependencies(parsed, safeCategory, parsed?.taskRaw ?? text)
  const trainingGaps = buildTrainingGaps(parsed, safeCategory, parsed?.taskRaw ?? text)

  const trainingCheckpoints = [
    safeCategory === "closing"
      ? "Closing without owner"
      : safeCategory === "opening"
        ? "Opening without owner"
        : `${taskTitle} sign-off`,
    ...trainingRecommendations.slice(0, 1),
  ]

  const trainingQuestions = [
    `What does success look like for ${taskTitle.toLowerCase()}?`,
    "What should you do if you're unsure mid-task?",
    "How is completion verified before handoff?",
  ]

  return {
    title,
    category: safeCategory,
    purpose: successCriteria,
    operationalProblem,
    priority: inferPriority(safeCategory, ownerDependencyLevel),
    successCriteria,
    rootCauses,
    estimatedRisk: inferRiskLabel(safeCategory, ownerDependencyLevel, parsed?.taskRaw ?? text),
    verificationMethods,
    trainingRecommendations,
    hiddenDependencies,
    trainingGaps,
    supplies: steps.flatMap((s) => s.supplies ?? []).filter(Boolean).slice(0, 8),
    timingNotes: parsed?.timingHint
      ? `Runs at ${parsed.timingHint.replace("_", " ")}`
      : input.fromWorkflow
        ? "Timing captured from workflow demonstration"
        : undefined,
    steps: steps.slice(0, 8),
    trainingCheckpoints: [...new Set(trainingCheckpoints)].slice(0, 4),
    trainingQuestions,
    assignedRoles: inferRoles(text, safeCategory),
    estimatedTimeMinutes: estimateMinutes(steps),
    ownerDependencyLevel,
    importanceLevel,
  }
}
