import { isSopCategory } from "@/lib/sops/categories"
import { inferOperationalPlay } from "@/lib/sops/quick-capture/infer-operational-meaning"
import {
  draftNeedsHeuristicFallback,
  mergeQuickCaptureDraft,
  normalizeQuickCaptureDraft,
  parseOpenAiDraft,
} from "@/lib/sops/quick-capture/normalize-quick-capture-draft"
import { RIVET_OPERATIONAL_INFERENCE_PROMPT } from "@/lib/sops/quick-capture/system-prompt"
import type { QuickCaptureDraft } from "@/lib/sops/quick-capture/types"

import type { MediaCaptureContext } from "./types"

type ChatContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string; detail?: "low" | "high" | "auto" } }

function buildUserContent(context: MediaCaptureContext): ChatContentPart[] {
  const parts: ChatContentPart[] = []

  const intro = [
    "Infer a complete operational play from the owner's uploaded media.",
    "Reconstruct the process the team should run — do not summarize uploads or repeat the owner's complaint verbatim.",
    "",
  ]

  if (context.textPrompt) {
    intro.push("Owner description:", context.textPrompt, "")
  }

  if (context.transcripts.length > 0) {
    intro.push("Transcripts from uploads:")
    for (const t of context.transcripts) {
      intro.push(`### ${t.label}`, t.text, "")
    }
  }

  if (context.images.length > 0) {
    intro.push(
      "Reference photos are attached. Use them to infer layout, tools, visual standards, good/bad outcomes, and verification points."
    )
  }

  parts.push({ type: "text", text: intro.join("\n") })

  for (const img of context.images) {
    parts.push({
      type: "text",
      text: `[Photo: ${img.label}]`,
    })
    parts.push({
      type: "image_url",
      image_url: { url: img.signedUrl, detail: "low" },
    })
  }

  return parts
}

export async function convertMediaCaptureOpenAi(
  context: MediaCaptureContext
): Promise<QuickCaptureDraft | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  const fallbackText = context.fallbackText.trim()

  const heuristicFallback = inferOperationalPlay({
    rawText: fallbackText,
    fromWorkflow: context.transcripts.some((t) => t.label.includes("Demonstration")),
  })
  const heuristicDraft = normalizeQuickCaptureDraft(heuristicFallback, fallbackText)

  if (!apiKey) return heuristicDraft

  const model =
    process.env.OPENAI_MEDIA_CAPTURE_MODEL?.trim() ||
    process.env.OPENAI_QUICK_CAPTURE_MODEL?.trim() ||
    "gpt-4o-mini"

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
        { role: "user", content: buildUserContent(context) },
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
      fallbackText
    )
    const normalized = normalizeQuickCaptureDraft(merged, fallbackText)

    if (draftNeedsHeuristicFallback(normalized, fallbackText)) {
      return heuristicDraft
    }

    return normalized
  } catch {
    return heuristicDraft
  }
}
