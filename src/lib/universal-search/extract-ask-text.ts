import type { AskRivetResponse } from "@/lib/ask-rivet/types"

export function extractAskRivetSearchText(response: unknown): string {
  if (!response || typeof response !== "object") return ""
  const r = response as Partial<AskRivetResponse>
  const parts = [
    r.title,
    r.quickAnswer,
    r.ownerNote,
    r.playTitle,
    ...(r.commonMistakes ?? []),
    ...(r.sourceLinks ?? []).map((l) => `${l.label} ${l.excerpt}`),
  ]
  return parts.filter(Boolean).join(" ")
}
