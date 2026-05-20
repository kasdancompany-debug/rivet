import { redirect } from "next/navigation"

/** Owner load map now lives under the redesigned onboarding / reality check. */
export default function FounderDependencyPage() {
  redirect("/onboarding")
}
