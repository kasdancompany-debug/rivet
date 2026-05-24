/** Map reported time lost to issue severity for quick capture. */
export function severityFromTimeLostMinutes(minutes: number): "low" | "medium" | "high" | "critical" {
  if (minutes <= 10) return "low"
  if (minutes <= 30) return "medium"
  if (minutes <= 60) return "high"
  return "critical"
}

export function ownerRequiredFromTimeLost(minutes: number): boolean {
  return minutes >= 45
}

export const QUICK_CAPTURE_TIME_OPTIONS = [
  { minutes: 5, label: "5 min" },
  { minutes: 15, label: "15 min" },
  { minutes: 30, label: "30 min" },
  { minutes: 60, label: "1 hr" },
  { minutes: 120, label: "2+ hr" },
] as const

export function titleFromQuickCapture(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return ""
  const firstLine = trimmed.split(/\r?\n/)[0]?.trim() ?? trimmed
  if (firstLine.length <= 120) return firstLine
  return `${firstLine.slice(0, 117).trim()}…`
}

export function buildQuickCaptureDescription(input: {
  whatHappened: string
  timeLostMinutes: number
  peopleLabels: string[]
  voiceNoteTranscript?: string | null
}): string {
  const lines: string[] = ["Quick capture"]
  lines.push(`Time lost: ~${input.timeLostMinutes} min`)
  if (input.peopleLabels.length > 0) {
    lines.push(`People involved: ${input.peopleLabels.join(", ")}`)
  }
  if (input.voiceNoteTranscript?.trim()) {
    lines.push(`Voice note: ${input.voiceNoteTranscript.trim()}`)
  }
  lines.push("")
  lines.push(input.whatHappened.trim())
  return lines.join("\n")
}
