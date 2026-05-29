import type { Metadata, Viewport } from "next"

import { COPY } from "@/lib/interface-copy"

export const metadata: Metadata = {
  title: {
    default: COPY.staffPortal.metadataTitle,
    template: `%s · ${COPY.staffPortal.metadataTitle}`,
  },
  description: COPY.staffPortal.metadataDescription,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: COPY.staffPortal.brandTitle,
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
}

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return children
}
