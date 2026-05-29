import type { Json } from "@/types/database"

export type StepExampleRef = {
  mediaId?: string
  url?: string
  caption?: string
}

export type StepPlayMetadata = {
  /** Why this step matters on the floor — one scannable line. */
  whyItMatters?: string
  visualTarget?: string
  commonMistakes?: string[]
  goodExample?: StepExampleRef
  badExample?: StepExampleRef
  mediaIds?: string[]
}

export function emptyStepPlayMetadata(): StepPlayMetadata {
  return {}
}

export function parseStepPlayMetadata(raw: Json | null | undefined): StepPlayMetadata {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {}
  const o = raw as Record<string, unknown>

  const visualTarget = typeof o.visualTarget === "string" ? o.visualTarget.trim() : undefined
  const commonMistakes = Array.isArray(o.commonMistakes)
    ? o.commonMistakes
        .filter((m): m is string => typeof m === "string" && m.trim().length > 0)
        .map((m) => m.trim())
        .slice(0, 6)
    : undefined

  function parseExample(key: "goodExample" | "badExample"): StepExampleRef | undefined {
    const ex = o[key]
    if (!ex || typeof ex !== "object" || Array.isArray(ex)) return undefined
    const e = ex as Record<string, unknown>
    const mediaId = typeof e.mediaId === "string" ? e.mediaId.trim() : undefined
    const url = typeof e.url === "string" ? e.url.trim() : undefined
    const caption = typeof e.caption === "string" ? e.caption.trim() : undefined
    if (!mediaId && !url && !caption) return undefined
    return { mediaId, url, caption }
  }

  const mediaIds = Array.isArray(o.mediaIds)
    ? o.mediaIds.filter((id): id is string => typeof id === "string" && id.trim().length > 0)
    : undefined

  return {
    visualTarget: visualTarget || undefined,
    commonMistakes: commonMistakes?.length ? commonMistakes : undefined,
    goodExample: parseExample("goodExample"),
    badExample: parseExample("badExample"),
    mediaIds: mediaIds?.length ? mediaIds : undefined,
  }
}

export function stepPlayMetadataToJson(meta: StepPlayMetadata): Json {
  const out: Record<string, unknown> = {}
  if (meta.whyItMatters?.trim()) out.whyItMatters = meta.whyItMatters.trim()
  if (meta.visualTarget?.trim()) out.visualTarget = meta.visualTarget.trim()
  if (meta.commonMistakes?.length) out.commonMistakes = meta.commonMistakes
  if (meta.goodExample) out.goodExample = meta.goodExample
  if (meta.badExample) out.badExample = meta.badExample
  if (meta.mediaIds?.length) out.mediaIds = meta.mediaIds
  return out as Json
}

/** Infer visual target + common mistakes when AI/heuristic did not populate them. */
export function enrichStepPlayMetadata(
  meta: StepPlayMetadata,
  step: { title: string; instructions: string; verification?: string | null; isCritical?: boolean }
): StepPlayMetadata {
  const title = step.title.trim()
  const instructions = step.instructions.trim()
  const visualTarget =
    meta.visualTarget?.trim() ||
    (instructions.length >= 12
      ? `Finished state matches: ${instructions.slice(0, 120).replace(/\.$/, "")}.`
      : title
        ? `What "${title}" looks like when done correctly—match the reference, not memory.`
        : undefined)

  const mistakes = meta.commonMistakes?.length
    ? meta.commonMistakes
    : [
        step.isCritical ? "Skipping this step under rush" : "Rushing without checking the standard",
        "Assuming someone else already did it",
        "Texting the owner instead of using the verification step",
      ].slice(0, step.isCritical ? 3 : 2)

  const whyItMatters =
    meta.whyItMatters?.trim() ||
    (step.isCritical
      ? "Stop-the-line step — skipping this pulls the owner back in or creates rework."
      : step.verification?.trim()
        ? `Proof this step before moving on: ${step.verification.trim().slice(0, 100)}${step.verification.length > 100 ? "…" : ""}`
        : title
          ? `"${title}" keeps the play consistent when the floor is busy — follow the standard, don't improvise.`
          : "Each step protects quality when pressure is high.")

  return {
    ...meta,
    whyItMatters,
    visualTarget,
    commonMistakes: mistakes,
  }
}
