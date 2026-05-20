export function importanceLabel(n: number): string {
  if (n <= 1) return "Low"
  if (n === 2) return "Below average"
  if (n === 3) return "Medium"
  if (n === 4) return "High"
  return "Critical"
}

export function dependencyLabel(n: number): string {
  if (n <= 1) return "Low — team can run it"
  if (n === 2) return "Light — rare check-ins"
  if (n === 3) return "Medium — you still weigh in"
  if (n === 4) return "High — often waits on you"
  return "Critical — you are the default"
}

export function statusLabel(status: string): string {
  switch (status) {
    case "draft":
      return "Draft"
    case "active":
      return "Active"
    case "archived":
      return "Archived"
    default:
      return status
  }
}
