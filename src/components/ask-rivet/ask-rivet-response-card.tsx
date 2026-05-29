"use client"

import Link from "next/link"
import {
  AlertTriangle,
  Award,
  BookOpen,
  Clock,
  GraduationCap,
  Link2,
  Play,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react"

import type { AskRivetResponse } from "@/lib/ask-rivet/types"
import type { StandardMediaRowSigned } from "@/lib/standards/standard-media-types"
import { AskRivetMediaGallery } from "@/components/media/ask-rivet-media-gallery"
import { COPY } from "@/lib/interface-copy"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function confidenceLabel(confidence: AskRivetResponse["confidence"]) {
  switch (confidence) {
    case "high":
      return COPY.askRivet.confidenceHigh
    case "medium":
      return COPY.askRivet.confidenceMedium
    default:
      return COPY.askRivet.confidenceLow
  }
}

function confidenceStyles(confidence: AskRivetResponse["confidence"]) {
  switch (confidence) {
    case "high":
      return "border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-900 dark:text-emerald-100"
    case "medium":
      return "border-amber-500/30 bg-amber-500/[0.06] text-amber-950 dark:text-amber-100"
    default:
      return "border-amber-500/30 bg-amber-500/[0.04] text-amber-950 dark:text-amber-100"
  }
}

export function AskRivetResponseCard({
  response,
  signedMedia = [],
  portal = false,
  showCreatePlayCta = !portal,
  captureHref = "/sops/capture",
  question,
  compact = false,
}: {
  response: AskRivetResponse
  signedMedia?: StandardMediaRowSigned[]
  portal?: boolean
  showCreatePlayCta?: boolean
  captureHref?: string
  question?: string
  compact?: boolean
}) {
  const signedByMediaId = new Map(signedMedia.map((m) => [m.id, m]))
  const lowConfidence = response.confidence === "low"
  const createPlayHref = question
    ? `${captureHref}?prompt=${encodeURIComponent(question.trim())}`
    : captureHref

  return (
    <article
      className={cn(
        "overflow-hidden rounded-3xl border shadow-sm",
        lowConfidence ? "border-amber-500/25 bg-card" : "border-emerald-500/20 bg-card",
        compact && "shadow-none"
      )}
    >
      <header className="border-b border-border/40 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]",
              confidenceStyles(response.confidence)
            )}
          >
            {lowConfidence ? (
              <ShieldAlert className="size-3" aria-hidden />
            ) : (
              <ShieldCheck className="size-3" aria-hidden />
            )}
            {confidenceLabel(response.confidence)}
          </p>
          <p className="flex items-center gap-1.5 text-xs font-semibold tabular-nums text-muted-foreground">
            {COPY.askRivet.confidenceScoreLabel}: {response.confidenceScore}%
          </p>
        </div>
        <h2 className="mt-3 text-lg font-bold leading-snug tracking-tight text-foreground sm:text-xl">
          {response.title}
        </h2>
        {!lowConfidence && response.sourcesSearched.length > 0 ? (
          <p className="mt-2 text-[10px] text-muted-foreground">
            {COPY.askRivet.sourcesSearchedLabel}: {response.sourcesSearched.join(" · ")}
          </p>
        ) : null}
      </header>

      <div className="space-y-5 px-4 py-5 sm:px-5 sm:py-6">
        <section>
          <p className="text-xs font-medium text-muted-foreground">Answer</p>
          <p className="mt-2 text-base font-medium leading-relaxed text-foreground sm:text-[1.05rem]">
            {response.quickAnswer}
          </p>
          {!lowConfidence ? (
            <p className="mt-2 text-xs text-muted-foreground">{COPY.askRivet.verifiedAnswerNote}</p>
          ) : null}
        </section>

        {!lowConfidence && response.sourcePlay ? (
          <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] px-4 py-3.5">
            <p className="text-xs font-medium text-muted-foreground">{COPY.askRivet.sourcePlayLabel}</p>
            <Link
              href={response.sourcePlay.href}
              className="mt-1.5 inline-flex items-center gap-2 text-base font-semibold text-primary underline-offset-4 hover:underline"
            >
              <Play className="size-4 shrink-0" aria-hidden />
              {response.sourcePlay.title}
            </Link>
            <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
              {response.sourcePlay.excerpt}
            </p>
          </section>
        ) : null}

        {!lowConfidence ? (
          <section className="rounded-2xl border border-border/40 bg-muted/20 px-4 py-3.5">
            <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <GraduationCap className="size-3.5 shrink-0" aria-hidden />
              {COPY.askRivet.sourceTrainingLabel}
            </p>
            {response.sourceTraining ? (
              <>
                <Link
                  href={response.sourceTraining.href}
                  className="mt-1.5 inline-block text-sm font-semibold text-primary underline-offset-4 hover:underline"
                >
                  {response.sourceTraining.title}
                </Link>
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {response.sourceTraining.excerpt}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">{COPY.askRivet.noLinkedTraining}</p>
            )}
          </section>
        ) : null}

        {response.estimatedMinutes != null && !lowConfidence ? (
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Clock className="size-3.5" aria-hidden />
            Est. {response.estimatedMinutes} min
          </p>
        ) : null}

        {lowConfidence ? (
          <div className="space-y-4">
            {portal ? (
              <>
                <p className="text-sm text-muted-foreground">{COPY.staffPortal.askNoAnswerLead}</p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant="outline"
                    className="h-11 rounded-2xl"
                    nativeButton={false}
                    render={<Link href="/learn/plays" />}
                  >
                    <BookOpen className="size-4" aria-hidden />
                    {COPY.staffPortal.askBrowsePlays}
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 rounded-2xl"
                    nativeButton={false}
                    render={<Link href="/learn/training" />}
                  >
                    <GraduationCap className="size-4" aria-hidden />
                    {COPY.staffPortal.askBrowseTraining}
                  </Button>
                </div>
              </>
            ) : null}
            {response.suggestCreatePlay && showCreatePlayCta ? (
              <Button
                size="lg"
                className="h-12 w-full rounded-2xl text-base font-semibold sm:w-auto"
                nativeButton={false}
                render={<Link href={createPlayHref} />}
              >
                <BookOpen className="size-4" aria-hidden />
                {COPY.askRivet.createPlayCta}
              </Button>
            ) : null}
          </div>
        ) : null}

        {!lowConfidence && response.playTitle && response.standardHref ? (
          <section className="rounded-2xl bg-muted/30 px-4 py-3.5">
            <p className="text-xs font-medium text-muted-foreground">Relevant play</p>
            {response.standardHref ? (
              <Link
                href={response.standardHref}
                className="mt-1.5 inline-flex items-center gap-2 text-base font-semibold text-primary underline-offset-4 hover:underline"
              >
                <Play className="size-4 shrink-0" aria-hidden />
                {response.playTitle}
              </Link>
            ) : (
              <p className="mt-1.5 text-base font-semibold text-foreground">{response.playTitle}</p>
            )}
          </section>
        ) : null}

        {!lowConfidence ? (
          <AskRivetMediaGallery
            attachments={response.mediaAttachments}
            signedByMediaId={signedByMediaId}
          />
        ) : null}

        {!lowConfidence && response.commonMistakes.length > 0 ? (
          <section className="rounded-2xl border border-amber-500/15 bg-amber-500/[0.04] px-4 py-3.5">
            <p className="flex items-center gap-2 text-xs font-medium text-amber-900 dark:text-amber-100">
              <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
              Common mistakes
            </p>
            <ul className="mt-2 space-y-1.5 text-sm leading-snug text-foreground">
              {response.commonMistakes.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {!lowConfidence && response.ownerNote ? (
          <section className="rounded-2xl border border-border/40 bg-muted/20 px-4 py-3.5">
            <p className="text-xs font-medium text-muted-foreground">Owner note</p>
            <p className="mt-2 text-sm leading-relaxed text-foreground">{response.ownerNote}</p>
          </section>
        ) : null}

        {!lowConfidence && response.relatedModules.length > 0 ? (
          <section>
            <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <GraduationCap className="size-3.5 shrink-0" aria-hidden />
              Training module
            </p>
            <ul className="mt-2 space-y-2">
              {response.relatedModules.map((m) => (
                <li key={m.id}>
                  <Link
                    href={portal ? m.href : m.href}
                    className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
                  >
                    {m.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {!lowConfidence && response.relatedCertifications.length > 0 ? (
          <section>
            <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Award className="size-3.5 shrink-0" aria-hidden />
              Certification
            </p>
            <ul className="mt-2 space-y-2">
              {response.relatedCertifications.map((c) => (
                <li key={c.moduleId} className="rounded-xl border border-border/40 px-3 py-2.5">
                  <Link href={c.href} className="text-sm font-semibold text-primary hover:underline">
                    {c.title}
                  </Link>
                  {c.description ? (
                    <p className="mt-1 text-xs text-muted-foreground">{c.description}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {!lowConfidence && response.sourceLinks.length > 0 ? (
          <section>
            <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Link2 className="size-3.5 shrink-0" aria-hidden />
              {COPY.askRivet.sourceLinksTitle}
            </p>
            <ul className="mt-2 space-y-2">
              {response.sourceLinks.map((link) => (
                <li key={`${link.source}-${link.excerpt}`} className="rounded-xl border border-border/40 px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {link.label}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-foreground">{link.excerpt}</p>
                  {link.href ? (
                    <Link href={link.href} className="mt-1 inline-block text-xs font-medium text-primary hover:underline">
                      Open source
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {!lowConfidence && response.standardHref ? (
          <Button
            variant="outline"
            className="h-11 w-full rounded-2xl sm:w-auto"
            nativeButton={false}
            render={<Link href={response.standardHref} />}
          >
            <Play className="size-4" aria-hidden />
            Open full play
          </Button>
        ) : null}
      </div>
    </article>
  )
}
