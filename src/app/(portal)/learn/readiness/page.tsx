import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import { CertificationBadgeTile } from "@/components/training/certification-badge-tile"
import { EmployeeReadinessSummary } from "@/components/training/employee-readiness-summary"
import { StaffPortalShell } from "@/components/training/portal/staff-portal-shell"
import { COPY } from "@/lib/interface-copy"
import { loadPortalReadinessForEmployee } from "@/lib/training/portal/load-portal-readiness"
import { getServerAuthUser, requireAuthUser } from "@/lib/auth/server-auth"

export const metadata: Metadata = {
  title: COPY.staffPortal.readinessTitle,
}

export default async function StaffReadinessPage() {
  const user = requireAuthUser(await getServerAuthUser())
  const view = await loadPortalReadinessForEmployee(user.id)
  if (!view) redirect("/setup")

  const inProgressCerts = view.certifications.filter((c) => !c.certified)

  return (
    <StaffPortalShell businessName={view.businessName} title={COPY.staffPortal.readinessTitle}>
      <Link
        href="/learn"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Home
      </Link>

      <p className="text-sm leading-relaxed text-muted-foreground">{COPY.staffPortal.readinessLead}</p>

      <div className="mt-6">
        <EmployeeReadinessSummary readiness={view.readiness} showSignals />
      </div>

      {view.certifiedBadges.length > 0 ? (
        <section className="mt-10 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">{COPY.staffPortal.certsTitle}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {view.certifiedBadges.map((badge) => (
              <CertificationBadgeTile
                key={badge.moduleId}
                badge={badge}
                href={`/learn/certifications/${badge.moduleId}`}
              />
            ))}
          </div>
        </section>
      ) : null}

      {inProgressCerts.length > 0 ? (
        <section className="mt-10 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">{COPY.staffPortal.certsInProgressHeading}</h2>
          <ul className="space-y-2">
            {inProgressCerts.map((cert) => (
              <li key={cert.moduleId}>
                <Link
                  href={`/learn/${cert.moduleId}`}
                  className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/15 px-4 py-3 text-sm transition-colors hover:bg-muted/25"
                >
                  <div>
                    <p className="font-medium text-foreground">{cert.moduleTitle}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {[
                        cert.moduleCompleted ? "Module done" : "Module in progress",
                        cert.quizzesPassed ? "Quizzes passed" : "Quizzes pending",
                        cert.proofUploaded ? "Proof uploaded" : "Proof pending",
                        cert.managerSignedOff ? "Signed off" : "Sign-off pending",
                      ].join(" · ")}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-primary">
                    {COPY.staffPortal.certContinueModule} →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </StaffPortalShell>
  )
}
