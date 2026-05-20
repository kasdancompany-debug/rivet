import Link from "next/link"

import { COPY } from "@/lib/interface-copy"
import { landingFooterLegalLinks } from "@/lib/legal-support-pages-content"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function RootNotFound() {
  return (
    <div className="flex min-h-svh flex-col bg-background px-4 py-16 text-foreground">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center space-y-8">
        <div className="space-y-2">
          <p className="font-mono text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            404
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">{COPY.routeRecovery.notFoundTitle}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{COPY.routeRecovery.notFoundBody}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "inline-flex h-10 items-center justify-center px-4")}>
            Marketing home
          </Link>
          <Link href="/dashboard" className={cn(buttonVariants(), "inline-flex h-10 items-center justify-center px-4")}>
            {COPY.routeRecovery.notFoundOverview}
          </Link>
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "outline" }), "inline-flex h-10 items-center justify-center px-4")}
          >
            Sign in
          </Link>
        </div>
        <nav className="flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-8 text-xs text-muted-foreground">
          {landingFooterLegalLinks.map((item) => (
            <Link key={item.href} href={item.href} className="underline-offset-4 hover:text-foreground hover:underline">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
