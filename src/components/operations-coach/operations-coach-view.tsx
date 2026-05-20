import Link from "next/link"
import { ArrowUpRight, Compass } from "lucide-react"

import type { OperationsCoachPageModel } from "@/lib/operations-coach/get-coach-data"
import { OperationsCoachPromptPanel } from "@/components/operations-coach/operations-coach-prompt-panel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { COPY } from "@/lib/interface-copy"
import { cn } from "@/lib/utils"

function pct(n: number | null) {
  if (n === null) return "—"
  return `${Math.round(n * 100)}%`
}

export function OperationsCoachView({ model }: { model: OperationsCoachPageModel }) {
  const { snapshot, brief, promptPack, source } = model

  if (source === "unlinked" || source === "error") {
    return (
      <div className="mx-auto max-w-xl space-y-6 pb-12">
        <div className="flex size-11 items-center justify-center rounded-2xl border border-border/60 bg-card shadow-sm">
          <Compass className="size-5 text-muted-foreground" strokeWidth={1.5} aria-hidden />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {source === "error" ? COPY.coach.errorTitle : COPY.coach.unlinkedTitle}
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {source === "error" ? COPY.coach.errorLead : COPY.coach.unlinkedLead}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {source === "unlinked" ? (
            <Button nativeButton={false} render={<Link href="/settings" />}>
              {COPY.coach.unlinkedCta}
            </Button>
          ) : (
            <Button variant="outline" nativeButton={false} render={<Link href="/coach" />}>
              {COPY.coach.retryCta}
            </Button>
          )}
          <Button variant="outline" nativeButton={false} render={<Link href="/proof-of-transfer" />}>
            {COPY.nav.proofOfTransfer}
          </Button>
          <Button variant="ghost" className="text-muted-foreground" nativeButton={false} render={<Link href="/dashboard" />}>
            {COPY.nav.overview}
          </Button>
        </div>
      </div>
    )
  }

  const d = snapshot.dailyChecklists

  return (
    <div className="space-y-12 pb-10 sm:space-y-14 sm:pb-12">
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl border border-border/60 bg-card shadow-sm">
            <Compass className="size-5 text-muted-foreground" strokeWidth={1.5} aria-hidden />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem] sm:leading-snug">
            Outside read
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-[1.6] text-muted-foreground sm:text-[0.9375rem]">
            One brief from how the business is actually running: owner load, standard depth, training,
            bottlenecks, and daily execution proof. The prompt pack is there when you want a second
            brain on the same facts.
          </p>
        </div>
      </header>

      <section
        className="rounded-xl border border-border/60 bg-card px-6 py-8 shadow-[0_1px_0_rgba(15,23,42,0.05),0_12px_32px_-8px_rgba(15,23,42,0.06)] sm:px-9 sm:py-9"
        aria-label="Coach read"
      >
        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Briefing
        </p>
        <p className="mt-4 max-w-3xl text-lg font-medium leading-[1.55] text-foreground sm:text-xl">
          {brief.openingLine}
        </p>
      </section>

      <section aria-label="Business signals" className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          What went into this brief
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SignalCard
            label="Owner load map"
            value={
              snapshot.assessment.present
                ? snapshot.assessment.founderDependencyPercent != null
                  ? `${snapshot.assessment.founderDependencyPercent}% still on you`
                  : "On file"
                : "Not run yet"
            }
            foot={
              snapshot.assessment.topSectionTitle
                ? `Highest stress: ${snapshot.assessment.topSectionTitle}`
                : snapshot.assessment.present
                  ? "Re-run as you delegate—load should move, not hide."
                  : "The load map adds structure to this brief."
            }
          />
          <SignalCard
            label="Standards"
            value={`${snapshot.sops.activeCount} active · ${snapshot.sops.draftCount} draft`}
            foot={
              snapshot.sops.activeUnderTwoStepsCount > 0
                ? `${snapshot.sops.activeUnderTwoStepsCount} active with fewer than two documented steps`
                : "Written plays the team can execute."
            }
          />
          <SignalCard
            label="Training"
            value={
              snapshot.training.assignmentsTotal > 0
                ? `${pct(snapshot.training.assignmentsCompleted / snapshot.training.assignmentsTotal)} complete`
                : "No assignments"
            }
            foot={
              snapshot.training.modulesWithOpenAssignments.length > 0
                ? `Open modules include: ${snapshot.training.modulesWithOpenAssignments.join(", ")}`
                : `${snapshot.training.moduleCount} module(s) configured.`
            }
          />
          <SignalCard
            label="Bottlenecks"
            value={`${snapshot.issues.unresolvedCount} unresolved`}
            foot={`${snapshot.issues.ownerRequiredUnresolvedCount} still need you`}
          />
          <SignalCard
            label="Daily execution (14d)"
            value={d.totalRunsInWindow === 0 ? "No runs" : pct(d.runCompletionRate)}
            foot={
              d.weakestShiftTypeLabel
                ? `Softest discipline: ${d.weakestShiftTypeLabel}`
                : "Checklist completion across recent shifts."
            }
          />
          <SignalCard
            label="Compiled at"
            value={new Date(snapshot.generatedAt).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
            foot="UTC timestamps in underlying data where noted."
          />
        </div>
      </section>

      <section className="space-y-6" aria-label="Recommendations">
        <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          Prioritized moves
        </h2>
        <ol className="space-y-5">
          {brief.recommendations.map((rec, i) => (
            <li key={rec.id}>
              <Card className="border-border/60 bg-card/70 shadow-sm">
                <CardHeader className="space-y-2 pb-2">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <CardTitle className="text-base font-semibold leading-snug text-foreground sm:text-lg">
                      {rec.headline}
                    </CardTitle>
                  </div>
                  <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                    {rec.detail}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    <span className="font-medium text-foreground/80">Why this surfaced:</span>{" "}
                    {rec.signal}
                  </p>
                  {rec.href ? (
                    <Link
                      href={rec.href}
                      className={cn(
                        "inline-flex items-center gap-1 text-sm font-medium text-foreground underline-offset-4 hover:underline"
                      )}
                    >
                      Go to the work
                      <ArrowUpRight className="size-3.5 opacity-70" aria-hidden />
                    </Link>
                  ) : null}
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <Separator className="opacity-60" />

      <OperationsCoachPromptPanel pack={promptPack} />
    </div>
  )
}

function SignalCard({ label, value, foot }: { label: string; value: string; foot: string }) {
  return (
    <Card className="border-border/50 bg-card/50 shadow-none">
      <CardHeader className="space-y-1 pb-2 pt-4">
        <CardTitle className="text-[0.65rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </CardTitle>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </CardHeader>
      <CardContent className="pt-0 pb-4">
        <p className="text-xs leading-relaxed text-muted-foreground">{foot}</p>
      </CardContent>
    </Card>
  )
}
