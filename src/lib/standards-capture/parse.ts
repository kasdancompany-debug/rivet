import type { Json } from "@/types/database"

import type { ExampleAsset, StandardsCaptureV1 } from "./types"
import { STANDARDS_CAPTURE_VERSION } from "./types"
import { parseTrainingPack } from "@/lib/training/generate-training-pack"

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0
}

function parseExamples(raw: unknown): ExampleAsset[] {
  if (!Array.isArray(raw)) return []
  const out: ExampleAsset[] = []
  for (const item of raw) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue
    const o = item as Record<string, unknown>
    if (!isNonEmptyString(o.url)) continue
    out.push({
      url: o.url.trim(),
      caption: isNonEmptyString(o.caption) ? o.caption.trim() : undefined,
    })
  }
  return out
}

function parseStringArray(raw: unknown, max = 999): string[] {
  if (!Array.isArray(raw)) return []
  return raw.filter(isNonEmptyString).map((s) => s.trim()).slice(0, max)
}

/** Returns parsed capture or null if missing / wrong version / empty shell. */
export function parseStandardsCapture(raw: Json | null | undefined): StandardsCaptureV1 | null {
  if (raw === null || raw === undefined) return null
  if (typeof raw !== "object" || Array.isArray(raw)) return null
  const o = raw as Record<string, unknown>
  if (o.version !== STANDARDS_CAPTURE_VERSION) return null

  const onboardingRaw = o.onboarding
  let onboarding: StandardsCaptureV1["onboarding"]
  if (onboardingRaw && typeof onboardingRaw === "object" && !Array.isArray(onboardingRaw)) {
    const on = onboardingRaw as Record<string, unknown>
    onboarding = {
      interrupts: isNonEmptyString(on.interrupts) ? on.interrupts.trim() : undefined,
      headOnly: isNonEmptyString(on.headOnly) ? on.headOnly.trim() : undefined,
      weekAway: isNonEmptyString(on.weekAway) ? on.weekAway.trim() : undefined,
    }
  }

  const videoUrl =
    o.videoUrl === null || o.videoUrl === undefined
      ? undefined
      : isNonEmptyString(o.videoUrl)
        ? o.videoUrl.trim()
        : undefined

  const walkthroughMediaId =
    o.walkthroughMediaId === null || o.walkthroughMediaId === undefined
      ? null
      : isNonEmptyString(o.walkthroughMediaId)
        ? o.walkthroughMediaId.trim()
        : null

  const photoUrls = parseStringArray(o.photoUrls)
  const photoMediaIds = parseStringArray(o.photoMediaIds)
  const qualityStandards = parseStringArray(o.qualityStandards)
  const acceptableExamples = parseExamples(o.acceptableExamples)
  const unacceptableExamples = parseExamples(o.unacceptableExamples)
  const assignedRoles = parseStringArray(o.assignedRoles)
  const competencyMarkers = parseStringArray(o.competencyMarkers)
  const attachmentMediaIds = parseStringArray(o.attachmentMediaIds)
  const supportingDocumentMediaIds = parseStringArray(o.supportingDocumentMediaIds)
  const audioExplanationMediaId =
    o.audioExplanationMediaId === null || o.audioExplanationMediaId === undefined
      ? null
      : isNonEmptyString(o.audioExplanationMediaId)
        ? o.audioExplanationMediaId.trim()
        : null

  const playInferenceRaw = o.playInference
  let playInference: StandardsCaptureV1["playInference"]
  if (playInferenceRaw && typeof playInferenceRaw === "object" && !Array.isArray(playInferenceRaw)) {
    const pi = playInferenceRaw as Record<string, unknown>
    playInference = {
      operationalProblem: isNonEmptyString(pi.operationalProblem) ? pi.operationalProblem.trim() : "",
      priority: isNonEmptyString(pi.priority) ? pi.priority.trim() : "medium",
      successCriteria: isNonEmptyString(pi.successCriteria) ? pi.successCriteria.trim() : "",
      rootCauses: Array.isArray(pi.rootCauses)
        ? pi.rootCauses
            .map((row) => {
              if (!row || typeof row !== "object" || Array.isArray(row)) return null
              const r = row as Record<string, unknown>
              const t = isNonEmptyString(r.title) ? r.title.trim() : ""
              if (!t) return null
              return {
                title: t,
                description: isNonEmptyString(r.description) ? r.description.trim() : t,
              }
            })
            .filter((x): x is { title: string; description: string } => x != null)
        : [],
      estimatedRisk: isNonEmptyString(pi.estimatedRisk) ? pi.estimatedRisk.trim() : "",
      verificationMethods: parseStringArray(pi.verificationMethods),
      trainingRecommendations: parseStringArray(pi.trainingRecommendations),
      hiddenDependencies: parseStringArray(pi.hiddenDependencies, 8),
      trainingGaps: parseStringArray(pi.trainingGaps, 8),
      supplies: parseStringArray(pi.supplies, 12),
      timingNotes: isNonEmptyString(pi.timingNotes) ? pi.timingNotes.trim() : undefined,
    }
  }

  const trainingPack = parseTrainingPack(o.trainingPack) ?? undefined

  const operationalMemoryRaw = o.operationalMemory
  let operationalMemory: StandardsCaptureV1["operationalMemory"]
  if (operationalMemoryRaw && typeof operationalMemoryRaw === "object" && !Array.isArray(operationalMemoryRaw)) {
    const om = operationalMemoryRaw as Record<string, unknown>
    operationalMemory = {
      successLooksLike: isNonEmptyString(om.successLooksLike) ? om.successLooksLike.trim() : "",
      failureLooksLike: isNonEmptyString(om.failureLooksLike) ? om.failureLooksLike.trim() : "",
      newHireMistakes: parseStringArray(om.newHireMistakes, 8),
      ifNobodyAsks: isNonEmptyString(om.ifNobodyAsks) ? om.ifNobodyAsks.trim() : "",
      ownerNote: isNonEmptyString(om.ownerNote) ? om.ownerNote.trim() : undefined,
      faqs: Array.isArray(om.faqs)
        ? om.faqs
            .map((row) => {
              if (!row || typeof row !== "object" || Array.isArray(row)) return null
              const r = row as Record<string, unknown>
              const q = isNonEmptyString(r.question) ? r.question.trim() : ""
              const a = isNonEmptyString(r.answer) ? r.answer.trim() : ""
              if (!q || !a) return null
              return { question: q, answer: a }
            })
            .filter((x): x is { question: string; answer: string } => x != null)
        : undefined,
      goodExampleMediaId:
        om.goodExampleMediaId === null || om.goodExampleMediaId === undefined
          ? null
          : isNonEmptyString(om.goodExampleMediaId)
            ? om.goodExampleMediaId.trim()
            : null,
      badExampleMediaId:
        om.badExampleMediaId === null || om.badExampleMediaId === undefined
          ? null
          : isNonEmptyString(om.badExampleMediaId)
            ? om.badExampleMediaId.trim()
            : null,
    }
  }

  const result: StandardsCaptureV1 = {
    version: STANDARDS_CAPTURE_VERSION,
    onboarding,
    videoUrl: videoUrl ?? null,
    walkthroughMediaId,
    photoMediaIds,
    photoUrls,
    audioExplanationMediaId,
    supportingDocumentMediaIds,
    attachmentMediaIds,
    playInference,
    operationalMemory,
    trainingPack,
    qualityStandards,
    acceptableExamples,
    unacceptableExamples,
    assignedRoles,
    competencyMarkers,
  }

  if (isCaptureDisplayEmpty(result)) return null

  return result
}

function isCaptureDisplayEmpty(c: StandardsCaptureV1): boolean {
  const on = c.onboarding
  const hasOnboarding = !!(on?.interrupts || on?.headOnly || on?.weekAway)
  return (
    !hasOnboarding &&
    !c.videoUrl &&
    !c.walkthroughMediaId &&
    (c.photoMediaIds?.length ?? 0) === 0 &&
    !c.audioExplanationMediaId &&
    (c.supportingDocumentMediaIds?.length ?? 0) === 0 &&
    (c.attachmentMediaIds?.length ?? 0) === 0 &&
    !c.playInference &&
    !c.operationalMemory &&
    !c.trainingPack &&
    c.photoUrls.length === 0 &&
    c.qualityStandards.length === 0 &&
    c.acceptableExamples.length === 0 &&
    c.unacceptableExamples.length === 0 &&
    c.assignedRoles.length === 0 &&
    c.competencyMarkers.length === 0
  )
}
