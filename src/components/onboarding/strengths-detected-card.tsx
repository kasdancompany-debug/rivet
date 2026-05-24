import { Check } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { COPY } from "@/lib/interface-copy"

export function StrengthsDetectedCard({ strengths }: { strengths: string[] }) {
  return (
    <Card className="border-emerald-600/20 bg-emerald-500/[0.04] shadow-sm dark:bg-emerald-950/15">
      <CardHeader className="space-y-1 border-b border-emerald-600/10 pb-4">
        <CardTitle className="text-lg font-semibold tracking-tight text-foreground">
          {COPY.onboarding.strengthsHeading}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-5">
        <ul className="space-y-3">
          {strengths.map((line) => (
            <li key={line} className="flex gap-3 text-sm leading-relaxed text-foreground/90">
              <span
                className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-600/12 text-emerald-800 dark:text-emerald-300/95"
                aria-hidden
              >
                <Check className="size-3.5" strokeWidth={2.5} />
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
