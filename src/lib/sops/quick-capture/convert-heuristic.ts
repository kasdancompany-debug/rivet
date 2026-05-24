import { SOP_CATEGORIES, formatSopCategory, type SopCategoryValue } from "@/lib/sops/categories"
import { COMPETENCY_QUICK_ADD } from "@/lib/standards-capture/types"

import type { QuickCaptureDraft } from "./types"

const KNOWN_CATEGORIES = new Set<string>(SOP_CATEGORIES.map((c) => c.value))

function clampLevel(n: number): number {
  return Math.min(5, Math.max(1, Math.round(n)))
}

function inferCategory(text: string): SopCategoryValue {
  const lower = text.toLowerCase()
  if (/\bclos(e|ing|e-out|e out)\b/.test(lower)) return "closing"
  if (/\bopen(ing)?\b/.test(lower)) return "opening"
  if (/\bclean(ing)?\b/.test(lower)) return "cleaning"
  if (/\bcash|deposit|drawer|till\b/.test(lower)) return "cash_handling"
  if (/\btrain(ing)?\b/.test(lower)) return "training"
  if (/\bcustomer|guest|service|complaint\b/.test(lower)) return "customer_experience"
  if (/\bquality|product|recipe|dial-in\b/.test(lower)) return "product_quality"
  return "other"
}

function inferTitle(text: string): string {
  const trimmed = text.trim()
  const howMatch = trimmed.match(/^how i (.+?)(?:[.!?]|$)/im)
  if (howMatch?.[1]) {
    const topic = howMatch[1].trim()
    return topic.charAt(0).toUpperCase() + topic.slice(1)
  }

  const firstLine = trimmed.split(/\n+/)[0]?.trim() ?? ""
  if (firstLine.length >= 4 && firstLine.length <= 72) {
    return firstLine.replace(/[.!?]+$/, "")
  }

  const category = inferCategory(text)
  const label = SOP_CATEGORIES.find((c) => c.value === category)?.label ?? "Standard"
  return label
}

function inferPurpose(text: string, title: string): string {
  const trimmed = text.trim()
  const sentences = trimmed
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12)

  const candidate = sentences.find((s) => !/^how i\b/i.test(s) && s.length <= 220)
  if (candidate) return candidate.replace(/[.!?]+$/, ".")

  return `Document how the team runs “${title}” the same way every shift.`
}

function splitSteps(text: string): { title: string; instructions: string }[] {
  const numbered = [...text.matchAll(/(?:^|\n)\s*(\d+)[.)]\s*([^\n]+(?:\n(?!\s*\d+[.)]\s)[^\n]+)*)/g)]
  if (numbered.length >= 2) {
    return numbered.map((match, index) => {
      const body = match[2]!.trim()
      const [head, ...rest] = body.split(/[:\n—-]\s*/, 2)
      const title = (rest.length ? head : `Step ${index + 1}`)?.trim() || `Step ${index + 1}`
      const instructions = (rest.length ? rest.join(" ") : body).trim()
      return { title, instructions }
    })
  }

  const bullets = text
    .split(/\n+/)
    .map((line) => line.replace(/^[-*•]\s*/, "").trim())
    .filter((line) => line.length > 8)

  if (bullets.length >= 2) {
    return bullets.map((line, index) => {
      const [head, ...rest] = line.split(/[:\n—-]\s*/, 2)
      if (rest.length) {
        return { title: head!.trim(), instructions: rest.join(" ").trim() }
      }
      return { title: `Step ${index + 1}`, instructions: line }
    })
  }

  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 16 && !/^how i\b/i.test(s))

  if (sentences.length >= 2) {
    return sentences.slice(0, 8).map((sentence, index) => ({
      title: `Step ${index + 1}`,
      instructions: sentence.replace(/[.!?]+$/, ""),
    }))
  }

  return [
    {
      title: "Run the routine",
      instructions: text.trim().slice(0, 500),
    },
    {
      title: "Sign off",
      instructions: "Confirm the area is ready for the next shift or guest flow.",
    },
  ]
}

function inferDependency(text: string): number {
  const lower = text.toLowerCase()
  let score = 3
  if (/\b(only i|just me|owner only|i always|i personally|when i'm)\b/.test(lower)) score += 2
  if (/\b(without me|anyone can|team runs|shift lead|delegate)\b/.test(lower)) score -= 1
  if (/\b(approve|sign off|escalat)\b/.test(lower)) score += 1
  return clampLevel(score)
}

function inferImportance(category: SopCategoryValue, dependency: number): number {
  if (category === "opening" || category === "closing" || category === "cash_handling") {
    return clampLevel(Math.max(4, dependency))
  }
  if (category === "cleaning") return 3
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
  if (/\bmanager\b/.test(lower)) roles.push("manager")
  if (/\bclean\b/.test(lower)) roles.push("cleaner")
  if (roles.length === 0) {
    if (category === "closing" || category === "opening") roles.push("shift_lead")
    else roles.push("manager")
  }
  return [...new Set(roles)]
}

function inferTrainingCheckpoints(text: string, category: SopCategoryValue): string[] {
  const lower = text.toLowerCase()
  const picks: string[] = []

  if (category === "closing") picks.push("Closing without owner")
  if (category === "opening") picks.push("Opening without owner")
  if (/\bcash|deposit|drawer\b/.test(lower)) picks.push("Cash handling cleared")
  if (/\bfood safety|sanit|health\b/.test(lower)) picks.push("Food safety sign-off")
  if (/\bcomplaint|guest|customer\b/.test(lower)) picks.push("Guest recovery")

  if (picks.length === 0) {
    picks.push(COMPETENCY_QUICK_ADD[0]!)
  }

  return [...new Set(picks)].slice(0, 4)
}

function estimateMinutes(steps: { title: string; instructions: string }[], text: string): number {
  const lower = text.toLowerCase()
  const base = steps.length * 7
  if (/\bquick|5 min|ten minute\b/.test(lower)) return Math.max(10, base)
  if (/\blong|detailed|full\b/.test(lower)) return Math.max(35, base)
  return Math.min(120, Math.max(15, base))
}

/** e.g. "Ashley forgets freezer lock at close" */
function parseIncidentPattern(text: string): QuickCaptureDraft | null {
  const forget = text.match(/^(\w+)\s+forgets?\s+(.+)$/i)
  if (!forget?.[2]) return null

  let taskRaw = forget[2].trim().replace(/[.!?]+$/, "")
  let category = inferCategory(text)

  const atMatch = taskRaw.match(/\s+at\s+(opening|open|closing|close)$/i)
  if (atMatch) {
    const when = atMatch[1]!.toLowerCase()
    taskRaw = taskRaw.replace(/\s+at\s+(opening|open|closing|close)$/i, "").trim()
    category = when.includes("open") ? "opening" : "closing"
  }

  const taskTitle = taskRaw.charAt(0).toUpperCase() + taskRaw.slice(1)
  const title = `${taskTitle} — ${formatSopCategory(category).toLowerCase()}`
  const steps = [
    {
      title: "Before handoff",
      instructions: `Call out ${taskTitle.toLowerCase()} as a non-negotiable step—do not skip when rushing.`,
    },
    {
      title: taskTitle,
      instructions: `Complete ${taskRaw} and confirm with a verbal or checklist tick before leaving the station.`,
    },
    {
      title: "Sign off",
      instructions: "Shift lead spot-checks once per close until the habit sticks without reminders.",
    },
  ]

  const ownerDependencyLevel = 4
  return {
    title,
    category,
    purpose: `Stop repeat misses on ${taskRaw} so ${category === "closing" ? "close" : "the shift"} is safe without owner callbacks.`,
    steps,
    trainingCheckpoints: [
      category === "closing" ? "Closing without owner" : "Opening without owner",
      `${taskTitle} sign-off`,
    ],
    assignedRoles: inferRoles(text, category),
    estimatedTimeMinutes: 12,
    ownerDependencyLevel,
    importanceLevel: inferImportance(category, ownerDependencyLevel),
  }
}

/** Offline conversion when OpenAI is unavailable. */
export function convertQuickCaptureHeuristic(rawText: string): QuickCaptureDraft {
  const text = rawText.trim()
  const incident = parseIncidentPattern(text)
  if (incident) return incident

  const category = inferCategory(text)
  const title = inferTitle(text)
  const steps = splitSteps(text)
  const ownerDependencyLevel = inferDependency(text)
  const importanceLevel = inferImportance(category, ownerDependencyLevel)

  return {
    title,
    category: KNOWN_CATEGORIES.has(category) ? category : "other",
    purpose: inferPurpose(text, title),
    steps,
    trainingCheckpoints: inferTrainingCheckpoints(text, category),
    assignedRoles: inferRoles(text, category),
    estimatedTimeMinutes: estimateMinutes(steps, text),
    ownerDependencyLevel,
    importanceLevel,
  }
}
