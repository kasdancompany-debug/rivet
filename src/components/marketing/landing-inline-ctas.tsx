import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { LANDING_CTA } from "@/lib/marketing-landing-copy"
import { cn } from "@/lib/utils"

export type LandingCtaSurface = "onDark" | "onLight"

export function LandingInlineCtas({
  surface,
  className,
}: {
  surface: LandingCtaSurface
  className?: string
}) {
  const onDark = surface === "onDark"
  return (
    <div
      className={cn(
        "flex w-full max-w-md flex-col gap-3 sm:mx-auto sm:max-w-none sm:flex-row sm:justify-center sm:gap-3",
        className
      )}
    >
      <Button
        size="lg"
        nativeButton={false}
        render={<Link href="/signup" />}
        className={cn(
          "h-12 w-full shrink-0 font-semibold shadow-sm sm:w-auto sm:min-w-[11rem]",
          onDark
            ? "bg-zinc-100 text-zinc-950 hover:bg-white"
            : "bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
        )}
      >
        {LANDING_CTA.primary}
        <ArrowRight className="size-4 opacity-80" data-icon="inline-end" />
      </Button>
      <Button
        size="lg"
        variant="outline"
        nativeButton={false}
        render={<Link href="#installs-heading" scroll />}
        className={cn(
          "h-12 w-full font-medium sm:w-auto sm:min-w-[10.5rem]",
          onDark
            ? "border-zinc-600 bg-transparent text-zinc-100 hover:border-zinc-500 hover:bg-zinc-900/70 hover:text-white"
            : "border-zinc-300 bg-white text-zinc-950 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900/80"
        )}
      >
        {LANDING_CTA.secondary}
      </Button>
    </div>
  )
}
