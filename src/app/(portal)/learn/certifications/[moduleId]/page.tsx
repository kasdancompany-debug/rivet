import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import { StaffPortalShell } from "@/components/training/portal/staff-portal-shell"
import { TrainingCertificate } from "@/components/training/training-certificate"
import { CertificatePrintActions } from "@/components/training/certificate-print-actions"
import { COPY } from "@/lib/interface-copy"
import { loadPortalHomeForEmployee } from "@/lib/training/portal/load-portal-home"
import { loadTrainingCertificate } from "@/lib/training/certifications/load-certificate"
import { getServerAuthUser, requireAuthUser } from "@/lib/auth/server-auth"

type Props = { params: Promise<{ moduleId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { moduleId } = await params
  const user = await getServerAuthUser()
  if (!user) return { title: COPY.staffPortal.certsTitle }
  const cert = await loadTrainingCertificate(
    { employeeId: user.id, moduleId },
    { viewerId: user.id }
  )
  return {
    title: cert ? cert.certificationName : COPY.staffPortal.certsTitle,
  }
}

export default async function StaffCertificatePage({ params }: Props) {
  const { moduleId } = await params
  const user = requireAuthUser(await getServerAuthUser())
  const [home, certificate] = await Promise.all([
    loadPortalHomeForEmployee(user.id),
    loadTrainingCertificate({ employeeId: user.id, moduleId }, { viewerId: user.id }),
  ])
  if (!home) redirect("/setup")
  if (!certificate) notFound()

  const fileName = `${certificate.employeeName} — ${certificate.certificationName}.pdf`

  return (
    <StaffPortalShell
      businessName={home.businessName}
      title={certificate.certificationName}
      hideNav
    >
      <Link
        href="/learn/certifications"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground print:hidden"
      >
        <ChevronLeft className="size-4" aria-hidden />
        {COPY.certifications.staffCertificateBack}
      </Link>

      {certificate.canPrint ? (
        <CertificatePrintActions fileName={fileName} />
      ) : null}

      <TrainingCertificate certificate={certificate} className="mt-6" />
    </StaffPortalShell>
  )
}
