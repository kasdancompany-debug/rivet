import type { Metadata } from "next"

import Link from "next/link"

import { redirect } from "next/navigation"

import { Award, ChevronLeft, ChevronRight } from "lucide-react"



import { StaffPortalShell } from "@/components/training/portal/staff-portal-shell"

import { CertificationBadgeTile } from "@/components/training/certification-badge-tile"

import { COPY } from "@/lib/interface-copy"

import { loadPortalHomeForEmployee } from "@/lib/training/portal/load-portal-home"

import { loadPortalReadinessForEmployee } from "@/lib/training/portal/load-portal-readiness"

import { getServerAuthUser, requireAuthUser } from "@/lib/auth/server-auth"



export const metadata: Metadata = {

  title: COPY.staffPortal.certsTitle,

}



export default async function StaffCertificationsPage() {

  const user = requireAuthUser(await getServerAuthUser())

  const [home, readinessView] = await Promise.all([

    loadPortalHomeForEmployee(user.id),

    loadPortalReadinessForEmployee(user.id),

  ])

  if (!home) redirect("/setup")



  const inProgress = readinessView?.certifications.filter((c) => !c.certified) ?? []



  return (

    <StaffPortalShell businessName={home.businessName} title={COPY.staffPortal.certsTitle}>

      <Link

        href="/learn"

        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"

      >

        <ChevronLeft className="size-4" aria-hidden />

        Home

      </Link>



      <p className="text-sm leading-relaxed text-muted-foreground">{COPY.staffPortal.certsLead}</p>



      <Link

        href="/learn/readiness"

        className="mt-4 flex items-center justify-between rounded-xl border border-border/50 bg-muted/15 px-4 py-3 text-sm transition-colors hover:bg-muted/25"

      >

        <span className="font-medium text-foreground">{COPY.staffPortal.readinessTitle}</span>

        <ChevronRight className="size-4 text-muted-foreground" aria-hidden />

      </Link>



      {home.certifications.length === 0 ? (

        <div className="mt-8 rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-10 text-center">

          <Award className="mx-auto size-10 text-muted-foreground/70" aria-hidden />

          <p className="mt-3 font-medium text-foreground">{COPY.staffPortal.certsEmpty}</p>

          <Link href="/learn/training" className="mt-4 inline-block text-sm font-medium text-primary">

            {COPY.staffPortal.todayTrainingTitle} →

          </Link>

        </div>

      ) : (

        <div className="mt-6 space-y-8">

          <section className="grid gap-3 sm:grid-cols-2">

            {home.certifications.map((badge) => (

              <CertificationBadgeTile

                key={badge.moduleId}

                badge={badge}

                href={`/learn/certifications/${badge.moduleId}`}

              />

            ))}

          </section>



          {inProgress.length > 0 ? (

            <section className="space-y-3">

              <h2 className="text-sm font-semibold text-foreground">

                {COPY.staffPortal.certsInProgressHeading}

              </h2>

              <ul className="space-y-2">

                {inProgress.map((cert) => (
                  <li key={cert.moduleId}>
                    <Link
                      href={`/learn/${cert.moduleId}`}
                      className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/10 px-4 py-3 text-sm transition-colors hover:bg-muted/20"
                    >
                      <div>
                        <p className="font-medium text-foreground">{cert.moduleTitle}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{COPY.staffPortal.certViewProgress}</p>
                      </div>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    </Link>
                  </li>
                ))}

              </ul>

            </section>

          ) : null}



          <p className="text-xs text-muted-foreground">{COPY.certifications.trackerHint}</p>

        </div>

      )}

    </StaffPortalShell>

  )

}


