import { randomBytes } from "crypto"

import { WORKSPACE_INVITE_TOKEN_BYTES } from "@/lib/workspace-invites/constants"

export function generateWorkspaceInviteToken(): string {
  return randomBytes(WORKSPACE_INVITE_TOKEN_BYTES).toString("hex")
}
