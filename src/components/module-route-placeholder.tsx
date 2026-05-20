import Link from "next/link"

import { COPY } from "@/lib/interface-copy"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type ModuleRoutePlaceholderProps = {
  /** Small mono label above the title (e.g. section name). */
  eyebrow?: string
  title: string
  purpose: string
  emptyBody: string
  primaryCta: { label: string; href: string }
  secondaryCta?: { label: string; href: string }
}

/**
 * Trust-preserving shell for routes that are gated, unfinished, or temporarily empty.
 * Primary CTA = next useful operational step; secondary defaults to Reality check (not Overview).
 */
export function ModuleRoutePlaceholder({
  eyebrow,
  title,
  purpose,
  emptyBody,
  primaryCta,
  secondaryCta = { label: COPY.nav.realityCheck, href: "/onboarding" },
}: ModuleRoutePlaceholderProps) {
  return (
    <Card className="mx-auto mt-10 max-w-2xl border-border/60 bg-card/90 shadow-[0_2px_24px_rgba(15,23,42,0.05)]">
      <CardHeader className="space-y-2 border-b border-border/50 pb-6">
        {eyebrow ? (
          <p className="font-mono text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <CardTitle
          className={cn(
            "text-xl font-semibold tracking-tight text-foreground sm:text-2xl",
            eyebrow ? "pt-1" : ""
          )}
        >
          {title}
        </CardTitle>
        <CardDescription className="text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
          {purpose}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">{emptyBody}</p>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 border-t border-border/50 pt-6 sm:flex-row sm:justify-start">
        <Button nativeButton={false} className="w-full sm:w-auto" render={<Link href={primaryCta.href} />}>
          {primaryCta.label}
        </Button>
        <Button
          variant="outline"
          className="w-full sm:w-auto"
          nativeButton={false}
          render={<Link href={secondaryCta.href} />}
        >
          {secondaryCta.label}
        </Button>
      </CardFooter>
    </Card>
  )
}
