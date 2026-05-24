import { shouldEnforceBillingGate } from "@/lib/billing/billing-readiness"

/** Where /setup sends users after a workspace is created. */
export function getPostSetupRedirectPath(): "/subscribe" | "/onboarding" {
  return shouldEnforceBillingGate() ? "/subscribe" : "/onboarding"
}
