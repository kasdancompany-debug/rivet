import {
  Building2,
  Briefcase,
  Car,
  Coffee,
  HardHat,
  Scissors,
  Sparkles,
  Store,
  UtensilsCrossed,
} from "lucide-react"

import type { IndustryTemplateCard, RivetIndustryTemplateId } from "@/lib/industry-templates/types"

export const RIVET_INDUSTRY_CARDS: IndustryTemplateCard[] = [
  {
    id: "cafe",
    name: "Cafe / Coffee Shop",
    subtitle: "Open, bar, case, and peak—without you on the line.",
    icon: Coffee,
    sopPackId: "cafes",
  },
  {
    id: "restaurant",
    name: "Restaurant",
    subtitle: "FOH, BOH, and covers on one operating spine.",
    icon: UtensilsCrossed,
    sopPackId: "restaurant",
  },
  {
    id: "cleaning",
    name: "Cleaning Business",
    subtitle: "Routes, keys, and quality sign-off without owner dispatch.",
    icon: Sparkles,
    sopPackId: "cleaning",
  },
  {
    id: "contractor",
    name: "Contractor",
    subtitle: "Site start, safety, and change orders with receipts.",
    icon: HardHat,
    sopPackId: "contractors",
  },
  {
    id: "auto_dealership",
    name: "Auto Dealership",
    subtitle: "Lot, desk, BDC, and service lane handoffs.",
    icon: Car,
    sopPackId: "auto_dealership",
  },
  {
    id: "salon",
    name: "Salon / Barber",
    subtitle: "Books, bowls, and chair standards the team can hold.",
    icon: Scissors,
    sopPackId: "salons",
  },
  {
    id: "retail",
    name: "Retail Store",
    subtitle: "Floor, recovery zones, and shrink discipline.",
    icon: Store,
    sopPackId: "retail",
  },
  {
    id: "office",
    name: "Small Office Team",
    subtitle: "Clients, deliverables, and handoffs without you in every thread.",
    icon: Building2,
    sopPackId: "office",
  },
  {
    id: "other",
    name: "Other / General service",
    subtitle: "Dispatch, handoffs, and proof when you don't fit a vertical box.",
    icon: Briefcase,
    sopPackId: "service",
  },
]

export function getIndustryCard(id: RivetIndustryTemplateId): IndustryTemplateCard | undefined {
  return RIVET_INDUSTRY_CARDS.find((c) => c.id === id)
}

export function rivetIndustryToSopPackId(id: RivetIndustryTemplateId): IndustryTemplateCard["sopPackId"] {
  const card = getIndustryCard(id)
  if (!card) throw new Error(`Unknown industry template: ${id}`)
  return card.sopPackId
}
