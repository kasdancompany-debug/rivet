"use client"

import {
  AlertTriangle,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  HelpCircle,
  ListChecks,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react"

import { STANDARD_QUIZ_TYPE_LABELS } from "@/lib/sops/generate-standard-quiz"
import type { PlaySystemPreview } from "@/lib/sops/quick-capture/build-play-system-preview"
import { cn } from "@/lib/utils"

function PreviewSection({
  icon: Icon,
  title,
  subtitle,
  children,
  className,
  accent = "default",
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
  accent?: "default" | "emerald" | "violet" | "amber" | "sky"
}) {
  const accentRing = {
    default: "border-border/60 bg-card/90",
    emerald: "border-emerald-500/20 bg-emerald-500/[0.03]",
    violet: "border-violet-500/20 bg-violet-500/[0.03]",
    amber: "border-amber-500/20 bg-amber-500/[0.03]",
    sky: "border-sky-500/20 bg-sky-500/[0.03]",
  }[accent]

  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border shadow-sm",
        accentRing,
        className
      )}
    >
      <header className="flex items-start gap-3 border-b border-border/40 px-5 py-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-background/80">
          <Icon className="size-4 text-primary" aria-hidden />
        </div>
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
          {subtitle ? (
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
      </header>
      <div className="px-5 py-4">{children}</div>
    </section>
  )
}

function priorityLabel(priority: PlaySystemPreview["draft"]["priority"]): string {
  return `${priority} priority`
}

export function CapturePlayWowPreview({ preview }: { preview: PlaySystemPreview }) {
  const { draft, categoryLabel, trainingPack, quizQuestions, askRivet } = preview

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-[1.75rem] border border-emerald-500/25 bg-gradient-to-br from-emerald-500/[0.08] via-background to-background px-6 py-8 sm:px-8 sm:py-10">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-900 dark:text-emerald-100">
            <Sparkles className="size-3" aria-hidden />
            System generated
          </span>
          <span className="rounded-full border border-border/60 bg-background/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {categoryLabel}
          </span>
          <span className="rounded-full border border-border/60 bg-background/80 px-2.5 py-1 text-[10px] font-semibold capitalize text-muted-foreground">
            {priorityLabel(draft.priority)}
          </span>
        </div>

        <p className="mt-5 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          From: &ldquo;{preview.originalPrompt}&rdquo;
        </p>
        <h2 className="mt-3 text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {draft.title}
        </h2>
        <p className="mt-4 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
          {draft.operationalProblem}
        </p>
        <p className="mt-6 flex items-center gap-2 text-sm font-medium text-emerald-900 dark:text-emerald-100">
          <CheckCircle2 className="size-4 shrink-0" aria-hidden />
          Rivet just turned your frustration into a complete operational system.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <PreviewSection
          icon={ShieldCheck}
          title="Success criteria"
          subtitle="What done looks like on the floor"
          accent="emerald"
        >
          <p className="text-sm leading-relaxed text-foreground">{draft.successCriteria}</p>
          {draft.purpose && draft.purpose !== draft.successCriteria ? (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{draft.purpose}</p>
          ) : null}
        </PreviewSection>

        <PreviewSection
          icon={ClipboardCheck}
          title="Verification requirements"
          subtitle="Proof before the task counts as complete"
          accent="sky"
        >
          {preview.verificationRequirements.length > 0 ? (
            <ul className="space-y-2">
              {preview.verificationRequirements.map((req) => (
                <li
                  key={req}
                  className="flex items-start gap-2 text-sm leading-snug text-foreground"
                >
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary/70" aria-hidden />
                  {req}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Checklist sign-off on each critical step.</p>
          )}
        </PreviewSection>
      </div>

      <PreviewSection
        icon={ListChecks}
        title="Play steps"
        subtitle={`${draft.steps.length} steps · ~${draft.estimatedTimeMinutes} min`}
      >
        <ol className="space-y-4">
          {draft.steps.map((step, index) => (
            <li
              key={`${step.title}-${index}`}
              className="rounded-xl border border-border/50 bg-background/60 px-4 py-3.5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {index + 1}
                </span>
                <p className="text-sm font-semibold text-foreground">{step.title}</p>
                {step.isCritical ? (
                  <span className="rounded-full border border-rose-500/25 bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-900 dark:text-rose-100">
                    Critical
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.instructions}</p>
              {step.verification ? (
                <p className="mt-2 text-xs font-medium text-foreground">
                  Verify: {step.verification}
                </p>
              ) : null}
              {step.visualTarget ? (
                <p className="mt-1 text-xs text-muted-foreground">Target: {step.visualTarget}</p>
              ) : null}
            </li>
          ))}
        </ol>
      </PreviewSection>

      {preview.commonMistakes.length > 0 ? (
        <PreviewSection
          icon={AlertTriangle}
          title="Common mistakes"
          subtitle="What new hires get wrong before this play sticks"
          accent="amber"
        >
          <ul className="space-y-2">
            {preview.commonMistakes.map((mistake) => (
              <li key={mistake} className="text-sm leading-snug text-foreground">
                {mistake}
              </li>
            ))}
          </ul>
        </PreviewSection>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <PreviewSection
          icon={GraduationCap}
          title="Training module"
          subtitle={trainingPack.certificationBadge.title}
          accent="violet"
        >
          <div className="space-y-4">
            {trainingPack.learningObjectives.length > 0 ? (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Objectives
                </p>
                <ul className="mt-2 space-y-1.5">
                  {trainingPack.learningObjectives.slice(0, 4).map((obj) => (
                    <li key={obj} className="text-sm text-foreground">
                      {obj}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {trainingPack.lessonSections.length > 0 ? (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Lessons
                </p>
                <ul className="mt-2 space-y-2">
                  {trainingPack.lessonSections.slice(0, 3).map((lesson) => (
                    <li
                      key={lesson.id}
                      className="rounded-lg border border-border/40 bg-background/50 px-3 py-2"
                    >
                      <p className="text-sm font-medium text-foreground">{lesson.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {lesson.body}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {trainingPack.completionChecklist.length > 0 ? (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Completion checklist
                </p>
                <ul className="mt-2 space-y-1">
                  {trainingPack.completionChecklist.slice(0, 4).map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-violet-600/80" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="flex items-start gap-2 rounded-lg border border-violet-500/20 bg-violet-500/[0.05] px-3 py-2.5">
              <Award className="mt-0.5 size-4 shrink-0 text-violet-700 dark:text-violet-300" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {trainingPack.certificationBadge.title}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {trainingPack.certificationBadge.description}
                </p>
              </div>
            </div>
          </div>
        </PreviewSection>

        <PreviewSection
          icon={HelpCircle}
          title="Quiz"
          subtitle={`${quizQuestions.length} questions ready for crew verification`}
          accent="violet"
        >
          <ul className="space-y-3">
            {quizQuestions.slice(0, 4).map((q, i) => (
              <li
                key={q.id}
                className="rounded-lg border border-border/40 bg-background/50 px-3 py-2.5"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {STANDARD_QUIZ_TYPE_LABELS[q.type]} · Q{i + 1}
                </p>
                <p className="mt-1 text-sm font-medium leading-snug text-foreground">{q.prompt}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Answer: {q.options[q.correctIndex]}
                </p>
              </li>
            ))}
          </ul>
        </PreviewSection>
      </div>

      <PreviewSection
        icon={MessageCircle}
        title="Ask Rivet answer"
        subtitle="What your crew will get when they ask"
        accent="sky"
      >
        <div className="space-y-4">
          <div className="rounded-2xl rounded-tl-md border border-border/50 bg-muted/30 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Crew asks
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">{askRivet.sampleQuestion}</p>
          </div>
          <div className="flex items-start gap-2">
            <ArrowRight className="mt-1 size-4 shrink-0 text-primary" aria-hidden />
            <div className="rounded-2xl rounded-tl-md border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-800/80 dark:text-emerald-200/80">
                Rivet answers
              </p>
              <p className="mt-1 text-sm leading-relaxed text-foreground">{askRivet.quickAnswer}</p>
            </div>
          </div>
          {askRivet.commonMistakes.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              Also warns about: {askRivet.commonMistakes.slice(0, 2).join(" · ")}
            </p>
          ) : null}
        </div>
      </PreviewSection>

      {draft.assignedRoles.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <BookOpen className="size-4" aria-hidden />
          <span>Assigned to:</span>
          {draft.assignedRoles.map((role) => (
            <span
              key={role}
              className="rounded-full border border-border/60 bg-background px-2.5 py-0.5 text-xs font-medium text-foreground"
            >
              {role}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}
