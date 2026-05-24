import { cn } from "@/lib/utils"

import { LandingHeroLiveContext } from "@/components/marketing/landing-hero-live-context"

const FEED = [
  "11:52 · interrupt · who owns this task?",
  "08:42 · repeat Q · onboarding checklist",
  "06:31 · bottleneck · client follow-up overdue",
] as const

/**
 * Hero specimen — owner load routing (illustrative).
 */
function RoutingSurfaceDiagram() {
  return (
    <div className="relative">
      <svg
        viewBox="0 0 640 220"
        className="mx-auto h-auto w-full max-h-[min(38vh,380px)] min-h-[210px] text-zinc-500"
        aria-hidden
      >
        <defs>
          <radialGradient id="rivetCoreGrad" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="rgb(244 63 94 / 0.32)" />
            <stop offset="55%" stopColor="rgb(39 39 42 / 0.95)" />
            <stop offset="100%" stopColor="rgb(9 9 11)" />
          </radialGradient>
          <filter id="rivetCoreGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {[80, 200, 320, 440, 560].map((x) => (
          <line
            key={x}
            x1={x}
            y1="14"
            x2={x}
            y2="206"
            stroke="rgb(255 255 255 / 0.035)"
            strokeWidth="1"
          />
        ))}
        <path
          d="M 64 52 Q 200 62 268 96"
          fill="none"
          stroke="rgb(244 63 94 / 0.22)"
          strokeWidth="1.25"
          className="landing-motion-signal-line"
        />
        <path
          d="M 64 112 Q 220 112 268 112"
          fill="none"
          stroke="rgb(245 158 11 / 0.2)"
          strokeWidth="1.25"
          className="landing-motion-signal-line"
          style={{ animationDelay: "-5s" }}
        />
        <path
          d="M 64 172 Q 200 162 268 128"
          fill="none"
          stroke="rgb(244 63 94 / 0.18)"
          strokeWidth="1.25"
          className="landing-motion-signal-line"
          style={{ animationDelay: "-9s" }}
        />
        <path
          d="M 576 112 Q 440 112 372 112"
          fill="none"
          stroke="rgb(244 63 94 / 0.24)"
          strokeWidth="1.25"
          className="landing-motion-signal-line"
          style={{ animationDelay: "-2s" }}
        />
        <rect x="16" y="40" width="76" height="26" rx="2" fill="rgb(24 24 27 / 0.94)" stroke="rgb(255 255 255 / 0.07)" />
        <text x="54" y="57" textAnchor="middle" fill="rgb(161 161 170)" fontSize="10" fontFamily="ui-monospace, monospace">
          OPEN
        </text>
        <rect x="16" y="98" width="76" height="26" rx="2" fill="rgb(24 24 27 / 0.94)" stroke="rgb(255 255 255 / 0.07)" />
        <text x="54" y="115" textAnchor="middle" fill="rgb(161 161 170)" fontSize="10" fontFamily="ui-monospace, monospace">
          TRAIN
        </text>
        <rect x="16" y="156" width="76" height="26" rx="2" fill="rgb(24 24 27 / 0.94)" stroke="rgb(255 255 255 / 0.07)" />
        <text x="54" y="173" textAnchor="middle" fill="rgb(161 161 170)" fontSize="10" fontFamily="ui-monospace, monospace">
          CLOSE
        </text>
        <circle
          cx="320"
          cy="112"
          r="54"
          fill="url(#rivetCoreGrad)"
          stroke="rgb(244 63 94 / 0.28)"
          strokeWidth="1"
          filter="url(#rivetCoreGlow)"
        />
        <text
          x="320"
          y="98"
          textAnchor="middle"
          fill="rgb(212 212 216)"
          fontSize="10"
          fontWeight="700"
          fontFamily="ui-monospace, monospace"
          letterSpacing="0.18em"
        >
          OWNER LOAD
        </text>
        <text
          x="320"
          y="128"
          textAnchor="middle"
          fill="rgb(254 205 211 / 0.95)"
          fontSize="28"
          fontWeight="700"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          68
        </text>
        <rect x="512" y="90" width="112" height="44" rx="2" fill="rgb(24 24 27 / 0.96)" stroke="rgb(244 63 94 / 0.22)" />
        <text
          x="568"
          y="108"
          textAnchor="middle"
          fill="rgb(251 113 133 / 0.92)"
          fontSize="10"
          fontWeight="700"
          fontFamily="ui-monospace, monospace"
          letterSpacing="0.12em"
        >
          OWNER OUT
        </text>
        <text x="568" y="126" textAnchor="middle" fill="rgb(161 161 170)" fontSize="9" fontFamily="ui-monospace, monospace">
          17 · 7d · UTC
        </text>
      </svg>
      <p className="mt-2 text-center font-mono text-[9px] font-semibold uppercase tracking-[0.24em] text-zinc-600">
        Workspace specimen · not live data
      </p>
    </div>
  )
}

export function LandingHeroOperationalViz() {
  return (
    <div
      className={cn(
        "landing-hero-surface relative overflow-hidden rounded-lg border border-white/[0.09]",
        "bg-zinc-950",
        "shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset]",
        "ring-1 ring-black/50"
      )}
    >
      <div className="landing-hero-scanlines pointer-events-none absolute inset-0 opacity-[0.1]" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,transparent_40%,rgba(0,0,0,0.4)_100%)]"
        aria-hidden
      />

      <div className="relative flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] px-3 py-2 sm:px-4">
        <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          Workspace · Oak Ridge
        </span>
        <span className="font-mono text-[9px] tabular-nums text-zinc-600">Rel 2026.05.12</span>
        <span className="inline-flex items-center gap-1.5 rounded border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-zinc-300">
          <span className="size-1 rounded-sm bg-emerald-400/90 landing-motion-live-dot" aria-hidden />
          Live
        </span>
      </div>

      <div className="relative border-b border-white/[0.06] px-2 py-3 sm:px-4 sm:py-4">
        <RoutingSurfaceDiagram />
      </div>

      <div className="relative grid gap-3 p-3 sm:grid-cols-12 sm:gap-4 sm:p-4">
        <div className="rounded-md border border-white/[0.06] bg-black/40 p-3 sm:col-span-4">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Where the business still owns you</p>
          <ul className="mt-2 space-y-1.5">
            {FEED.map((line) => (
              <li key={line} className="font-mono text-[10px] leading-tight text-zinc-400">
                {line}
              </li>
            ))}
          </ul>
          <LandingHeroLiveContext />
        </div>
        <div className="grid grid-cols-3 gap-2 sm:col-span-8 sm:gap-3">
          <div className="rounded-md border border-rose-500/18 bg-rose-950/20 p-2.5 sm:p-3">
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-rose-300/85">Escape readiness</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-rose-100 sm:text-2xl">28%</p>
            <p className="mt-0.5 text-[10px] leading-snug text-zinc-500">Could run a week without you</p>
          </div>
          <div className="rounded-md border border-white/[0.06] bg-white/[0.02] p-2.5 sm:p-3">
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Index</p>
            <p className="landing-motion-score mt-1 text-xl font-semibold tabular-nums text-white sm:text-2xl">68</p>
            <p className="mt-0.5 font-mono text-[9px] text-zinc-600">7d · weighted</p>
          </div>
          <div className="rounded-md border border-white/[0.06] bg-white/[0.02] p-2.5 sm:p-3">
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Owner out</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-100 sm:text-2xl">17</p>
            <p className="mt-0.5 font-mono text-[9px] text-zinc-600">WoW +12%</p>
          </div>
        </div>
      </div>
    </div>
  )
}
