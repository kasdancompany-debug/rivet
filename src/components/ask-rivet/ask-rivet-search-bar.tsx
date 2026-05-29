"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { Loader2, MessageCircleQuestion, Search, X } from "lucide-react"

import { askRivetQuestion } from "@/app/actions/ask-rivet"
import type { AskRivetResponse } from "@/lib/ask-rivet/types"
import type { StandardMediaRowSigned } from "@/lib/standards/standard-media-types"
import { COPY } from "@/lib/interface-copy"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import { AskRivetResponseCard } from "./ask-rivet-response-card"

type Props = {
  portal?: boolean
  variant?: "compact" | "inline"
  className?: string
  showCreatePlayCta?: boolean
  captureHref?: string
}

export function AskRivetSearchBar({
  portal = false,
  variant = "compact",
  className,
  showCreatePlayCta = !portal,
  captureHref = "/sops/capture",
}: Props) {
  const [question, setQuestion] = useState("")
  const [response, setResponse] = useState<AskRivetResponse | null>(null)
  const [signedMedia, setSignedMedia] = useState<StandardMediaRowSigned[]>([])
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const rootRef = useRef<HTMLDivElement>(null)

  const isCompact = variant === "compact"

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onPointerDown)
    return () => document.removeEventListener("mousedown", onPointerDown)
  }, [open])

  function submit() {
    const text = question.trim()
    if (text.length < 4) {
      setError(COPY.askRivet.errorShort)
      return
    }
    setError(null)
    if (isCompact) setOpen(true)
    startTransition(async () => {
      const res = await askRivetQuestion({ question: text, portal })
      if (!res.ok) {
        setError(res.message)
        return
      }
      setResponse(res.response)
      setSignedMedia(res.signedMedia)
    })
  }

  function clear() {
    setQuestion("")
    setResponse(null)
    setSignedMedia([])
    setError(null)
    setOpen(false)
  }

  function renderResults(compactCard: boolean) {
    if (pending && !response) {
      return (
        <div className="flex items-center gap-2 px-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Searching plays, training, and owner notes…
        </div>
      )
    }
    if (!response) return null
    return (
      <AskRivetResponseCard
        response={response}
        signedMedia={signedMedia}
        portal={portal}
        showCreatePlayCta={showCreatePlayCta}
        captureHref={captureHref}
        question={question}
        compact={compactCard}
      />
    )
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <form
        className={cn("flex items-center gap-2", !isCompact && "flex-col sm:flex-row")}
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <div className={cn("relative min-w-0 flex-1", isCompact ? "w-full max-w-md" : "w-full")}>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={isCompact ? COPY.askRivet.placeholderCompact : COPY.askRivet.placeholder}
            className={cn(
              "h-10 border-border/60 bg-background/95 pl-9 pr-9 shadow-sm",
              isCompact && "rounded-full text-sm"
            )}
            disabled={pending}
            aria-label={COPY.askRivet.submit}
          />
          {question ? (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              onClick={clear}
              aria-label="Clear"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>
        {!isCompact ? (
          <Button type="submit" className="h-10 shrink-0 px-5" disabled={pending}>
            {pending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <MessageCircleQuestion className="size-4" aria-hidden />
            )}
            {COPY.askRivet.submit}
          </Button>
        ) : null}
      </form>

      {error ? <p className="mt-1.5 text-xs text-destructive">{error}</p> : null}

      {isCompact && open && (pending || response) ? (
        <div className="absolute z-50 left-0 right-0 mt-2 min-w-[min(100vw-2rem,28rem)] overflow-hidden rounded-2xl border border-border/60 bg-background shadow-xl sm:min-w-[28rem]">
          <div className="max-h-[min(70vh,32rem)] overflow-y-auto p-3">{renderResults(true)}</div>
        </div>
      ) : null}

      {!isCompact && (pending || response) ? <div className="mt-4">{renderResults(false)}</div> : null}
    </div>
  )
}
