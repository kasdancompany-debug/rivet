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
    intent: `${COPY.billing.limitedFounderRelease} — ${COPY.billing.subscribeTitle}: ${COPY.billing.priceOnce} ${COPY.billing.priceInstallment}. Complete checkout to unlock Founder Lifetime Access.`,
    nextHref: "/dashboard",
    nextLabel: COPY.nav.overview,
  },
  {
    prefix: "/training/modules",
    eyebrow: COPY.nav.training,
    intent: "Shape a Training Center track—role, plays inside the module, and who is assigned.",
    nextHref: "/training",
    nextLabel: `Back to ${COPY.nav.training}`,
  },
  {
    prefix: "/sops/capture",
    eyebrow: COPY.nav.standardsCapture,
    intent: "Capture how work happens and turn it into a play the floor can run without calling you.",
    nextHref: "/sops",
    nextLabel: COPY.nav.standards,
  },
  {
    prefix: "/sops/templates",
    eyebrow: COPY.nav.standards,
    intent: "Install starter plays from the gallery, then tune them to your floor.",
    nextHref: "/sops",
    nextLabel: COPY.nav.standards,
  },
  {
    prefix: "/sops/new",
    eyebrow: COPY.nav.standards,
    intent: "Author a new play from scratch when nothing in the gallery fits.",
    nextHref: "/sops/templates",
    nextLabel: COPY.sops.browseGallery,
  },
  {
    prefix: "/issues/new",
    eyebrow: COPY.nav.bottlenecks,
    intent: "Log what is stuck before it becomes another owner pull.",
    nextHref: "/issues",
    nextLabel: COPY.nav.bottlenecks,
  },
  {
    prefix: "/interruptions/log",
    eyebrow: COPY.nav.interruptions,
    intent: "Record an owner pull with kind and minutes so the week’s leak stays honest.",
    nextHref: "/interruptions",
    nextLabel: COPY.nav.interruptions,
  },
  {
    prefix: "/issues",
    eyebrow: COPY.nav.bottlenecks,
    intent: "See what is still open, what waits on you, and close loops without losing the paper trail.",
    nextHref: "/issues?capture=1",
    nextLabel: COPY.issues.quickCaptureCta,
  },
  {
    prefix: "/sops",
    eyebrow: COPY.nav.standards,
    intent: "Your play library—operating memory the team can run and search.",
    nextHref: "/sops/capture",
    nextLabel: COPY.nav.standardsCapture,
  },
  {
    prefix: "/interruptions",
    eyebrow: COPY.nav.interruptions,
    intent: "Read owner pulls and who burns your clock—then ship plays, training, or Ask Rivet answers.",
    nextHref: "/interruptions/log",
    nextLabel: COPY.interruptions.logTitle,
  },
  {
    prefix: "/training",
    eyebrow: COPY.nav.training,
    intent: "See who is trained on which plays and where Training Center is still thin before you trust the shift.",
    nextHref: "/training/modules/new",
    nextLabel: COPY.training.newModule,
  },
  {
    prefix: "/ask",
    eyebrow: COPY.askRivet.eyebrow,
    intent: "Ask Rivet intelligence tracks questions, repeats, and owner time saved—then answer the floor in plain language.",
    nextHref: "/sops/capture",
    nextLabel: COPY.nav.standardsCapture,
  },
  {
    prefix: "/alerts",
    eyebrow: COPY.highFriction.eyebrow,
    intent: COPY.highFriction.pageDescription,
    nextHref: "/interruptions",
    nextLabel: COPY.nav.interruptions,
  },
  {
    prefix: "/escape-plan",
    eyebrow: COPY.nav.escapePlan,
    intent: "Escape readiness and Owner-free capacity—whether the business holds when you step back.",
    nextHref: "/onboarding",
    nextLabel: COPY.nav.realityCheck,
  },
  {
    prefix: "/onboarding",
    eyebrow: COPY.nav.realityCheck,
    intent: "Capture how fused the operation is to you—then move load into plays, Training Center, and Ask Rivet.",
    nextHref: "/dashboard",
    nextLabel: COPY.nav.overview,
  },
  {
    prefix: "/settings",
    eyebrow: COPY.nav.settings,
    intent: "Wire the workspace, exports, and Founder Lifetime Access—day-to-day work stays in the main nav.",
    nextHref: "/dashboard",
    nextLabel: COPY.nav.overview,
  },
  {
    prefix: "/dashboard",
    eyebrow: COPY.nav.overview,
    intent: "Owner-free capacity, Escape readiness, Questions prevented, owner pulls, plays, and your Rivet Score.",
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
