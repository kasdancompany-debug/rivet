import Link from "next/link"

import { Logo } from "@/components/logo"
import { landingFooterLegalLinks } from "@/lib/legal-support-pages-content"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-svh flex-col bg-background">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_45%_at_50%_-15%,oklch(0.94_0.012_260/0.22),transparent_55%)]"
        aria-hidden
      />
      <div className="relative flex flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto mb-8 w-full max-w-md sm:mb-10">
          <Logo />
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center pb-8">
          {children}
        </div>
        <nav
          className="mx-auto mt-auto flex w-full max-w-md flex-wrap justify-center gap-x-3 gap-y-2 pb-4 text-center text-[11px] text-muted-foreground"
          aria-label="Legal and support"
        >
          {landingFooterLegalLinks.map((item) => (
            <Link key={item.href} href={item.href} className="underline-offset-2 hover:text-foreground hover:underline">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
