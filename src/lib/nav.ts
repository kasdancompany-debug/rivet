import type { LucideIcon } from "lucide-react"
import {
  AlertTriangle,
  BookOpen,
  Brain,
  Clapperboard,
  Flame,
  Gauge,
  GraduationCap,
  HeartPulse,
  MapPinned,
  MessageCircleQuestion,
  Settings,
  Smartphone,
  Zap,
} from "lucide-react"

import { COPY } from "@/lib/interface-copy"

export type NavSection = "core" | "account"

/** Empty string = no section heading in the sidebar. */
export const NAV_SECTION_LABEL: Record<NavSection, string> = {
  core: "",
  account: COPY.nav.accountSection,
}

export type NavItem = {
  title: string
  href: string
  icon: LucideIcon
  section: NavSection
}

/** Rivet v1 — see RIVET_V1_SCOPE.md. Every item here is a supported product surface. */
export const mainNav: NavItem[] = [
  { title: COPY.nav.overview, href: "/dashboard", icon: Gauge, section: "core" },
  { title: COPY.nav.businessBrain, href: "/brain", icon: Brain, section: "core" },
  { title: COPY.nav.realityCheck, href: "/onboarding", icon: HeartPulse, section: "core" },
  { title: COPY.nav.standards, href: "/sops", icon: BookOpen, section: "core" },
  { title: COPY.nav.standardsCapture, href: "/sops/capture", icon: Clapperboard, section: "core" },
  { title: COPY.nav.askRivet, href: "/ask", icon: MessageCircleQuestion, section: "core" },
  { title: COPY.nav.highFriction, href: "/alerts", icon: Flame, section: "core" },
  { title: COPY.nav.training, href: "/training", icon: GraduationCap, section: "core" },
  { title: COPY.trainingPortal.openPortal, href: "/learn", icon: Smartphone, section: "core" },
  { title: COPY.nav.interruptions, href: "/interruptions", icon: Zap, section: "core" },
  { title: COPY.nav.bottlenecks, href: "/issues", icon: AlertTriangle, section: "core" },
  { title: COPY.nav.escapePlan, href: "/escape-plan", icon: MapPinned, section: "core" },
  { title: COPY.nav.settings, href: "/settings", icon: Settings, section: "account" },
]
