import { Camera, FileText, Film, Mic } from "lucide-react"

import { cn } from "@/lib/utils"

const TYPES = [
  { icon: Camera, label: "Photos & screenshots" },
  { icon: Film, label: "Video" },
  { icon: FileText, label: "PDF" },
  { icon: Mic, label: "Audio" },
] as const

export function OperationalMediaTypeStrip({ className }: { className?: string }) {
  return (
    <ul
      className={cn(
        "flex flex-wrap gap-2 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground",
        className
      )}
    >
      {TYPES.map(({ icon: Icon, label }) => (
        <li
          key={label}
          className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-muted/20 px-2.5 py-1"
        >
          <Icon className="size-3 opacity-70" aria-hidden />
          {label}
        </li>
      ))}
      <li className="inline-flex items-center rounded-full border border-emerald-500/25 bg-emerald-500/[0.06] px-2.5 py-1 text-emerald-900 dark:text-emerald-100/90">
        Private · signed URLs
      </li>
    </ul>
  )
}
