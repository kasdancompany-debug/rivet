import Link from "next/link"

import { COPY } from "@/lib/interface-copy"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

type Props = {
  /** Main heading; defaults to link-your-business title. */
  title?: string
  description: string
  className?: string
}

/**
 * Consistent “link your business” recovery: primary opens Settings, secondary opens Standards (not a dead loop to Overview).
 */
export function BusinessLinkRequiredPanel({ title = COPY.connect.title, description, className }: Props) {
  return (
    <Card className={cn("border-border/50 bg-card/80 shadow-[0_2px_24px_rgba(15,23,42,0.04)]", className)}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button className="w-full sm:w-auto" nativeButton={false} render={<Link href="/settings" />}>
            {COPY.connect.cta}
          </Button>
          <Button variant="outline" className="w-full sm:w-auto" nativeButton={false} render={<Link href="/sops" />}>
            {COPY.nav.standards}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
