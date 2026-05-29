import type { Metadata } from "next"

import { OperationalScanFlow } from "@/components/operational-scan/operational-scan-flow"

export const metadata: Metadata = {
  title: "Free Rivet Scan · Owner Dependency",
  description:
    "Eight questions. See your Owner Dependency Risk, risk level, and what routing load through you may cost each year—in about two minutes.",
  openGraph: {
    title: "Rivet Scan · How dependent is your business on you?",
    description:
      "Staff questions, owner texts and calls, open/close, training, and repeat issues—then your score and annual cost estimate.",
  },
}

export default function ScanPage() {
  return <OperationalScanFlow />
}
