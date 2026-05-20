/** Maps Supabase Auth / GoTrue messages to calmer, user-facing copy. */
export function mapAuthErrorToMessage(raw: string): string {
  const m = raw.toLowerCase()
  if (m.includes("invalid login credentials") || m.includes("invalid credentials")) {
    return "That email or password does not match our records. Try again or reset your password from the email provider you used at signup."
  }
  if (m.includes("email not confirmed")) {
    return "Confirm your email first, then return here to sign in."
  }
  if (m.includes("user already registered") || m.includes("already been registered")) {
    return "An account with this email already exists. Sign in instead."
  }
  if (m.includes("too many requests") || m.includes("rate limit")) {
    return "Too many attempts in a short window. Wait a minute and try again."
  }
  return raw
}
