"use client"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type FloorTestAnswer = "yes" | "probably" | "no"

const OPTIONS: { value: FloorTestAnswer; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "probably", label: "Probably" },
  { value: "no", label: "No" },
]

const FLOOR_TEST_SUGGESTIONS = [
  "Add more detail",
  "Add photos",
  "Clarify ownership",
] as const

export function CaptureFloorTestCard({
  value,
  onChange,
}: {
  value: FloorTestAnswer | null
  onChange: (value: FloorTestAnswer) => void
}) {
  const showSuggestions = value === "probably" || value === "no"

  return (
    <Card
      className="border-foreground/10 bg-gradient-to-b from-muted/30 to-muted/5 shadow-sm"
      aria-labelledby="floor-test-heading"
    >
      <CardContent className="space-y-4 p-5 sm:p-6">
        <div className="space-y-1">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Floor test
          </p>
          <h2 id="floor-test-heading" className="text-base font-semibold leading-snug text-foreground">
            Could a new employee run this without texting you?
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {OPTIONS.map((option) => {
            const selected = value === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange(option.value)}
                aria-pressed={selected}
                className={cn(
                  "min-h-[2.75rem] rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                  selected
                    ? "border-foreground/25 bg-foreground/[0.08] text-foreground ring-2 ring-ring ring-offset-2 ring-offset-background"
                    : "border-border/70 bg-card text-muted-foreground hover:bg-muted/40"
                )}
              >
                {option.label}
              </button>
            )
          })}
        </div>

        {showSuggestions ? (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-3 py-3">
            <p className="text-xs font-medium text-amber-950 dark:text-amber-100/90">
              Before you publish, consider:
            </p>
            <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-amber-950/90 dark:text-amber-100/85">
              {FLOOR_TEST_SUGGESTIONS.map((suggestion) => (
                <li key={suggestion} className="flex gap-2">
                  <span aria-hidden className="text-amber-700 dark:text-amber-200/80">
                    •
                  </span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
