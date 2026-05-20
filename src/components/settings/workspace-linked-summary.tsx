import { Building2 } from "lucide-react"

import { COPY } from "@/lib/interface-copy"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function WorkspaceLinkedSummary({ businessName }: { businessName: string }) {
  return (
    <Card className="mt-8 border-border/60 bg-card/90 shadow-sm">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-muted/30 text-muted-foreground">
            <Building2 className="size-5" strokeWidth={1.75} aria-hidden />
          </div>
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-lg">{COPY.settingsWorkspace.linkedTitle}</CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              {COPY.settingsWorkspace.linkedLead}{" "}
              <span className="font-medium text-foreground">{businessName}</span>.
              {COPY.settingsWorkspace.linkedTrail}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs text-muted-foreground">{COPY.settingsWorkspace.linkedHint}</p>
      </CardContent>
    </Card>
  )
}
