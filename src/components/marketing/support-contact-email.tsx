import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/site-legal-config"
import { cn } from "@/lib/utils"

export function SupportContactEmail({ className }: { className?: string }) {
  return (
    <a
      href={SUPPORT_MAILTO}
      className={cn(
        "font-mono text-[0.9375rem] font-medium text-zinc-950 underline underline-offset-2 hover:text-zinc-700 dark:text-white dark:hover:text-zinc-200",
        className
      )}
    >
      {SUPPORT_EMAIL}
    </a>
  )
}
