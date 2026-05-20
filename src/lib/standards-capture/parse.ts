import type { Json } from "@/types/database"

import type { ExampleAsset, StandardsCaptureV1 } from "./types"
import { STANDARDS_CAPTURE_VERSION } from "./types"

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

function parseStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.filter(isNonEmptyString).map((s) => s.trim())
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
  const qualityStandards = parseStringArray(o.qualityStandards)
  const acceptableExamples = parseExamples(o.acceptableExamples)
  const unacceptableExamples = parseExamples(o.unacceptableExamples)
  const assignedRoles = parseStringArray(o.assignedRoles)
  const competencyMarkers = parseStringArray(o.competencyMarkers)

  const result: StandardsCaptureV1 = {
    version: STANDARDS_CAPTURE_VERSION,
    onboarding,
    videoUrl: videoUrl ?? null,
    walkthroughMediaId,
    photoUrls,
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
    c.photoUrls.length === 0 &&
    c.qualityStandards.length === 0 &&
    c.acceptableExamples.length === 0 &&
    c.unacceptableExamples.length === 0 &&
    c.assignedRoles.length === 0 &&
    c.competencyMarkers.length === 0
  )
}
