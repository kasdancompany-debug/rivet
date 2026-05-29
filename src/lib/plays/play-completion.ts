const STORAGE_PREFIX = "rivet:play-completion:"

export function loadPlayStepCompletion(standardId: string): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${standardId}`)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((id): id is string => typeof id === "string"))
  } catch {
    return new Set()
  }
}

export function savePlayStepCompletion(standardId: string, completedStepIds: string[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${standardId}`, JSON.stringify(completedStepIds))
  } catch {
    // ignore quota errors
  }
}

export function playCompletionLabel(completed: number, total: number): string {
  if (total === 0) return "No steps"
  if (completed === 0) return "Not started"
  if (completed >= total) return "Complete"
  return `${completed} of ${total} done`
}
