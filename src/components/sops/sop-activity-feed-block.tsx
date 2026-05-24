import type { SopActivityFeed } from "@/lib/sops/sop-activity-feed"

export function SopActivityFeedBlock({ feed }: { feed: SopActivityFeed }) {
  return (
    <div className="space-y-1.5 border-t border-border/40 pt-3">
      <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground/90">
        Activity
      </p>

      {feed.idleLabel ? (
        <p className="text-xs leading-relaxed text-muted-foreground/80">{feed.idleLabel}</p>
      ) : (
        <ul className="space-y-1">
          {feed.events.map((event) => (
            <li
              key={`${event.kind}-${event.at}`}
              className="flex flex-wrap items-baseline gap-x-1.5 text-xs leading-relaxed text-muted-foreground/85"
            >
              <span>{event.label}</span>
              <span className="text-muted-foreground/55" aria-hidden>
                •
              </span>
              <span className="text-muted-foreground/65">{event.timeLabel}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
