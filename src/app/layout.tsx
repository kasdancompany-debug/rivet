import type { Metadata } from "next"
import { Geist_Mono, Plus_Jakarta_Sans } from "next/font/google"

import { RIVET_PRICING } from "@/lib/pricing-copy"
import { EMOTIONAL_PROMISE, PRODUCT_ONE_LINER } from "@/lib/product-voice"

import "./globals.css"

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  title: {
    default: "Rivet",
    template: "%s · Rivet",
  },
  description: `${EMOTIONAL_PROMISE} ${PRODUCT_ONE_LINER} ${RIVET_PRICING.metaLine}`,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${fontSans.variable} ${fontMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
