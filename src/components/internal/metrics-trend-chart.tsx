"use client"

import { useRef } from "react"
import { Download } from "lucide-react"

import type { DailyMetricPoint } from "@/lib/internal-metrics/build-daily-series"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function downloadSvg(svg: SVGSVGElement, filename: string) {
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg")
  const blob = new Blob([new XMLSerializer().serializeToString(clone)], {
    type: "image/svg+xml;charset=utf-8",
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function MetricsTrendChart({
  title,
  subtitle,
  points,
  unit,
  filename,
  variant = "bar",
  className,
}: {
  title: string
  subtitle?: string
  points: DailyMetricPoint[]
  unit?: string
  filename: string
  variant?: "bar" | "line"
  className?: string
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const hasData = points.some((p) => p.value > 0)
  const total = points.reduce((s, p) => s + p.value, 0)
  const max = Math.max(...points.map((p) => p.value), 1)
  const min = Math.min(...points.map((p) => p.value))
  const w = 320
  const h = 120
  const padX = 8
  const padY = 8
  const chartH = h - padY * 2 - 16

  const coords = points.map((p, i) => {
    const x = padX + (i / Math.max(points.length - 1, 1)) * (w - padX * 2)
    const y = padY + (1 - (p.value - min) / Math.max(max - min, 1)) * chartH
    return { x, y, ...p }
  })

  return (
    <section
      className={cn(
        "flex flex-col rounded-xl border border-border/60 bg-card/80 p-4 shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
          <p className="mt-2 text-lg font-semibold tabular-nums text-foreground">
            {total.toLocaleString()}
            {unit ? (
              <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>
            ) : null}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 shrink-0 gap-1"
          disabled={!hasData}
          onClick={() => {
            if (svgRef.current) downloadSvg(svgRef.current, `${filename}.svg`)
          }}
        >
          <Download className="size-3.5" aria-hidden />
          SVG
        </Button>
      </div>

      {!hasData ? (
        <p className="mt-4 text-sm text-muted-foreground">No activity in this window yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <svg
            ref={svgRef}
            width={w}
            height={h}
            viewBox={`0 0 ${w} ${h}`}
            className="max-w-full text-foreground"
            role="img"
            aria-label={`${title} trend chart`}
          >
            <title>{title}</title>
            {variant === "bar"
              ? coords.map((p) => {
                  const barH = (p.value / max) * chartH
                  const barW = Math.max((w - padX * 2) / points.length - 2, 4)
                  const x = p.x - barW / 2
                  const y = padY + chartH - barH
                  return (
                    <rect
                      key={p.date}
                      x={x}
                      y={y}
                      width={barW}
                      height={Math.max(barH, 2)}
                      rx={2}
                      className="fill-zinc-800 dark:fill-zinc-200"
                    >
                      <title>{`${p.date}: ${p.value}`}</title>
                    </rect>
                  )
                })
              : (
                <polyline
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-sky-600 dark:text-sky-400"
                  points={coords.map((p) => `${p.x},${p.y}`).join(" ")}
                />
              )}
            {coords.map((p, i) =>
              i % Math.ceil(points.length / 7) === 0 || i === points.length - 1 ? (
                <text
                  key={`${p.date}-label`}
                  x={p.x}
                  y={h - 2}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[8px]"
                >
                  {p.date.slice(5)}
                </text>
              ) : null
            )}
          </svg>
        </div>
      )}
    </section>
  )
}
