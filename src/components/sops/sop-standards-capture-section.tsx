import type { StandardsCaptureV1 } from "@/lib/standards-capture/types"
import { formatTrainingRole } from "@/lib/training/roles"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

function isProbablyDirectMedia(url: string) {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url) || url.includes("video/")
}

export function SopStandardsCaptureSection({ capture }: { capture: StandardsCaptureV1 }) {
  const on = capture.onboarding
  const hasOnboarding = on && (on.interrupts || on.headOnly || on.weekAway)
  const hasAnything =
    hasOnboarding ||
    !!capture.videoUrl ||
    !!capture.walkthroughMediaId ||
    capture.photoUrls.length > 0 ||
    capture.qualityStandards.length > 0 ||
    capture.acceptableExamples.length > 0 ||
    capture.unacceptableExamples.length > 0 ||
    capture.assignedRoles.length > 0 ||
    capture.competencyMarkers.length > 0

  if (!hasAnything) return null

  return (
    <section className="space-y-6" aria-labelledby="capture-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="capture-heading" className="text-xl font-semibold tracking-tight">
            Standards Capture
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            What you committed when you moved this out of your head—media, quality bar, examples, and who it applies
            to.
          </p>
        </div>
      </div>

      {hasOnboarding ? (
        <Card className="border-border/60 bg-muted/15 shadow-sm">
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="text-base font-semibold">Onboarding prompts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            {on?.interrupts ? (
              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
                  What do staff still interrupt you to ask?
                </p>
                <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{on?.interrupts}</p>
              </div>
            ) : null}
            {on?.headOnly ? (
              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
                  What task only exists in your head?
                </p>
                <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{on?.headOnly}</p>
              </div>
            ) : null}
            {on?.weekAway ? (
              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
                  What would break first if you disappeared for a week?
                </p>
                <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{on?.weekAway}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {capture.videoUrl ? (
        <Card className="border-border/60 bg-card/70 shadow-sm">
          <CardHeader className="border-b border-border/40 pb-3">
            <CardTitle className="text-base font-semibold">Video walkthrough</CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            {isProbablyDirectMedia(capture.videoUrl) ? (
              <video
                src={capture.videoUrl}
                controls
                className="max-h-[22rem] w-full max-w-2xl rounded-xl border border-border/60 bg-black/5"
                preload="metadata"
              >
                <track kind="captions" />
              </video>
            ) : (
              <a
                href={capture.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                {capture.videoUrl}
              </a>
            )}
          </CardContent>
        </Card>
      ) : null}

      {capture.photoUrls.length > 0 ? (
        <Card className="border-border/60 bg-card/70 shadow-sm">
          <CardHeader className="border-b border-border/40 pb-3">
            <CardTitle className="text-base font-semibold">Reference photos</CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {capture.photoUrls.map((url) => (
                <li key={url} className="overflow-hidden rounded-xl border border-border/60 bg-muted/20">
                  {/* eslint-disable-next-line @next/next/no-img-element -- remote owner media URLs */}
                  <img
                    src={url}
                    alt=""
                    className="aspect-[4/3] h-auto w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none"
                    }}
                  />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {capture.qualityStandards.length > 0 ? (
        <Card className="border-border/60 bg-card/70 shadow-sm">
          <CardHeader className="border-b border-border/40 pb-3">
            <CardTitle className="text-base font-semibold">Quality standards</CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <ul className="list-inside list-disc space-y-2 text-sm leading-relaxed text-foreground">
              {capture.qualityStandards.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {(capture.acceptableExamples.length > 0 || capture.unacceptableExamples.length > 0) && (
        <div className="grid gap-5 lg:grid-cols-2">
          {capture.acceptableExamples.length > 0 ? (
            <Card className="border-emerald-500/20 bg-emerald-500/[0.04] shadow-sm">
              <CardHeader className="border-b border-emerald-500/15 pb-3">
                <CardTitle className="text-base font-semibold text-emerald-950 dark:text-emerald-100/95">
                  Acceptable examples
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-5">
                {capture.acceptableExamples.map((ex) => (
                  <figure key={ex.url} className="space-y-2">
                    <div className="overflow-hidden rounded-lg border border-border/50 bg-muted/30">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ex.url} alt={ex.caption ?? "Acceptable example"} className="max-h-64 w-full object-contain" />
                    </div>
                    {ex.caption ? (
                      <figcaption className="text-xs text-muted-foreground">{ex.caption}</figcaption>
                    ) : null}
                  </figure>
                ))}
              </CardContent>
            </Card>
          ) : null}
          {capture.unacceptableExamples.length > 0 ? (
            <Card className="border-rose-500/25 bg-rose-500/[0.05] shadow-sm">
              <CardHeader className="border-b border-rose-500/15 pb-3">
                <CardTitle className="text-base font-semibold text-rose-950 dark:text-rose-100/95">
                  Unacceptable examples
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-5">
                {capture.unacceptableExamples.map((ex) => (
                  <figure key={ex.url} className="space-y-2">
                    <div className="overflow-hidden rounded-lg border border-border/50 bg-muted/30">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={ex.url}
                        alt={ex.caption ?? "Unacceptable example"}
                        className="max-h-64 w-full object-contain"
                      />
                    </div>
                    {ex.caption ? (
                      <figcaption className="text-xs text-muted-foreground">{ex.caption}</figcaption>
                    ) : null}
                  </figure>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}

      {(capture.assignedRoles.length > 0 || capture.competencyMarkers.length > 0) && (
        <>
          <Separator />
          <div className="flex flex-wrap gap-6">
            {capture.assignedRoles.length > 0 ? (
              <div className="min-w-0 space-y-2">
                <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
                  Role assignments
                </p>
                <ul className="flex flex-wrap gap-2">
                  {capture.assignedRoles.map((r) => (
                    <li key={r}>
                      <Badge variant="secondary" className="font-normal">
                        {formatTrainingRole(r)}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {capture.competencyMarkers.length > 0 ? (
              <div className="min-w-0 space-y-2">
                <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
                  Required competency markers
                </p>
                <ul className="flex flex-wrap gap-2">
                  {capture.competencyMarkers.map((m) => (
                    <li key={m}>
                      <Badge variant="outline" className="font-normal">
                        {m}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </>
      )}
    </section>
  )
}
