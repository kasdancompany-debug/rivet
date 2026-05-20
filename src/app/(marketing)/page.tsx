import type { Metadata } from "next"

import { RivetLanding } from "@/components/marketing/rivet-landing"
import { getAppSignInHref } from "@/lib/dev-auth-bypass"
import { LANDING_META_DESCRIPTION, LANDING_OG_TITLE } from "@/lib/marketing-landing-copy"

export const metadata: Metadata = {
  title: LANDING_OG_TITLE,
  description: LANDING_META_DESCRIPTION,
  openGraph: {
    title: LANDING_OG_TITLE,
    description: LANDING_META_DESCRIPTION,
  },
}

export default function LandingPage() {
  return <RivetLanding signInHref={getAppSignInHref("/dashboard")} />
}
