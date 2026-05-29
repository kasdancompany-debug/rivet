import { isSopCategory } from "@/lib/sops/categories"

import { inferOperationalPlay } from "./infer-operational-meaning"
import {
  draftNeedsHeuristicFallback,
  mergeQuickCaptureDraft,
  normalizeQuickCaptureDraft,
  parseOpenAiDraft,
} from "./normalize-quick-capture-draft"
import { RIVET_OPERATIONAL_INFERENCE_PROMPT } from "./system-prompt"
import type { QuickCaptureDraft } from "./types"

export async function convertQuickCaptureOpenAi(
  rawText: string,
  opts?: { fromWorkflow?: boolean }
): Promise<QuickCaptureDraft | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  const trimmed = rawText.trim()
  const heuristicFallback = inferOperationalPlay({
    rawText: trimmed,
    fromWorkflow: opts?.fromWorkflow,
  })
  const heuristicDraft = normalizeQuickCaptureDraft(heuristicFallback, trimmed)

  if (!apiKey) return heuristicDraft

  const model = process.env.OPENAI_QUICK_CAPTURE_MODEL?.trim() || "gpt-4o-mini"

  const userContent = opts?.fromWorkflow
    ? `The owner demonstrated this workflow on video. Transcript of what they said and did:\n\n${trimmed}`
    : `Owner describes a recurring operational problem. Infer the runnable play — do not repeat their words:\n\n${trimmed}`

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.25,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: RIVET_OPERATIONAL_INFERENCE_PROMPT },
        { role: "user", content: userContent },
      ],
    }),
  })

  if (!response.ok) return heuristicDraft

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string | null } }[]
  }

  const content = payload.choices?.[0]?.message?.content
  if (!content) return heuristicDraft

  try {
    const parsed = JSON.parse(content) as unknown
    const partial = parseOpenAiDraft(parsed)
    if (!partial?.title || !partial.steps?.length) return heuristicDraft

    const category = isSopCategory(partial.category ?? "other") ? partial.category! : "other"
    const merged = mergeQuickCaptureDraft(
      {
        ...partial,
        title: partial.title,
        category,
        steps: partial.steps,
        hiddenDependencies: partial.hiddenDependencies ?? [],
        trainingGaps: partial.trainingGaps ?? [],
      },
      heuristicDraft,
      trimmed
    )
    const normalized = normalizeQuickCaptureDraft(merged, trimmed)

    if (draftNeedsHeuristicFallback(normalized, trimmed)) {
      return heuristicDraft
    }

    return normalized
  } catch {
    return heuristicDraft
  }
}
