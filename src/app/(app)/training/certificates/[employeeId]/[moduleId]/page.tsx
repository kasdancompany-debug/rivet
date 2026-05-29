import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import { TrainingCertificate } from "@/components/training/training-certificate"
import { CertificatePrintActions } from "@/components/training/certificate-print-actions"
import { COPY } from "@/lib/interface-copy"
import { fetchBusinessForCurrentUser, fetchCurrentProfile } from "@/lib/db/queries"
import { loadTrainingCertificate } from "@/lib/training/certifications/load-certificate"
import { getServerAuthUser, requireAuthUser } from "@/lib/auth/server-auth"
import { createClient } from "@/lib/supabase/server"
import { isWorkspaceOwner } from "@/lib/ops/workspace-role"
import { Button } from "@/components/ui/button"

type Props = { params: Promise<{ employeeId: string; moduleId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { employeeId, moduleId } = await params
  const user = await getServerAuthUser()
  if (!user) return { title: COPY.certifications.ownerCertificateTitle }
  const cert = await loadTrainingCertificate(
    { employeeId, moduleId },
    { viewerId: user.id }
  )
  return {
    title: cert
      ? `${cert.employeeName} · ${cert.certificationName}`
      : COPY.certifications.ownerCertificateTitle,
  }
}

export default async function OwnerCertificatePage({ params }: Props) {
  const { employeeId, moduleId } = await params
  const user = requireAuthUser(await getServerAuthUser())
  const supabase = await createClient()
  const [business, profile, certificate] = await Promise.all([
    fetchBusinessForCurrentUser(supabase),
    fetchCurrentProfile(supabase),
    loadTrainingCertificate({ employeeId, moduleId }, { viewerId: user.id }),
  ])

  if (!business) redirect("/setup")
  if (!isWorkspaceOwner(user.id, business, profile)) redirect("/training")
  if (!certificate) notFound()

  const fileName = `${certificate.employeeName} — ${certificate.certificationName}.pdf`

  return (
    <div className="certificate-page mx-auto max-w-3xl px-4 py-8">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 mb-4 print:hidden"
        nativeButton={false}
        render={<Link href="/training" />}
      >
        <ChevronLeft className="size-4" aria-hidden />
        {COPY.certifications.ownerCertificateBack}
      </Button>

      <CertificatePrintActions fileName={fileName} />

      <TrainingCertificate certificate={certificate} className="mt-6" printMode />
    </div>
  )
}
