import type { StandardMediaRowSigned } from "@/lib/standards/standard-media-types"

function isProbablyDirectVideo(url: string) {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url) || url.includes("video/")
}

export function StandardMediaGallery({
  items,
  title = "Uploaded media",
  description = "Files stored for this standard (private bucket — links expire after a while).",
}: {
  items: StandardMediaRowSigned[]
  title?: string
  description?: string
}) {
  if (!items.length) return null

  return (
    <section className="space-y-4" aria-labelledby="standard-media-gallery-heading">
      <div>
        <h2 id="standard-media-gallery-heading" className="text-xl font-semibold tracking-tight">
          {title}
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
      </div>
      <ul className="grid gap-6 sm:grid-cols-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="overflow-hidden rounded-xl border border-border/60 bg-card/70 shadow-sm"
          >
            <div className="border-b border-border/40 px-4 py-3">
              <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
                {item.kind === "video" ? "Video" : item.kind === "image" ? "Image" : "File"}
              </p>
            </div>
            <div className="p-4">
              {!item.signedUrl ? (
                <p className="text-sm text-muted-foreground">Preview unavailable for this file.</p>
              ) : item.kind === "video" ? (
                <video
                  src={item.signedUrl}
                  controls
                  className="max-h-[20rem] w-full rounded-lg border border-border/50 bg-black/5"
                  preload="metadata"
                >
                  <track kind="captions" />
                </video>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element -- signed Supabase URL */
                <img
                  src={item.signedUrl}
                  alt=""
                  className="max-h-[20rem] w-full rounded-lg border border-border/50 object-contain"
                />
              )}
              {item.caption ? (
                <p className="mt-2 text-xs text-muted-foreground">{item.caption}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function StandardMediaInlineVideo({ signedUrl }: { signedUrl: string }) {
  if (!signedUrl) return null
  if (!isProbablyDirectVideo(signedUrl)) {
    return (
      <a
        href={signedUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        Open video
      </a>
    )
  }
  return (
    <video
      src={signedUrl}
      controls
      className="max-h-[22rem] w-full max-w-2xl rounded-xl border border-border/60 bg-black/5"
      preload="metadata"
    >
      <track kind="captions" />
    </video>
  )
}
