"use client"

import { useState, useTransition } from "react"
import { Loader2, MessageCircleQuestion } from "lucide-react"

import { COPY } from "@/lib/interface-copy"
import { askRivetQuestion } from "@/app/actions/ask-rivet"
import type { AskRivetResponse } from "@/lib/ask-rivet/types"
import type { StandardMediaRowSigned } from "@/lib/standards/standard-media-types"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { AskRivetResponseCard } from "./ask-rivet-response-card"

const STARTERS = [
  "How do I load the freezer properly?",
  "What do I do if the drawer is short?",
  "Who signs off on closing?",
]

export function AskRivetPanel({
  portal = false,
  className,
  compact = false,
}: {
  portal?: boolean
  className?: string
  compact?: boolean
}) {
  const [question, setQuestion] = useState("")
  const [response, setResponse] = useState<AskRivetResponse | null>(null)
  const [signedMedia, setSignedMedia] = useState<StandardMediaRowSigned[]>([])
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function submit(q?: string) {
    const text = (q ?? question).trim()
    if (text.length < 4) {
      setError(COPY.askRivet.errorShort)
      return
    }
    setError(null)
    startTransition(async () => {
      const res = await askRivetQuestion({ question: text, portal })
      if (!res.ok) {
        setError(res.message)
        return
      }
      setResponse(res.response)
      setSignedMedia(res.signedMedia)
      if (q) setQuestion(q)
    })
  }

  return (
    <div className={cn("space-y-5", className)}>
      <div
        className={cn(
          "rounded-3xl border border-border/50 bg-card p-4 shadow-sm sm:p-5",
          compact && "border-0 bg-transparent p-0 shadow-none"
        )}
      >
        {!compact ? (
          <div className="mb-4">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              {COPY.askRivet.eyebrow}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {COPY.askRivet.title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{COPY.askRivet.lead}</p>
          </div>
        ) : null}

        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <label className="min-w-0 flex-1">
            <span className="sr-only">{COPY.askRivet.placeholder}</span>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={compact ? COPY.askRivet.placeholderCompact : COPY.askRivet.placeholder}
              disabled={pending}
              className="h-12 w-full rounded-2xl border border-border/60 bg-background px-4 text-base text-foreground shadow-sm outline-none ring-primary/20 placeholder:text-muted-foreground focus-visible:ring-2"
              autoComplete="off"
            />
          </label>
          <Button
            type="submit"
            className="h-12 shrink-0 rounded-2xl px-6 text-base font-semibold"
            disabled={pending}
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <MessageCircleQuestion className="size-4" aria-hidden />
            )}
            {COPY.askRivet.submit}
          </Button>
        </form>

        {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {STARTERS.map((s) => (
            <button
              key={s}
              type="button"
              className="shrink-0 rounded-full border border-border/50 bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
              disabled={pending}
              onClick={() => submit(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {response ? (
        <AskRivetResponseCard
          response={response}
          signedMedia={signedMedia}
          portal={portal}
          question={question}
          compact={compact}
        />
      ) : null}
    </div>
  )
}
