"use client"

import Link from "next/link"
import { useEffect } from "react"

/**
 * Root error boundary (must define its own `<html>` / `<body>`).
 * Keep styles minimal so this still renders if the root layout fails.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("[rivet] global error", error)
    }
  }, [error])

  return (
    <html lang="en">
      <body className="flex min-h-svh flex-col items-center justify-center gap-4 bg-zinc-50 px-6 py-12 text-zinc-900 antialiased">
        <div className="max-w-md space-y-3 text-center">
          <p className="font-mono text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-zinc-500">Rivet</p>
          <h1 className="text-xl font-semibold tracking-tight">Something went wrong</h1>
          <p className="text-sm leading-relaxed text-zinc-600">
            The app hit an unexpected error. Try again, or open the home page and sign back in if the problem
            persists.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800"
            onClick={() => reset()}
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
          >
            Home
          </Link>
        </div>
      </body>
    </html>
  )
}
