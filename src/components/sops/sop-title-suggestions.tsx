"use client"

import { cn } from "@/lib/utils"

export function SopTitleSuggestions({
  suggestions,
  activeTitle,
  onSelect,
}: {
  suggestions: string[]
  activeTitle: string
  onSelect: (title: string) => void
}) {
  if (suggestions.length === 0) return null

  return (
    <div className="space-y-2 pt-1" aria-live="polite">
      <p className="text-xs font-medium text-muted-foreground">Suggested titles</p>
      <ul className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => {
          const selected = activeTitle.trim().toLowerCase() === suggestion.toLowerCase()
          return (
            <li key={suggestion}>
              <button
                type="button"
                onClick={() => onSelect(suggestion)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-left text-sm font-medium transition-colors",
                  selected
                    ? "border-foreground/25 bg-foreground/[0.08] text-foreground"
                    : "border-border/70 bg-muted/30 text-muted-foreground hover:border-foreground/20 hover:bg-muted/50 hover:text-foreground"
                )}
                aria-pressed={selected}
              >
                {suggestion}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
