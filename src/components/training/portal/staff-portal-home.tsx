import Link from "next/link"
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  MessageCircleQuestion,
  Sparkles,
} from "lucide-react"

import { AskRivetPanel } from "@/components/ask-rivet/ask-rivet-panel"
import { EmployeeCertificationBadges } from "@/components/training/employee-certification-badges"
import { ReadinessCapabilityCard } from "@/components/training/readiness-capability-card"
import { ReadinessPctRing } from "@/components/training/readiness-pct-ring"
import type { ComputedEmployeeReadiness } from "@/lib/training/build-views"
import { StaffPortalProgressHero } from "@/components/training/portal/staff-portal-progress-hero"
import { StaffPortalSection } from "@/components/training/portal/staff-portal-section"
import { COPY } from "@/lib/interface-copy"
import type { PortalHomeView, PortalTodayModule } from "@/lib/training/portal/load-portal-home"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

function formatCompletedWhen(iso: string): string {
  try {
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000))
    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
  } catch {
    return ""
  }
}

function TrainingModuleRow({ mod }: { mod: PortalTodayModule }) {
  const isDone = mod.status === "completed"
  return (
    <Link
      href={`/learn/${mod.moduleId}`}
      className={cn(
        "flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition-colors active:scale-[0.99]",
        isDone
          ? "border-border/40 bg-muted/20"
          : "border-primary/20 bg-primary/[0.04] shadow-sm"
      )}
    >
      <div
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-xl",
          isDone ? "bg-muted" : "bg-primary/15"
        )}
      >
        {isDone ? (
          <CheckCircle2 className="size-5 text-emerald-600" aria-hidden />
        ) : (
          <GraduationCap className="size-5 text-primary" aria-hidden />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold leading-snug text-foreground">{mod.title}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {mod.completedItems}/{mod.itemCount} plays · {mod.progressPct}%
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full", isDone ? "bg-emerald-500" : "bg-primary")}
            style={{ width: `${mod.progressPct}%` }}
          />
        </div>
      </div>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  )
}

function PlayRow({
  play,
}: {
  play: PortalHomeView["assignedPlays"][number]
}) {
  return (
    <Link
      href={`/learn/plays/${play.standardId}`}
      className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card px-4 py-3.5 shadow-sm active:scale-[0.99]"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/50">
        <BookOpen className="size-5 text-foreground/70" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground">{play.title}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{play.moduleTitle}</p>
      </div>
      {play.completed ? (
        <Badge variant="outline" className="shrink-0 border-emerald-500/30 text-[0.65rem] text-emerald-700">
          {COPY.staffPortal.playDone}
        </Badge>
      ) : (
        <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      )}
    </Link>
  )
}

export function StaffPortalHome({
  view,
  readiness,
}: {
  view: PortalHomeView
  readiness?: ComputedEmployeeReadiness | null
}) {
  const activeModules = view.todayModules.filter((m) => m.status !== "completed")
  const trainingPreview = activeModules.length > 0 ? activeModules : view.todayModules
  const incompletePlays = view.assignedPlays.filter((p) => !p.completed)
  const playsPreview = (incompletePlays.length > 0 ? incompletePlays : view.assignedPlays).slice(0, 4)

  return (
    <div className="space-y-8 pb-4">
      <header>
        <p className="text-sm text-muted-foreground">{COPY.staffPortal.greeting(view.userName)}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-[1.65rem]">
          {COPY.staffPortal.homeTitle}
        </h1>
      </header>

      <StaffPortalProgressHero progress={view.progress} />

      {readiness ? (
        <StaffPortalSection
          title={COPY.staffPortal.readinessHomeTitle}
          href="/learn/readiness"
          actionLabel={COPY.staffPortal.readinessHomeCta}
        >
          <div className="flex items-center gap-4 rounded-2xl border border-border/50 bg-card/80 px-4 py-4 shadow-sm">
            <ReadinessPctRing score={readiness.overallScore} size="md" />
            <p className="text-xs leading-relaxed text-muted-foreground">{COPY.staffPortal.readinessLead}</p>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {readiness.capabilities.map((cap) => (
              <ReadinessCapabilityCard key={cap.field} capability={cap} compact />
            ))}
          </div>
        </StaffPortalSection>
      ) : null}

      <StaffPortalSection
        title={COPY.staffPortal.todayTrainingTitle}
        href="/learn/training"
        actionLabel={COPY.staffPortal.seeAll}
      >
        {trainingPreview.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/60 bg-muted/15 px-4 py-8 text-center text-sm text-muted-foreground">
            {COPY.staffPortal.todayTrainingEmpty}
          </p>
        ) : (
          <ul className="space-y-2">
            {trainingPreview.slice(0, 3).map((mod) => (
              <li key={mod.moduleId}>
                <TrainingModuleRow mod={mod} />
              </li>
            ))}
          </ul>
        )}
        {activeModules.length > 0 ? (
          <p className="text-xs text-muted-foreground">{COPY.staffPortal.proofHint}</p>
        ) : null}
      </StaffPortalSection>

      <StaffPortalSection title={COPY.staffPortal.askRivetTitle}>
        <div className="overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-b from-card to-muted/20">
          <div className="flex items-center gap-2 border-b border-border/40 px-4 py-3">
            <Sparkles className="size-4 text-primary" aria-hidden />
            <p className="text-xs text-muted-foreground">{COPY.staffPortal.askRivetLead}</p>
          </div>
          <div className="p-3">
            <AskRivetPanel portal compact className="space-y-3" />
          </div>
          <Link
            href="/learn/ask"
            className="flex items-center justify-center gap-1 border-t border-border/40 py-3 text-xs font-medium text-primary"
          >
            {COPY.staffPortal.askFullPage}
            <ChevronRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      </StaffPortalSection>

      <StaffPortalSection
        title={COPY.staffPortal.playsTitle}
        href="/learn/plays"
        actionLabel={COPY.staffPortal.seeAll}
      >
        {playsPreview.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
            {COPY.staffPortal.playsEmpty}
          </p>
        ) : (
          <ul className="space-y-2">
            {playsPreview.map((play) => (
              <li key={play.standardId}>
                <PlayRow play={play} />
              </li>
            ))}
          </ul>
        )}
      </StaffPortalSection>

      <StaffPortalSection
        title={COPY.staffPortal.certsTitle}
        href="/learn/certifications"
        actionLabel={COPY.staffPortal.seeAll}
      >
        {view.certifications.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
            {COPY.staffPortal.certsEmpty}
          </p>
        ) : (
          <div className="space-y-3">
            <EmployeeCertificationBadges
              badges={view.certifications}
              hrefForModule={(moduleId) => `/learn/certifications/${moduleId}`}
            />
            {view.pendingCertifications > 0 ? (
              <p className="text-xs text-muted-foreground">
                {COPY.staffPortal.certsInProgress(view.pendingCertifications)}
              </p>
            ) : null}
          </div>
        )}
      </StaffPortalSection>

      <StaffPortalSection title={COPY.staffPortal.recentlyCompletedTitle}>
        {view.recentlyCompleted.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
            {COPY.staffPortal.recentlyCompletedEmpty}
          </p>
        ) : (
          <ul className="space-y-2">
            {view.recentlyCompleted.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 rounded-2xl border border-border/40 bg-muted/15 px-4 py-3"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15">
                    {item.kind === "module" ? (
                      <GraduationCap className="size-4 text-emerald-700 dark:text-emerald-300" aria-hidden />
                    ) : (
                      <BookOpen className="size-4 text-emerald-700 dark:text-emerald-300" aria-hidden />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    {item.subtitle ? (
                      <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-[10px] font-medium text-muted-foreground">
                    {formatCompletedWhen(item.completedAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </StaffPortalSection>

      <p className="flex items-center justify-center gap-1.5 pb-2 text-center text-[10px] text-muted-foreground/80">
        <MessageCircleQuestion className="size-3" aria-hidden />
        {COPY.staffPortal.staffOnlyFooter}
      </p>
    </div>
  )
}
