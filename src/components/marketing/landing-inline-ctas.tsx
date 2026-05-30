import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LANDING_CTA, LANDING_SCAN_CTA } from "@/lib/marketing-landing-copy";
import { cn } from "@/lib/utils";

export type LandingCtaSurface = "onDark" | "onLight";

export type LandingCtaPrimary = "founder" | "scan";

type LandingCtaClusterProps = {
  surface: LandingCtaSurface;
  /** Which action leads — scan-first on final CTA, founder-first elsewhere. */
  primary?: LandingCtaPrimary;
  /** `from` query param on `/scan` for attribution. */
  scanFrom?: string;
  align?: "start" | "center";
  /** Show one-line scan context under the button row. */
  showScanSubline?: boolean;
  className?: string;
};

/** Primary / secondary CTA stack — shared across landing sections. */
export function LandingCtaCluster({
  surface,
  primary = "founder",
  scanFrom = "landing",
  align = "start",
  showScanSubline = true,
  className,
}: LandingCtaClusterProps) {
  const onDark = surface === "onDark";
  const centered = align === "center";
  const scanFirst = primary === "scan";

  const founderButton = (
    <Button
      key="founder"
      size="lg"
      variant={scanFirst ? "outline" : undefined}
      nativeButton={false}
      render={<Link href="/signup" />}
      className={cn(
        "h-auto min-h-10 w-full max-w-full whitespace-normal rounded-md px-5 py-2.5 text-[13px] font-semibold shadow-none sm:w-fit",
        scanFirst
          ? onDark
            ? "border-white/14 bg-transparent text-zinc-300 hover:border-white/22 hover:bg-white/[0.04] hover:text-zinc-100"
            : "border-zinc-300 bg-transparent text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-900/60"
          : onDark
            ? "bg-white text-zinc-950 hover:bg-zinc-100"
            : "bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200",
        !scanFirst && "font-semibold",
      )}
    >
      {LANDING_CTA.primary}
      <ArrowRight className="size-3.5 shrink-0 opacity-50" data-icon="inline-end" />
    </Button>
  );

  const scanButton = (
    <Button
      key="scan"
      size="lg"
      variant={scanFirst ? undefined : "outline"}
      nativeButton={false}
      render={<Link href={`/scan?from=${scanFrom}`} />}
      className={cn(
        "h-auto min-h-10 w-full max-w-full whitespace-normal rounded-md px-5 py-2.5 text-[13px] font-medium shadow-none sm:w-fit",
        scanFirst
          ? onDark
            ? "bg-white text-zinc-950 hover:bg-zinc-100"
            : "bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          : onDark
            ? "border-white/14 bg-transparent text-zinc-300 hover:border-white/22 hover:bg-white/[0.04] hover:text-zinc-100"
            : "border-zinc-300 bg-transparent text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-900/60",
        scanFirst && "font-semibold",
      )}
    >
      {LANDING_CTA.secondary}
      <ArrowRight className="size-3.5 shrink-0 opacity-50" data-icon="inline-end" />
    </Button>
  );

  return (
    <div
      className={cn(
        "flex w-full max-w-md flex-col gap-2.5",
        centered && "sm:mx-auto sm:items-center",
        className,
      )}
    >
      <div
        className={cn(
          "flex w-full flex-col gap-2.5",
          centered ? "items-center" : "items-stretch sm:items-start",
        )}
      >
        {scanFirst ? [scanButton, founderButton] : [founderButton, scanButton]}
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
