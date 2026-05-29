import type { Json } from "@/types/database"

import type { OperationalMemory, StandardsCaptureV1 } from "./types"
import { parseStandardsCapture } from "./parse"

export function validateOperationalMemoryForPublish(capture: Json | undefined): string | null {
  if (capture === undefined || capture === null) {
    return "Complete operational memory (success, failure, examples, mistakes) before publishing."
  }
  const parsed = parseStandardsCapture(capture)
  const memory = parsed?.operationalMemory
  if (!memory) {
    return "Complete operational memory before publishing — Rivet needs success/failure examples for Ask Rivet."
  }
  if (memory.successLooksLike.trim().length < 8) {
    return "Describe what success looks like (at least one clear sentence) before publishing."
  }
  if (memory.failureLooksLike.trim().length < 8) {
    return "Describe what failure looks like before publishing."
  }
  if (memory.newHireMistakes.length < 1) {
    return "List at least one mistake new hires make before publishing."
  }
  if (memory.ifNobodyAsks.trim().length < 8) {
    return "Describe what should happen if nobody asks for help before publishing."
  }
  if (!memory.goodExampleMediaId) {
    return "Upload a good example photo or video before publishing."
  }
  if (!memory.badExampleMediaId) {
    return "Upload a bad example photo or video before publishing."
  }
  return null
}

export function mergeOperationalMemoryIntoCapture(
  capture: StandardsCaptureV1,
  memory: OperationalMemory
): StandardsCaptureV1 {
  return {
    ...capture,
    operationalMemory: memory,
    acceptableExamples: memory.goodExampleMediaId
      ? [{ url: `/api/standard-media/${memory.goodExampleMediaId}`, caption: "Good example" }]
      : capture.acceptableExamples,
    unacceptableExamples: memory.badExampleMediaId
      ? [{ url: `/api/standard-media/${memory.badExampleMediaId}`, caption: "Bad example" }]
      : capture.unacceptableExamples,
  }
}
