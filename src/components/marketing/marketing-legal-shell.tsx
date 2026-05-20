import Link from "next/link"
import type { ReactNode } from "react"

import { Logo } from "@/components/logo"
import { LEGAL_REVIEW_BANNER, landingFooterLegalLinks } from "@/lib/legal-support-pages-content"
import { cn } from "@/lib/utils"

const shellMax = "mx-auto w-full max-w-2xl px-4 sm:px-6"

export function MarketingLegalShell({
  title,
  showLegalBanner = true,
  children,
}: {
  title: string
  /** Terms, privacy, and refund pages show the legal-review banner; support may omit it. */
  showLegalBanner?: boolean
  children: ReactNode
}) {
  return (
    <div className="min-h-svh bg-zinc-50 text-zinc-950 antialiased dark:bg-zinc-950 dark:text-zinc-50">
      <header className="border-b border-zinc-200 bg-white/90 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className={cn(shellMax, "flex h-12 items-center justify-between sm:h-14")}>
          <Logo href="/" />
          <Link
            href="/"
            className="text-[13px] font-medium text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
          >
            Home
          </Link>
        </div>
      </header>

      <main className={cn(shellMax, "py-10 pb-16 sm:py-12")}>
        {showLegalBanner ? (
          <p className="mb-8 rounded-lg border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3 text-[13px] leading-relaxed text-amber-950 dark:border-amber-500/25 dark:bg-amber-500/[0.08] dark:text-amber-100/95">
            {LEGAL_REVIEW_BANNER}
          </p>
        ) : null}

        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">{title}</h1>
        <div className="mt-8 space-y-8 text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">{children}</div>
      </main>

      <footer className="border-t border-zinc-200 bg-white py-8 dark:border-zinc-800 dark:bg-zinc-950">
        <div className={cn(shellMax, "flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between")}>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Legal & support</p>
          <nav className="flex flex-wrap gap-x-4 gap-y-2 text-[13px] font-medium">
            {landingFooterLegalLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-zinc-700 underline-offset-4 hover:text-zinc-950 hover:underline dark:text-zinc-300 dark:hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  )
}
