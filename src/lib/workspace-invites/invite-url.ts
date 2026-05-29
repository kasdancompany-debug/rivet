export function workspaceInviteUrl(token: string, origin?: string): string {
  const base = (origin ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    ""
  )
  return `${base}/join/${token}`
}
