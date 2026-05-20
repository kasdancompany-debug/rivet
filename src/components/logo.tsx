import Link from "next/link"

import { cn } from "@/lib/utils"

type LogoProps = {
  className?: string
  href?: string
  /** For dark marketing surfaces (inherits contrast from parent if omitted). */
  variant?: "default" | "light"
}

export function Logo({ className, href = "/", variant = "default" }: LogoProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-baseline gap-0.5 tracking-tight transition-opacity hover:opacity-80",
        className
      )}
    >
      <span
        className={cn(
          "text-[0.95rem] font-semibold sm:text-base",
          variant === "light" ? "text-zinc-100" : "text-foreground"
        )}
      >
        Rivet
      </span>
    </Link>
  )
}
