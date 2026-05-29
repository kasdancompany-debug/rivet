import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import QRCode from "qrcode"
import { Suspense } from "react"

import { fetchBusinessById, fetchSopWithSteps } from "@/lib/db/queries"
import { formatSopCategory } from "@/lib/sops/categories"
import { assignedRolesDisplay } from "@/lib/sops/build-standard-markdown"
import { parseStandardsCapture } from "@/lib/standards-capture/parse"
import { signStandardMediaRows } from "@/lib/standards/standard-media-server"
import { canonicalStandardUrl } from "@/lib/site-public-url"
import { createClient } from "@/lib/supabase/server"
import { SopPrintToolbar } from "./print-toolbar"

import "./sop-print.css"

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const sop = await fetchSopWithSteps(id, supabase)
  return {
    title: sop ? `Print · ${sop.title}` : "Print standard",
    robots: { index: false, follow: false },
  }
}

export default async function SopPrintPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const sop = await fetchSopWithSteps(id, supabase)
  if (!sop) notFound()
  if (sop.status !== "active") {
    redirect(`/sops/${id}`)
  }

  const [business, standardUrl, signedMedia] = await Promise.all([
    fetchBusinessById(sop.business_id, supabase),
    canonicalStandardUrl(id),
    signStandardMediaRows(sop.standard_media ?? []),
  ])

  const businessName = business?.name?.trim() || "Workspace"
  const capture = parseStandardsCapture(sop.standards_capture)
  const roleLabels = assignedRolesDisplay(capture?.assignedRoles)
  const updated = new Date(sop.updated_at).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })

  let qrDataUrl: string | null = null
  try {
    qrDataUrl = await QRCode.toDataURL(standardUrl, {
      width: 168,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#111111", light: "#ffffffff" },
    })
  } catch {
    qrDataUrl = null
  }

  const steps = [...sop.standard_steps].sort((a, b) => a.step_order - b.step_order)
  const printableImages = signedMedia.filter((m) => m.kind === "image" && m.signedUrl)
  const videoAttachments = signedMedia.filter((m) => m.kind === "video")

  return (
    <article className="sop-print-doc">
      <Suspense fallback={null}>
        <SopPrintToolbar standardId={id} />
      </Suspense>

      <header className="space-y-2">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] sop-print-muted">
          {businessName}
        </p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{sop.title}</h1>
        <p className="text-sm sop-print-muted">
          <span className="font-medium text-foreground">{formatSopCategory(sop.category)}</span>
          <span aria-hidden> · </span>
          Last updated {updated}
        </p>
      </header>

      {roleLabels.length > 0 ? (
        <>
          <div className="sop-print-rule" />
          <section aria-labelledby="roles-print">
            <h2 id="roles-print" className="text-base font-semibold">
              Role owner
            </h2>
            <ul className="mt-2 list-inside list-disc text-sm">
              {roleLabels.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </section>
        </>
      ) : null}

      {sop.description?.trim() ? (
        <>
          <div className="sop-print-rule" />
          <section aria-labelledby="purpose-print">
            <h2 id="purpose-print" className="text-base font-semibold">
              Purpose
            </h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{sop.description.trim()}</p>
          </section>
        </>
      ) : null}

      <div className="sop-print-rule" />

      <section aria-labelledby="steps-print">
        <h2 id="steps-print" className="text-base font-semibold">
          Steps
        </h2>
        {steps.length === 0 ? (
          <p className="mt-2 text-sm sop-print-muted">No steps on file.</p>
        ) : (
          <ol className="sop-print-steps mt-3">
            {steps.map((step, i) => (
              <li key={step.id} className={step.is_critical ? "sop-print-step sop-print-step-critical" : "sop-print-step"}>
                <p className="text-[0.65rem] font-semibold uppercase tracking-wide sop-print-muted">
                  <span className="sop-print-step-num">{String(i + 1).padStart(2, "0")}</span>
                  {step.is_critical ? (
                    <span className="ml-2 normal-case">· Critical</span>
                  ) : null}
                  {[
                    step.requires_checklist_completion !== false ? "Checklist" : null,
                    step.requires_photo_confirmation ? "Photo" : null,
                    step.requires_video_proof ? "Video" : null,
                    step.requires_manager_signoff ? "Manager sign-off" : null,
                  ]
                    .filter(Boolean)
                    .map((label) => (
                      <span key={label} className="ml-2 normal-case">
                        · {label} proof
                      </span>
                    ))}
                  {step.estimated_time_minutes != null ? (
                    <span className="ml-2 normal-case">· ~{step.estimated_time_minutes} min</span>
                  ) : null}
                </p>
                <h3 className="text-base font-semibold leading-snug">{step.title}</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                  {step.instructions?.trim() || "—"}
                </p>
                {step.verification?.trim() ? (
                  <p className="mt-2 text-sm">
                    <span className="font-medium">Verification:</span> {step.verification.trim()}
                  </p>
                ) : null}
                {step.notes?.trim() ? (
                  <p className="mt-2 text-sm sop-print-muted">
                    <span className="font-medium text-foreground">Notes:</span> {step.notes.trim()}
                  </p>
                ) : null}
                {step.media_url?.trim() ? (
                  <div className="mt-3 rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-xs">
                    {step.media_url.trim().startsWith("/api/standard-media/") ? (
                      <p>
                        <span className="font-medium text-foreground">Walkthrough video</span> — open the
                        live standard to play this clip, or scan the QR code at the bottom of this page.
                      </p>
                    ) : (
                      <p className="break-all">
                        <span className="font-medium text-foreground">Reference: </span>
                        <Link href={step.media_url.trim()} className="underline">
                          {step.media_url.trim()}
                        </Link>
                      </p>
                    )}
                  </div>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </section>

      {printableImages.length > 0 ? (
        <>
          <div className="sop-print-rule" />
          <section aria-labelledby="media-print">
            <h2 id="media-print" className="text-base font-semibold">
              Reference photos
            </h2>
            <ul className="mt-3 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3">
              {printableImages.map((m) => (
                <li key={m.id} className="break-inside-avoid">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.signedUrl!}
                    alt={m.caption?.trim() || "Standard attachment"}
                    className="sop-print-thumb"
                  />
                  {m.caption?.trim() ? (
                    <p className="mt-1 text-[0.65rem] sop-print-muted">{m.caption.trim()}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}

      {videoAttachments.length > 0 ? (
        <>
          <div className="sop-print-rule" />
          <section aria-labelledby="videos-print">
            <h2 id="videos-print" className="text-base font-semibold">
              Reference videos
            </h2>
            <p className="mt-2 text-sm sop-print-muted">
              Clips do not print reliably on paper. Use the QR code or live link below to play them in Rivet.
            </p>
            <ul className="mt-2 list-inside list-disc text-sm">
              {videoAttachments.map((m) => (
                <li key={m.id}>{m.caption?.trim() || "Uploaded walkthrough clip"}</li>
              ))}
            </ul>
          </section>
        </>
      ) : null}

      <div className="sop-print-rule" />

      <footer className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1 text-sm">
          <p className="font-semibold text-foreground">Live standard</p>
          <p className="break-all sop-print-muted">{standardUrl}</p>
          <p className="text-xs sop-print-muted">
            Scan the code with a phone camera to open the latest version in Rivet (sign-in may be required).
          </p>
        </div>
        {qrDataUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={qrDataUrl}
            alt=""
            width={168}
            height={168}
            className="sop-print-qr shrink-0 rounded-md border border-border/60 bg-white p-1"
          />
        ) : null}
      </footer>
    </article>
  )
}
