import Link from "next/link"
import { GraduationCap } from "lucide-react"

import { Logo } from "@/components/logo"

export function TrainingPortalShell({
  children,
  businessName,
}: {
  children: React.ReactNode
  businessName?: string
}) {
  return (
    <div className="relative flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-3 px-4 py-3">
          <Link href="/learn" className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/40">
              <GraduationCap className="size-4.5 text-primary" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">Training portal</p>
              {businessName ? (
                <p className="truncate text-[0.68rem] text-muted-foreground">{businessName}</p>
              ) : null}
            </div>
          </Link>
          <Logo className="h-5 w-auto shrink-0 opacity-70" />
        </div>
      </header>
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-5 pb-24">{children}</main>
    </div>
  )
}
