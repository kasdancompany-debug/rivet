export function normalizeSummaryKey(summary: string): string {
  return summary.trim().toLowerCase().replace(/\s+/g, " ")
}
