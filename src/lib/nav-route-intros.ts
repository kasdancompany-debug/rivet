import { COPY } from "@/lib/interface-copy"

export type RouteIntentDef = {
  /** Longest-prefix match against `pathname`. */
  prefix: string
  eyebrow: string
  /** One sentence: why this screen exists. */
  intent: string
  nextHref: string
  nextLabel: string
}

const ROUTE_INTENTS: RouteIntentDef[] = [
  {
    prefix: "/subscribe",
    eyebrow: "Billing",
    intent: "Activate your Rivet membership so every module in the sidebar stays available after checkout.",
    nextHref: "/dashboard",
    nextLabel: COPY.nav.overview,
  },
  {
    prefix: "/training/modules",
    eyebrow: COPY.nav.training,
    intent: "Shape a teaching track—role, standards inside the module, and who is assigned.",
    nextHref: "/training",
    nextLabel: `Back to ${COPY.nav.training}`,
  },
  {
    prefix: "/sops/capture",
    eyebrow: COPY.nav.standardsCapture,
    intent: "Turn a messy moment into a written play the floor can repeat without calling you.",
    nextHref: "/sops",
    nextLabel: COPY.nav.standards,
  },
  {
    prefix: "/sops/templates",
    eyebrow: COPY.nav.standards,
    intent: "Install starter plays from the library, then tune them to your floor.",
    nextHref: "/sops",
    nextLabel: COPY.nav.standards,
  },
  {
    prefix: "/sops/new",
    eyebrow: COPY.nav.standards,
    intent: "Author a new standard from scratch when nothing in the gallery fits.",
    nextHref: "/sops/templates",
    nextLabel: COPY.sops.browseGallery,
  },
  {
    prefix: "/issues/new",
    eyebrow: COPY.nav.bottlenecks,
    intent: "Log a new bottleneck with severity and owner-required flags so the team can clear it.",
    nextHref: "/issues",
    nextLabel: COPY.nav.bottlenecks,
  },
  {
    prefix: "/interruptions/log",
    eyebrow: COPY.nav.interruptions,
    intent: "Record a real pull on the owner with kind and minutes so the week’s leak stays honest.",
    nextHref: "/interruptions",
    nextLabel: COPY.nav.interruptions,
  },
  {
    prefix: "/issues",
    eyebrow: COPY.nav.bottlenecks,
    intent: "See what is still open, what waits on you, and close loops without losing the paper trail.",
    nextHref: "/issues/new",
    nextLabel: "Log a bottleneck",
  },
  {
    prefix: "/sops",
    eyebrow: COPY.nav.standards,
    intent: "Browse and edit how the business runs—filters, depth warnings, and links into capture.",
    nextHref: "/sops/capture",
    nextLabel: COPY.nav.standardsCapture,
  },
  {
    prefix: "/interruptions",
    eyebrow: COPY.nav.interruptions,
    intent: "Read the pattern of interrupts and who burns your clock—then tighten the system, not the heroics.",
    nextHref: "/interruptions/log",
    nextLabel: COPY.interruptions.logTitle,
  },
  {
    prefix: "/training",
    eyebrow: COPY.nav.training,
    intent: "See who is trained on which plays and where teaching is still thin before you trust the shift.",
    nextHref: "/training/modules/new",
    nextLabel: COPY.training.newModule,
  },
  {
    prefix: "/escape-plan",
    eyebrow: COPY.nav.escapePlan,
    intent: "Sequence what has to leave your plate first and track tasks until the owner-shaped gaps close.",
    nextHref: "/onboarding",
    nextLabel: COPY.nav.realityCheck,
  },
  {
    prefix: "/onboarding",
    eyebrow: COPY.nav.realityCheck,
    intent: "Answer the blunt dependency questions once so Rivet can score where the business still fuses to you.",
    nextHref: "/dashboard",
    nextLabel: COPY.nav.overview,
  },
  {
    prefix: "/settings",
    eyebrow: COPY.nav.settings,
    intent: "Wire the workspace, exports, and membership—day-to-day execution stays in the main nav.",
    nextHref: "/dashboard",
    nextLabel: COPY.nav.overview,
  },
  {
    prefix: "/dashboard",
    eyebrow: COPY.nav.overview,
    intent: "See owner load, Rivet Index, and the next bottleneck to clear—your weekly command view.",
    nextHref: "/sops/capture",
    nextLabel: COPY.nav.standardsCapture,
  },
]

export function getRouteIntent(pathname: string | null): RouteIntentDef | null {
  if (!pathname) return null
  const sorted = [...ROUTE_INTENTS].sort((a, b) => b.prefix.length - a.prefix.length)
  for (const def of sorted) {
    if (pathname === def.prefix || pathname.startsWith(`${def.prefix}/`)) {
      return def
    }
  }
  return null
}
