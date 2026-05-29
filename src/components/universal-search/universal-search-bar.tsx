"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, useTransition } from "react"
import { Loader2, MessageCircleQuestion, Search, X } from "lucide-react"

import { universalSearch } from "@/app/actions/universal-search"
import { UniversalSearchResults } from "@/components/universal-search/universal-search-results"
import { COPY } from "@/lib/interface-copy"
import type { UniversalSearchResponse } from "@/lib/universal-search/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type Props = {
  variant?: "compact" | "inline"
  className?: string
  /** Prefill from URL (e.g. /search?q=). */
  initialQuery?: string
}

export function UniversalSearchBar({ variant = "compact", className, initialQuery = "" }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const [result, setResult] = useState<UniversalSearchResponse | null>(null)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const rootRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isCompact = variant === "compact"
  const p = COPY.universalSearch

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onPointerDown)
    return () => document.removeEventListener("mousedown", onPointerDown)
  }, [open])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  function runSearch(text: string) {
    const trimmed = text.trim()
    if (trimmed.length < 2) {
      setResult(null)
      setError(trimmed.length > 0 ? p.queryTooShort : null)
      return
    }
    setError(null)
    if (isCompact) setOpen(true)
    startTransition(async () => {
      const res = await universalSearch(trimmed)
      if (!res.ok) {
        setError(res.message)
        setResult(null)
        return
      }
      setResult(res.result)
    })
  }

  function scheduleSearch(text: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runSearch(text), 280)
  }

  function clear() {
    setQuery("")
    setResult(null)
    setError(null)
    setOpen(false)
  }

  function goToSearchPage() {
    const q = query.trim()
    if (q.length < 2) return
    setOpen(false)
    router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  const showDropdown = isCompact && open && (pending || result || error)
  const showInlinePanel = !isCompact && (pending || result || error)

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <form
        className={cn("flex items-center gap-2", !isCompact && "flex-col sm:flex-row")}
        onSubmit={(e) => {
          e.preventDefault()
          runSearch(query)
        }}
      >
        <div className={cn("relative min-w-0 flex-1", isCompact ? "w-full max-w-md" : "w-full")}>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => {
              const v = e.target.value
              setQuery(v)
              scheduleSearch(v)
            }}
            onFocus={() => {
              if (query.trim().length >= 2) setOpen(true)
            }}
            placeholder={isCompact ? p.placeholderCompact : p.placeholder}
            className={cn(
              "h-10 border-border/60 bg-background/95 pl-9 pr-9 shadow-sm",
              isCompact && "rounded-full text-sm"
            )}
            disabled={pending}
            aria-label={p.pageTitle}
            autoComplete="off"
          />
          {query ? (
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
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            Search
          </Button>
        ) : null}
      </form>

      {error ? <p className="mt-1.5 text-xs text-destructive">{error}</p> : null}

      {showDropdown ? (
        <div className="absolute z-50 left-0 right-0 mt-2 min-w-[min(100vw-2rem,32rem)] overflow-hidden rounded-2xl border border-border/60 bg-background shadow-xl sm:min-w-[32rem]">
          <div className="max-h-[min(70vh,36rem)] overflow-y-auto p-3">
            {pending && !result ? (
              <div className="flex items-center gap-2 px-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {p.searching}
              </div>
            ) : null}
            {result && result.totalCount === 0 && !pending ? (
              <p className="px-2 py-4 text-sm text-muted-foreground">{p.noResults}</p>
            ) : null}
            {result && result.totalCount > 0 ? (
              <UniversalSearchResults groups={result.groups} onNavigate={() => setOpen(false)} />
            ) : null}
            {query.trim().length >= 4 ? (
              <div className="mt-3 flex flex-wrap gap-2 border-t border-border/40 pt-3">
                <Button type="button" variant="outline" size="sm" onClick={goToSearchPage}>
                  {p.viewAll}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  nativeButton={false}
                  render={<Link href={`/ask?q=${encodeURIComponent(query.trim())}`} />}
                  onClick={() => setOpen(false)}
                >
                  <MessageCircleQuestion className="mr-1.5 size-3.5" aria-hidden />
                  {p.askRivetCta}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {showInlinePanel ? (
        <div className="mt-4 rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm">
          {pending && !result ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              {p.searching}
            </div>
          ) : null}
          {result && result.totalCount === 0 && !pending ? (
            <p className="text-sm text-muted-foreground">{p.noResults}</p>
          ) : null}
          {result && result.totalCount > 0 ? (
            <UniversalSearchResults groups={result.groups} />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
