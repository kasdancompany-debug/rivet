import type { RivetCategoryScore } from "@/lib/rivet-score/types"

/** Static Rivet Index category grid for marketing — illustrative only. */
export const LANDING_DEMO_HEATMAP: RivetCategoryScore[] = [
  {
    id: "operations",
    label: "Operations",
    dependencyScore: 78,
    band: "fragile",
    hint: "Open/close still route to you.",
  },
  {
    id: "product_quality",
    label: "Product Quality",
    dependencyScore: 71,
    band: "fragile",
    hint: "Process variance when you step away.",
  },
  {
    id: "team_readiness",
    label: "Team Readiness",
    dependencyScore: 64,
    band: "improving",
    hint: "Training exists; depth is uneven.",
  },
  {
    id: "customer_experience",
    label: "Client experience",
    dependencyScore: 58,
    band: "improving",
    hint: "Recovery depends on who is working.",
  },
  {
    id: "leadership_redundancy",
    label: "Leadership Redundancy",
    dependencyScore: 82,
    band: "critical",
    hint: "Few real backups for judgment calls.",
  },
  {
    id: "training_systems",
    label: "Training Systems",
    dependencyScore: 55,
    band: "improving",
    hint: "Modules not tied tightly to standards.",
  },
]
