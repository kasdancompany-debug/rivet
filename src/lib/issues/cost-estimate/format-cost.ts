export function formatCostUsd(amount: number, options?: { compact?: boolean }): string {
  const rounded = Math.round(amount)
  if (options?.compact && rounded >= 1000) {
    return `$${(rounded / 1000).toFixed(rounded >= 10000 ? 0 : 1)}k`
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(rounded)
}
