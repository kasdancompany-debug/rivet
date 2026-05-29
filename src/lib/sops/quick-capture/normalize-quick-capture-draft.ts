import type {
  QuickCaptureDraft,
  QuickCapturePriority,
  QuickCaptureRootCause,
  QuickCaptureStep,
  QuickCaptureStepProof,
} from "./types"

function normalizeForCompare(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

/** Reject text that mostly echoes the raw complaint. */
export function textEchoesInput(field: string, rawText: string): boolean {
  const f = normalizeForCompare(field)
  const r = normalizeForCompare(rawText)
  if (!f || !r || f.length < 8) return false
  if (f === r) return true
  if (r.includes(f) && f.length >= r.length * 0.55) return true
  if (f.includes(r) && r.length >= 12) return true

  const rWords = r.split(" ").filter((w) => w.length > 2)
  if (rWords.length < 4) return false
  const matched = rWords.filter((w) => f.includes(w)).length
  return matched / rWords.length >= 0.72
}

/** @deprecated Alias for textEchoesInput */
export function titleEchoesInput(title: string, rawText: string): boolean {
  return textEchoesInput(title, rawText)
}

export function stepEchoesInput(step: QuickCaptureStep, rawText: string): boolean {
  const combined = `${step.title} ${step.instructions}`
  return textEchoesInput(combined, rawText) || textEchoesInput(step.title, rawText)
}

export function draftHasWeakSteps(steps: QuickCaptureStep[], rawText: string): boolean {
  if (steps.length < 3) return true
  const echoed = steps.filter((s) => stepEchoesInput(s, rawText)).length
  if (echoed >= Math.ceil(steps.length / 2)) return true
  const generic = steps.filter((s) => s.title.toLowerCase() === "run the routine").length
  if (generic > 0) return true
  return false
}

export function stepsAreActionable(steps: QuickCaptureStep[], rawText: string): boolean {
  if (steps.length < 3 || steps.length > 8) return false
  if (draftHasWeakSteps(steps, rawText)) return false
  const distinctTitles = new Set(steps.map((s) => s.title.toLowerCase().trim())).size
  if (distinctTitles < Math.min(3, steps.length)) return false
  const withVerification = steps.filter((s) => (s.verification?.trim().length ?? 0) > 4).length
  return withVerification >= Math.min(2, steps.length)
}

export function draftNeedsHeuristicFallback(draft: QuickCaptureDraft, rawText: string): boolean {
  if (textEchoesInput(draft.title, rawText)) return true
  if (textEchoesInput(draft.operationalProblem, rawText)) return true
  if (textEchoesInput(draft.successCriteria, rawText)) return true
  if (draftHasWeakSteps(draft.steps, rawText)) return true
  if (draft.rootCauses.length < 2) return true
  if (draft.steps.length < 3) return true
  return false
}

function clampLevel(n: unknown, fallback: number): number {
  const num = Math.round(Number(n))
  if (Number.isNaN(num)) return fallback
  return Math.min(5, Math.max(1, num))
}

function parsePriority(raw: unknown): QuickCapturePriority {
  const p = typeof raw === "string" ? raw.toLowerCase().trim() : ""
  if (p === "critical" || p === "high" || p === "medium" || p === "low") return p
  return "medium"
}

function parseProof(raw: unknown): QuickCaptureStepProof | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined
  const o = raw as Record<string, unknown>
  const proof: QuickCaptureStepProof = {}
  if (o.photo === true) proof.photo = true
  if (o.video === true) proof.video = true
  if (o.checklist === true) proof.checklist = true
  if (o.managerSignoff === true) proof.managerSignoff = true
  return Object.keys(proof).length > 0 ? proof : undefined
}

function inferProofFromVerification(verification?: string): QuickCaptureStepProof | undefined {
  const v = verification?.toLowerCase() ?? ""
  const proof: QuickCaptureStepProof = {}
  if (v.includes("photo")) proof.photo = true
  if (v.includes("video")) proof.video = true
  if (v.includes("sign") || v.includes("initial") || v.includes("manager") || v.includes("lead")) {
    proof.managerSignoff = true
  }
  if (v.includes("checklist") || v.includes("tick") || v.includes("log")) proof.checklist = true
  return Object.keys(proof).length > 0 ? proof : { checklist: true }
}

function parseRootCauses(raw: unknown): QuickCaptureRootCause[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((row) => {
      if (!row || typeof row !== "object" || Array.isArray(row)) return null
      const o = row as Record<string, unknown>
      const title = typeof o.title === "string" ? o.title.trim() : ""
      const description = typeof o.description === "string" ? o.description.trim() : ""
      if (!title) return null
      return { title, description: description || title }
    })
    .filter((row): row is QuickCaptureRootCause => row != null)
    .slice(0, 5)
}

function parseStringList(raw: unknown, max = 6): string[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .map((v) => v.trim())
    .filter((v) => !/^(n\/a|none|unknown)$/i.test(v))
    .slice(0, max)
}

function parseSteps(raw: unknown): QuickCaptureStep[] {
  if (!Array.isArray(raw)) return []
  const steps: QuickCaptureStep[] = []
  for (const row of raw) {
    if (!row || typeof row !== "object" || Array.isArray(row)) continue
    const r = row as Record<string, unknown>
    const stepTitle = typeof r.title === "string" ? r.title.trim() : ""
    const instructions = typeof r.instructions === "string" ? r.instructions.trim() : ""
    if (!stepTitle && !instructions) continue
    if (stepTitle.toLowerCase() === "run the routine" && instructions.length > 80) continue

    const verification = typeof r.verification === "string" ? r.verification.trim() : undefined
    const proofRequirements = parseProof(r.proofRequirements) ?? inferProofFromVerification(verification)

    steps.push({
      title: stepTitle || "Step",
      instructions: instructions || stepTitle,
      estimatedMinutes:
        typeof r.estimatedMinutes === "number" && Number.isFinite(r.estimatedMinutes)
          ? Math.max(1, Math.round(r.estimatedMinutes))
          : undefined,
      verification,
      supplies: parseStringList(r.supplies, 8),
      isCritical: r.isCritical === true,
      visualTarget: typeof r.visualTarget === "string" ? r.visualTarget.trim() : undefined,
      commonMistakes: parseStringList(r.commonMistakes, 6),
      proofRequirements,
    })
  }
  return steps
}

function pickNonEchoedString(partial: string | undefined, fallback: string, rawText: string): string {
  const p = partial?.trim() ?? ""
  if (!p || textEchoesInput(p, rawText)) return fallback
  return p
}

export function mergeQuickCaptureDraft(
  partial: Partial<QuickCaptureDraft> & Pick<QuickCaptureDraft, "title" | "category" | "steps">,
  fallback: QuickCaptureDraft,
  rawText: string
): QuickCaptureDraft {
  const usePartialSteps = stepsAreActionable(partial.steps, rawText)
  const steps = usePartialSteps ? partial.steps.slice(0, 8) : fallback.steps

  return {
    title: pickNonEchoedString(partial.title, fallback.title, rawText),
    category: partial.category,
    purpose: pickNonEchoedString(partial.purpose, fallback.purpose, rawText),
    operationalProblem: pickNonEchoedString(partial.operationalProblem, fallback.operationalProblem, rawText),
    priority: partial.priority ?? fallback.priority,
    successCriteria: pickNonEchoedString(partial.successCriteria, fallback.successCriteria, rawText),
    rootCauses:
      partial.rootCauses?.length && !partial.rootCauses.every((c) => textEchoesInput(c.description, rawText))
        ? partial.rootCauses
        : fallback.rootCauses,
    estimatedRisk: pickNonEchoedString(partial.estimatedRisk, fallback.estimatedRisk, rawText),
    verificationMethods:
      partial.verificationMethods?.length && !partial.verificationMethods.some((m) => textEchoesInput(m, rawText))
        ? partial.verificationMethods
        : fallback.verificationMethods,
    trainingRecommendations:
      partial.trainingRecommendations?.length
        ? partial.trainingRecommendations
        : fallback.trainingRecommendations,
    hiddenDependencies:
      partial.hiddenDependencies?.length
        ? partial.hiddenDependencies
        : fallback.hiddenDependencies,
    trainingGaps: partial.trainingGaps?.length ? partial.trainingGaps : fallback.trainingGaps,
    supplies: partial.supplies?.length ? partial.supplies : fallback.supplies,
    timingNotes: partial.timingNotes?.trim() || fallback.timingNotes,
    steps,
    trainingCheckpoints: partial.trainingCheckpoints?.length
      ? partial.trainingCheckpoints
      : fallback.trainingCheckpoints,
    trainingQuestions: partial.trainingQuestions?.length
      ? partial.trainingQuestions
      : fallback.trainingQuestions,
    assignedRoles: partial.assignedRoles?.length ? partial.assignedRoles : fallback.assignedRoles,
    estimatedTimeMinutes: partial.estimatedTimeMinutes ?? fallback.estimatedTimeMinutes,
    ownerDependencyLevel: partial.ownerDependencyLevel ?? fallback.ownerDependencyLevel,
    importanceLevel: partial.importanceLevel ?? fallback.importanceLevel,
  }
}

export function normalizeQuickCaptureDraft(draft: QuickCaptureDraft, rawText: string): QuickCaptureDraft {
  const steps = draft.steps.filter(
    (s) =>
      !stepEchoesInput(s, rawText) &&
      !(s.title.toLowerCase() === "run the routine" && s.instructions.trim() === rawText.trim())
  )

  const merged = mergeQuickCaptureDraft(
    {
      ...draft,
      title: draft.title,
      category: draft.category,
      steps: steps.length >= 3 ? steps : draft.steps,
      purpose: draft.purpose || draft.successCriteria,
      successCriteria: draft.successCriteria || draft.purpose,
      operationalProblem:
        draft.operationalProblem ||
        "The operation lacks a written standard—so repeat mistakes pull the owner back in.",
      rootCauses: draft.rootCauses.length ? draft.rootCauses : [],
      verificationMethods: draft.verificationMethods.length
        ? draft.verificationMethods
        : (steps.map((s) => s.verification).filter(Boolean) as string[]),
      hiddenDependencies: draft.hiddenDependencies ?? [],
      trainingGaps: draft.trainingGaps ?? [],
    },
    draft,
    rawText
  )

  return {
    ...merged,
    hiddenDependencies: merged.hiddenDependencies.length ? merged.hiddenDependencies : draft.hiddenDependencies,
    trainingGaps: merged.trainingGaps.length ? merged.trainingGaps : draft.trainingGaps,
    steps: merged.steps.map((s) => ({
      ...s,
      proofRequirements: s.proofRequirements ?? inferProofFromVerification(s.verification),
      commonMistakes: s.commonMistakes?.length ? s.commonMistakes : undefined,
    })),
  }
}

export function parseOpenAiDraft(raw: unknown): Partial<QuickCaptureDraft> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null
  const o = raw as Record<string, unknown>

  const title = typeof o.title === "string" ? o.title.trim() : ""
  if (title.length < 2) return null

  const categoryRaw = typeof o.category === "string" ? o.category.trim() : "other"
  const steps = parseSteps(o.steps)
  if (steps.length === 0) return null

  return {
    title,
    category: categoryRaw as QuickCaptureDraft["category"],
    purpose: typeof o.purpose === "string" ? o.purpose.trim() : undefined,
    operationalProblem:
      typeof o.operationalProblem === "string" ? o.operationalProblem.trim() : undefined,
    priority: parsePriority(o.priority),
    successCriteria: typeof o.successCriteria === "string" ? o.successCriteria.trim() : undefined,
    rootCauses: parseRootCauses(o.rootCauses),
    estimatedRisk: typeof o.estimatedRisk === "string" ? o.estimatedRisk.trim() : undefined,
    verificationMethods: parseStringList(o.verificationMethods),
    trainingRecommendations: parseStringList(o.trainingRecommendations),
    hiddenDependencies: parseStringList(o.hiddenDependencies, 6),
    trainingGaps: parseStringList(o.trainingGaps, 6),
    supplies: parseStringList(o.supplies, 10),
    timingNotes: typeof o.timingNotes === "string" ? o.timingNotes.trim() : undefined,
    steps,
    trainingCheckpoints: parseStringList(o.trainingCheckpoints),
    trainingQuestions: parseStringList(o.trainingQuestions, 8),
    assignedRoles: parseStringList(o.assignedRoles),
    estimatedTimeMinutes: Math.min(
      240,
      Math.max(5, Math.round(Number(o.estimatedTimeMinutes)) || 20)
    ),
    ownerDependencyLevel: clampLevel(o.ownerDependencyLevel, 3),
    importanceLevel: clampLevel(o.importanceLevel, 3),
  }
}
