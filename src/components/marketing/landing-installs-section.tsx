import type { ReactNode } from "react"
import { AlertTriangle } from "lucide-react"

import { cn } from "@/lib/utils"
import { COPY } from "@/lib/interface-copy"

const INSTALL_SITE = "UNIT 04 · OAK RIDGE · SYNC 6:14 PM"

function PreviewShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 shadow-sm ring-1 ring-black/30 dark:ring-black/50",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-zinc-800 px-2 py-1.5">
        <span className="flex shrink-0 gap-1" aria-hidden>
          <span className="size-1.5 rounded-full bg-[#ff5f57]" />
          <span className="size-1.5 rounded-full bg-[#febc2e]" />
          <span className="size-1.5 rounded-full bg-[#28c840]" />
        </span>
        <span className="truncate font-mono text-[0.45rem] font-semibold uppercase tracking-[0.12em] text-zinc-500">
          {INSTALL_SITE}
        </span>
      </div>
      <div className="flex h-2 items-end gap-px border-b border-zinc-300/60 bg-zinc-200/50 px-1.5 py-0.5">
        {Array.from({ length: 28 }).map((_, i) => (
          <span
            key={i}
            className={cn("w-px rounded-full bg-zinc-400/90", i % 4 === 0 ? "h-1.5" : "h-1")}
            aria-hidden
          />
        ))}
      </div>
      <div className="bg-[#ececee] p-2 ring-1 ring-inset ring-zinc-300/80 dark:bg-[#ececee]">{children}</div>
    </div>
  )
}

function StandardsPreview() {
  return (
    <PreviewShell>
      <div className="flex flex-wrap items-center justify-between gap-1">
        <p className="font-mono text-[0.58rem] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
          Standard · open
        </p>
        <span className="rounded border border-amber-600/40 bg-amber-500/20 px-1 py-0.5 text-[0.48rem] font-bold uppercase tracking-wide text-amber-950">
          Draft
        </span>
      </div>
      <div className="mt-1.5 flex items-start gap-1 rounded border border-rose-300/90 bg-rose-50 px-1.5 py-1">
        <AlertTriangle className="mt-0.5 size-2.5 shrink-0 text-rose-600" aria-hidden />
        <p className="text-[0.58rem] font-semibold leading-tight text-rose-900">
          Safety checklist missing · last edit 9d ago
        </p>
      </div>
      <ul className="mt-1.5 space-y-1 text-[0.68rem] leading-snug text-zinc-800 dark:text-zinc-800">
        <li className="flex gap-1.5">
          <span className="text-zinc-400">1.</span>
          <span>Site walk — hazards, equipment, access</span>
        </li>
        <li className="flex gap-1.5 opacity-70">
          <span className="text-zinc-400">2.</span>
          <span className="line-through decoration-zinc-400">Opening sequence — outdated steps</span>
        </li>
      </ul>
      <p className="mt-1 font-mono text-[0.52rem] text-zinc-500">M.K. · 6:02 AM · v0.3 unpublished</p>
      <p className="mt-1 text-[0.55rem] font-medium text-zinc-600">Blocks training path #TR-OPEN</p>
    </PreviewShell>
  )
}

function OwnerInterruptionsPreview() {
  const rows = [
    { kind: "Judgment", mins: 12, text: "Did the estimate get sent?" },
    { kind: "Repeat Q", mins: 4, text: "Where is the onboarding checklist?" },
    { kind: "Follow-up", mins: 18, text: "Client follow-up overdue" },
  ] as const
  return (
    <PreviewShell>
      <p className="font-mono text-[0.58rem] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
        {COPY.interruptions.featureTitle} · this week
      </p>
      <ul className="mt-1.5 space-y-1">
        {rows.map((row) => (
          <li
            key={row.text}
            className="rounded-sm border border-zinc-200/90 bg-white px-1.5 py-1 text-[0.68rem] text-zinc-800 dark:text-zinc-800"
          >
            <span className="font-semibold">{row.text}</span>
            <span className="mt-0.5 block font-mono text-[0.52rem] text-zinc-500">
              {row.kind} · {row.mins} min
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-1.5 font-mono text-[0.5rem] leading-tight text-zinc-600">
        17 logged · 6h 20m owner time · same themes repeat
      </p>
    </PreviewShell>
  )
}

function TrainingPreview() {
  return (
    <PreviewShell>
      <div className="flex flex-wrap items-center justify-between gap-1">
        <p className="text-[0.68rem] font-semibold text-zinc-900">Onboarding checklist</p>
        <span className="rounded border border-rose-600/45 bg-rose-600/15 px-1 py-0.5 text-[0.48rem] font-bold uppercase tracking-wide text-rose-900">
          Blocking
        </span>
      </div>
      <p className="mt-1.5 text-[0.68rem] font-bold leading-snug text-rose-900">
        Training incomplete — 2 roles affected
      </p>
      <p className="mt-1 text-[0.58rem] leading-snug text-zinc-700">
        Last completed by: <span className="font-semibold">Jordan M.</span>
      </p>
      <p className="mt-0.5 font-mono text-[0.55rem] font-semibold text-amber-800">Open for: 14h</p>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-zinc-200">
        <div className="h-full w-[60%] rounded-full bg-zinc-900" />
      </div>
      <p className="mt-1.5 font-mono text-[0.5rem] text-zinc-600">Module #ONB-01 · unsigned · blocks handoff checklist</p>
    </PreviewShell>
  )
}

function BottleneckPreview() {
  return (
    <PreviewShell>
      <div className="grid grid-cols-2 gap-1.5">
        <div className="rounded border border-zinc-200 bg-white px-1.5 py-1">
          <p className="font-mono text-[0.5rem] font-semibold uppercase tracking-wide text-zinc-500">Open</p>
          <p className="text-sm font-bold tabular-nums text-zinc-900">11</p>
          <p className="mt-0.5 text-[0.52rem] font-medium text-amber-800">3 unassigned</p>
        </div>
        <div className="rounded border border-rose-300/90 bg-rose-50 px-1.5 py-1">
          <p className="font-mono text-[0.5rem] font-semibold uppercase tracking-wide text-rose-800">
            Routed owner
          </p>
          <p className="text-sm font-bold tabular-nums text-rose-900">22</p>
          <p className="mt-0.5 text-[0.52rem] text-rose-800">↑ vs last week</p>
        </div>
      </div>
      <p className="mt-1.5 font-mono text-[0.52rem] text-zinc-500">
        Last event · 11:06 PM · refs #ST-SITE · #SR-0421
      </p>
    </PreviewShell>
  )
}

function RivetIndexPreview() {
  return (
    <PreviewShell>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="font-mono text-[0.55rem] font-semibold uppercase tracking-wide text-zinc-500">Rivet Index</p>
          <p className="text-2xl font-bold tabular-nums leading-none text-zinc-950">52</p>
        </div>
        <span className="rounded border border-rose-600/40 bg-rose-600/12 px-1.5 py-0.5 text-[0.5rem] font-bold uppercase tracking-wide text-rose-950">
          Critical
        </span>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-sm bg-zinc-200">
        <div className="h-full w-[52%] rounded-sm bg-rose-600" />
      </div>
      <p className="mt-1.5 text-[0.58rem] font-medium leading-snug text-zinc-700">
        Procedures thin · training gaps · 3 owner-only bottlenecks open
      </p>
      <div className="mt-2 grid grid-cols-3 gap-1 border-t border-zinc-200/90 pt-2">
        <div>
          <p className="font-mono text-[0.45rem] uppercase tracking-wide text-zinc-500">Ops</p>
          <p className="text-[0.65rem] font-semibold tabular-nums text-zinc-900">61</p>
        </div>
        <div>
          <p className="font-mono text-[0.45rem] uppercase tracking-wide text-zinc-500">Train</p>
          <p className="text-[0.65rem] font-semibold tabular-nums text-zinc-900">44</p>
        </div>
        <div>
          <p className="font-mono text-[0.45rem] uppercase tracking-wide text-zinc-500">CX</p>
          <p className="text-[0.65rem] font-semibold tabular-nums text-zinc-900">38</p>
        </div>
      </div>
    </PreviewShell>
  )
}

function PillarPreview({ index }: { index: number }) {
  switch (index) {
    case 0:
      return <StandardsPreview />
    case 1:
      return <OwnerInterruptionsPreview />
    case 2:
      return <TrainingPreview />
    case 3:
      return <BottleneckPreview />
    case 4:
      return <RivetIndexPreview />
    default:
      return null
  }
}

export function LandingInstallsSection({
  title,
  lead,
  pillars,
}: {
  title: string
  lead: string
  pillars: readonly { title: string; sentence: string }[]
}) {
  return (
    <section
      className="relative border-b border-zinc-200 bg-zinc-50 py-14 sm:py-16 dark:border-zinc-800 dark:bg-zinc-950"
      aria-labelledby="installs-heading"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-zinc-200/80 dark:bg-zinc-800" aria-hidden />
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-500">
            In v1 today
          </p>
          <h2
            id="installs-heading"
            className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-zinc-950 sm:text-[1.75rem] sm:leading-tight lg:text-3xl dark:text-zinc-50"
          >
            {title}
          </h2>
          <p className="mt-3 max-w-[46ch] text-[13px] font-normal leading-relaxed text-zinc-600 sm:text-[0.9375rem] dark:text-zinc-400">
            {lead}
          </p>
        </div>

        <ul className="mt-10 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3 lg:gap-3">
          {pillars.slice(0, 3).map((p, i) => (
            <li
              key={p.title}
              className={
                i === 2
                  ? "sm:col-span-2 sm:mx-auto sm:max-w-lg lg:col-span-1 lg:mx-0 lg:max-w-none"
                  : undefined
              }
            >
              <article className="group flex h-full flex-col rounded-lg border border-zinc-200 bg-white p-4 ring-1 ring-zinc-950/[0.02] transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-white/[0.03] dark:hover:border-zinc-600 sm:p-5">
                <div className="mb-4 shrink-0">
                  <PillarPreview index={i} />
                </div>
                <h3 className="text-[0.9375rem] font-semibold leading-snug tracking-tight text-zinc-950 dark:text-zinc-50">
                  {p.title}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">{p.sentence}</p>
              </article>
            </li>
          ))}
        </ul>
        <ul className="mt-3 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3 lg:gap-3">
          {pillars.slice(3).map((p, i) => (
            <li key={p.title} className={i === 0 ? "lg:col-span-2" : "lg:col-span-1"}>
              <article className="group flex h-full flex-col rounded-lg border border-zinc-200 bg-white p-4 ring-1 ring-zinc-950/[0.02] transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-white/[0.03] dark:hover:border-zinc-600 sm:p-5">
                <div className="mb-4 shrink-0">
                  <PillarPreview index={i + 3} />
                </div>
                <h3 className="text-[0.9375rem] font-semibold leading-snug tracking-tight text-zinc-950 dark:text-zinc-50">
                  {p.title}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">{p.sentence}</p>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
