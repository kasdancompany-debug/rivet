import { SOP_CATEGORIES } from "@/lib/sops/categories"
import { isSopCategory } from "@/lib/sops/categories"

import type { QuickCaptureDraft } from "./types"

const CATEGORY_VALUES = SOP_CATEGORIES.map((c) => c.value)

function clampLevel(n: unknown, fallback: number): number {
  const num = Math.round(Number(n))
  if (Number.isNaN(num)) return fallback
  return Math.min(5, Math.max(1, num))
}

function parseDraft(raw: unknown): QuickCaptureDraft | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null
  const o = raw as Record<string, unknown>

  const title = typeof o.title === "string" ? o.title.trim() : ""
  if (title.length < 2) return null

  const categoryRaw = typeof o.category === "string" ? o.category.trim() : "other"
  const category = isSopCategory(categoryRaw) ? categoryRaw : "other"

  const purpose = typeof o.purpose === "string" ? o.purpose.trim() : ""

  const stepsRaw = Array.isArray(o.steps) ? o.steps : []
  const steps = stepsRaw
    .map((row) => {
      if (!row || typeof row !== "object" || Array.isArray(row)) return null
      const r = row as Record<string, unknown>
      const stepTitle = typeof r.title === "string" ? r.title.trim() : ""
      const instructions = typeof r.instructions === "string" ? r.instructions.trim() : ""
      if (!stepTitle && !instructions) return null
      return {
        title: stepTitle || "Step",
        instructions: instructions || stepTitle,
      }
    })
    .filter((row): row is { title: string; instructions: string } => row != null)

  if (steps.length === 0) return null

  const trainingCheckpoints = Array.isArray(o.trainingCheckpoints)
    ? o.trainingCheckpoints
        .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
        .map((v) => v.trim())
        .slice(0, 6)
    : []

  const assignedRoles = Array.isArray(o.assignedRoles)
    ? o.assignedRoles
        .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
        .map((v) => v.trim())
        .slice(0, 6)
    : []

  const estimatedTimeMinutes = Math.min(
    240,
    Math.max(5, Math.round(Number(o.estimatedTimeMinutes)) || 20)
  )

  return {
    title,
    category,
    purpose: purpose || `Standard for ${title}.`,
    steps: steps.slice(0, 12),
    trainingCheckpoints,
    assignedRoles,
    estimatedTimeMinutes,
    ownerDependencyLevel: clampLevel(o.ownerDependencyLevel, 3),
    importanceLevel: clampLevel(o.importanceLevel, 3),
  }
}

export async function convertQuickCaptureOpenAi(rawText: string): Promise<QuickCaptureDraft | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) return null

  const model = process.env.OPENAI_QUICK_CAPTURE_MODEL?.trim() || "gpt-4o-mini"

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "You turn recurring floor problems into operational SOP plays for small businesses (cafes, shops, service).",
            "Inputs may be complaints like 'Ashley forgets freezer lock at close' or full procedures.",
            "Return JSON only with keys:",
            "title, category, purpose, steps[{title,instructions}], trainingCheckpoints[string[]], assignedRoles[string[]], estimatedTimeMinutes(number), ownerDependencyLevel(1-5), importanceLevel(1-5).",
            `category must be one of: ${CATEGORY_VALUES.join(", ")}.`,
            "purpose: one sentence on why this play exists and what good looks like.",
            "ownerDependencyLevel: 1=team runs it alone, 5=owner must be involved for exceptions.",
            "trainingCheckpoints: measurable training sign-offs (e.g. Closing without owner, Freezer lock sign-off).",
            "assignedRoles: use barista, shift_lead, front_counter, manager, cleaner, donut_production when relevant.",
            "Write 3-8 concrete steps that prevent the described failure.",
          ].join(" "),
        },
        {
          role: "user",
          content: rawText.trim(),
        },
      ],
    }),
  })

  if (!response.ok) return null

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string | null } }[]
  }

  const content = payload.choices?.[0]?.message?.content
  if (!content) return null

  try {
    const parsed = JSON.parse(content) as unknown
    return parseDraft(parsed)
  } catch {
    return null
  }
}
