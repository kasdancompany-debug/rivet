import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LANDING_CTA, LANDING_SCAN_CTA } from "@/lib/marketing-landing-copy";
import { cn } from "@/lib/utils";

export type LandingCtaSurface = "onDark" | "onLight";

type LandingCtaClusterProps = {
  surface: LandingCtaSurface;
  /** `from` query param on `/scan` for attribution. */
  scanFrom?: string;
  align?: "start" | "center";
  /** Show one-line scan context under the button row. */
  showScanSubline?: boolean;
  className?: string;
};

/** Primary / secondary / tertiary CTA stack — shared across landing sections. */
export function LandingCtaCluster({
  surface,
  scanFrom = "landing",
  align = "start",
  showScanSubline = true,
  className,
}: LandingCtaClusterProps) {
  const onDark = surface === "onDark";
  const centered = align === "center";

  return (
    <div
      className={cn(
        "flex w-full max-w-md flex-col gap-2.5",
        centered && "sm:mx-auto sm:max-w-none sm:items-center",
        className,
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-2 sm:flex-row sm:items-stretch",
          centered && "sm:justify-center",
        )}
      >
        <Button
          size="lg"
          nativeButton={false}
          render={<Link href="/signup" />}
          className={cn(
            "h-10 w-full rounded-md px-5 text-[13px] font-semibold shadow-none sm:w-auto sm:min-w-[11rem]",
            onDark
              ? "bg-white text-zinc-950 hover:bg-zinc-100"
              : "bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200",
          )}
        >
          {LANDING_CTA.primary}
          <ArrowRight className="size-3.5 opacity-50" data-icon="inline-end" />
        </Button>
        <Button
          size="lg"
          variant="outline"
          nativeButton={false}
          render={<Link href={`/scan?from=${scanFrom}`} />}
          className={cn(
            "h-10 w-full rounded-md px-5 text-[13px] font-medium shadow-none sm:w-auto sm:min-w-[11rem]",
            onDark
              ? "border-white/14 bg-transparent text-zinc-300 hover:border-white/22 hover:bg-white/[0.04] hover:text-zinc-100"
              : "border-zinc-300 bg-transparent text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-900/60",
          )}
        >
          {LANDING_CTA.secondary}
        </Button>
      </div>

      {showScanSubline ? (
        <p
          className={cn(
            "max-w-[40ch] text-[12px] leading-snug",
            onDark ? "text-zinc-600" : "text-zinc-500 dark:text-zinc-500",
            centered && "sm:text-center",
          )}
        >
          {LANDING_SCAN_CTA.subline}
        </p>
      ) : null}

      <Link
        href="#mechanism-heading"
        scroll
        className={cn(
          "inline-flex w-fit items-center text-[13px] font-medium transition-colors",
          onDark
            ? "text-zinc-500 hover:text-zinc-300"
            : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-300",
          centered && "sm:mx-auto",
        )}
      >
        {LANDING_CTA.tertiary}
      </Link>
    </div>
  );
}

/** @deprecated Use `LandingCtaCluster` — kept for any external imports. */
export function LandingInlineCtas(
  props: Omit<LandingCtaClusterProps, "showScanSubline">,
) {
  return <LandingCtaCluster {...props} />;
}
