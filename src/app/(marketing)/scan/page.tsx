import type { Metadata } from "next"

import { OperationalScanFlow } from "@/components/operational-scan/operational-scan-flow"

export const metadata: Metadata = {
  title: "Free Rivet Scan · Owner Dependency",
  description:
    "Seven questions. Get your Owner Dependency Score, severity read, and estimated annual cost of routing load through you.",
  openGraph: {
    title: "Rivet Scan · What is owner dependency costing you?",
    description:
      "Seven questions. Owner Dependency Score, severity, and estimated hours and dollars lost—before you install Rivet.",
  },
}

export default function ScanPage() {
  return <OperationalScanFlow />
}
