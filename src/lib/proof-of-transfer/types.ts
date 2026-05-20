export type ProofBucket = "transferred" | "fragile" | "owner_only" | "newly_stable"

export type ProofSignal = {
  id: string
  title: string
  body: string
  /** Optional metric line (counts, streaks). */
  metric?: string
  href?: string
}

export type ProofOfTransferView = {
  source: "live" | "unlinked"
  headline: string
  promise: string
  /** Count of signals per bucket (for bar / summary). */
  bucketCounts: Record<ProofBucket, number>
  columns: Record<ProofBucket, ProofSignal[]>
}
