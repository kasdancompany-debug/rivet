import {
  fetchBusinessForCurrentUser,
  fetchProfilesForCurrentBusiness,
  listDailyChecklistsForBusiness,
  listEmployeeReadinessForBusiness,
  listIssuesForBusiness,
} from "@/lib/db/queries"
import { listRivetIndexSnapshotsLastDays } from "@/lib/rivet-score/data"
import { COPY } from "@/lib/interface-copy"
import { isIssueUnresolved } from "@/lib/issues/constants"
import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/types/database"

import type { ProofBucket, ProofOfTransferView, ProofSignal } from "@/lib/proof-of-transfer/types"

const PROMISE = "The operation can increasingly carry load without routing every judgment through you."

function profileIsOwner(p: Pick<Tables<"profiles">, "id" | "is_owner">, business: Pick<Tables<"businesses">, "owner_id">): boolean {
  return p.id === business.owner_id || p.is_owner === true
}

function utcDatesLastDays(n: number): string[] {
  const out: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() - i)
    out.push(d.toISOString().slice(0, 10))
  }
  return out
}

function scoreFromCategorySnap(raw: unknown, key: string): number | null {
  if (!raw || typeof raw !== "object") return null
  const v = (raw as Record<string, unknown>)[key]
  if (typeof v === "number" && !Number.isNaN(v)) return v
  if (typeof v === "string") {
    const n = Number(v)
    return Number.isNaN(n) ? null : n
  }
  return null
}

function mean(nums: number[]): number {
  if (nums.length === 0) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

function stdev(nums: number[]): number {
  if (nums.length < 2) return 0
  const m = mean(nums)
  const v = nums.reduce((s, x) => s + (x - m) ** 2, 0) / (nums.length - 1)
  return Math.sqrt(v)
}

function emptyColumns(): Record<ProofBucket, ProofSignal[]> {
  return { transferred: [], fragile: [], owner_only: [], newly_stable: [] }
}

function proofOfTransferUnlinkedView(): ProofOfTransferView {
  return {
    source: "unlinked",
    headline: COPY.proofPage.unlinkedHeadline,
    promise: COPY.proofPage.unlinkedLead,
    bucketCounts: { transferred: 0, fragile: 0, owner_only: 0, newly_stable: 0 },
    columns: emptyColumns(),
  }
}

export async function getProofOfTransferData(): Promise<ProofOfTransferView> {
  try {
    const supabase = await createClient()
    const business = await fetchBusinessForCurrentUser(supabase)
    if (!business) {
      return proofOfTransferUnlinkedView()
    }

    const businessId = business.id
    const since60 = new Date()
    since60.setUTCDate(since60.getUTCDate() - 60)
    const since60Iso = since60.toISOString()

    const [profiles, openingChecklists, issues, readiness] = await Promise.all([
      fetchProfilesForCurrentBusiness(supabase),
      listDailyChecklistsForBusiness(businessId, { type: "opening" }, supabase),
      listIssuesForBusiness(businessId, {}, supabase),
      listEmployeeReadinessForBusiness(businessId, supabase),
    ])

    const { data: runRows, error: runErr } = await supabase
      .from("execution_records")
      .select("*")
      .eq("business_id", businessId)
      .gte("started_at", since60Iso)
      .order("started_at", { ascending: false })
      .limit(500)

    const runs: Tables<"execution_records">[] = runErr || !runRows ? [] : (runRows as Tables<"execution_records">[])

    let snapshots: Tables<"handoff_score_snapshots">[] = []
    try {
      snapshots = await listRivetIndexSnapshotsLastDays(businessId, 21, supabase)
    } catch {
      snapshots = []
    }

    const ownerIds = new Set(profiles.filter((p) => profileIsOwner(p, business)).map((p) => p.id))
    const teamProfiles = profiles.filter((p) => !ownerIds.has(p.id))

    const columns = emptyColumns()
    const push = (bucket: ProofBucket, signal: ProofSignal) => {
      columns[bucket].push(signal)
    }

    const openingIds = new Set(openingChecklists.map((c) => c.id))
    const completedOpening = runs.filter(
      (r) => r.status === "completed" && openingIds.has(r.checklist_id)
    )
    const teamOpening = completedOpening.filter((r) => !ownerIds.has(r.employee_id))
    const ownerOpening = completedOpening.filter((r) => ownerIds.has(r.employee_id))

    if (openingChecklists.length === 0) {
      push("fragile", {
        id: "pot-opening-missing",
        title: "Opening not instrumented yet",
        body: "Without an opening checklist, Rivet cannot record whether someone besides you finished open successfully.",
        href: "/sops",
      })
    } else if (teamOpening.length >= 1) {
      push("transferred", {
        id: "pot-opening-team",
        title: "Opening completed without you",
        body: "At least one finished opening run was executed under a team profile—not owner credentials.",
        metric: `Last 60 days · ${teamOpening.length} team-led opening${teamOpening.length === 1 ? "" : "s"}`,
        href: "/sops",
      })
    } else if (ownerOpening.length >= 1) {
      push("owner_only", {
        id: "pot-opening-owner",
        title: "Opening still closes on owner credentials",
        body: "Completed opening runs in this window were all started under an owner profile. Shift who starts the run—or add leads—to surface execution proof off your credentials.",
        metric: `Last 60 days · ${ownerOpening.length} owner-led opening${ownerOpening.length === 1 ? "" : "s"}`,
        href: "/sops",
      })
    } else {
      const inProgOpening = runs.some(
        (r) => r.status === "in_progress" && openingIds.has(r.checklist_id)
      )
      push("fragile", {
        id: "pot-opening-none",
        title: inProgOpening
          ? "Opening started but not finished to proof"
          : "No completed opening runs in this window",
        body: inProgOpening
          ? "There is an in-progress opening run—finish it on the floor so completion shows up here."
          : "Complete at least one opening checklist run so transfer can be measured.",
        href: "/sops",
      })
    }

    const nonOwnerReadiness = readiness.filter((r) => !ownerIds.has(r.employee_id))
    const trainReady = nonOwnerReadiness.filter(
      (r) => r.train_others === "ready_with_support" || r.train_others === "fully_ready"
    )
    const trainLearning = nonOwnerReadiness.filter((r) => r.train_others === "learning")

    if (teamProfiles.length === 0) {
      push("fragile", {
        id: "pot-team-solo",
        title: "Team depth not visible yet",
        body: "Execution proof needs at least one non-owner profile on the workspace—otherwise every run and training signal still reads as you.",
        href: "/settings",
      })
    } else if (trainReady.length >= 1) {
      push("transferred", {
        id: "pot-train-others",
        title: "Someone besides you can train others",
        body: "At least one team member has cleared the “train others” readiness gate—knowledge is starting to move sideways, not only downward from you.",
        metric: `${trainReady.length} with train-others readiness`,
        href: "/training",
      })
    } else if (trainLearning.length >= 1) {
      push("fragile", {
        id: "pot-train-learning",
        title: "Train-the-trainer in motion",
        body: "Someone is marked as learning to train others, but the gate is not cleared yet—finish shadowing and sign-off so transfer is provable.",
        metric: `${trainLearning.length} learning`,
        href: "/training",
      })
    } else {
      push("owner_only", {
        id: "pot-train-none",
        title: "Training others still routes through you",
        body: "No team member has cleared train-others readiness. Until they do, onboarding and corrections still concentrate on the owner.",
        href: "/training",
      })
    }

    const dates14 = utcDatesLastDays(14)
    const ownerIssueDays = new Set(
      issues.filter((i) => i.owner_required).map((i) => i.created_at.slice(0, 10))
    )
    const completedRunDays = new Set(
      runs.filter((r) => r.status === "completed").map((r) => r.shift_date)
    )
    let cleanShiftDays = 0
    for (const d of dates14) {
      if (completedRunDays.has(d) && !ownerIssueDays.has(d)) cleanShiftDays++
    }

    if (cleanShiftDays >= 6) {
      push("transferred", {
        id: "pot-clean-shifts",
        title: "Shift days without new owner bottlenecks",
        body: "On several recent days the team finished execution records and did not open new owner-required bottlenecks—a credible “ran without you” signal.",
        metric: `Last 14 days · ${cleanShiftDays} clean shift days`,
        href: "/issues",
      })
    } else if (cleanShiftDays >= 1) {
      push("fragile", {
        id: "pot-clean-partial",
        title: "Some clean shift days—not a streak yet",
        body: "There are days with completed runs and no new owner-required issues logged the same day, but the pattern is not consistent yet.",
        metric: `Last 14 days · ${cleanShiftDays} clean shift day${cleanShiftDays === 1 ? "" : "s"}`,
        href: "/sops",
      })
    } else if (completedRunDays.size > 0) {
      push("fragile", {
        id: "pot-clean-none",
        title: "Execution days still overlap owner interrupts",
        body: "Most recent days with completed runs also saw new owner-required bottlenecks logged—tighten standards and clear bottlenecks to widen quiet days.",
        href: "/issues",
      })
    } else {
      push("fragile", {
        id: "pot-no-runs",
        title: "No completed runs in the last two weeks",
        body: "Without completed daily execution, there is no shift-level proof to pair against what still routes back to you.",
        href: "/sops",
      })
    }

    const complaints = issues.filter((i) => i.category === "customer_complaint")
    const resolvedTeamComplaints = complaints.filter(
      (i) => i.status === "resolved" && !i.owner_required
    )
    const complaintsNeedingOwner = complaints.filter(
      (i) => i.owner_required && isIssueUnresolved(i.status)
    )

    if (resolvedTeamComplaints.length >= 1) {
      push("transferred", {
        id: "pot-complaints-resolved",
        title: "Complaints resolved without owner-required flag",
        body: "Logged customer complaints reached resolved status while staying out of the owner-required lane—recovery stayed on the floor.",
        metric: `${resolvedTeamComplaints.length} resolved in team lane (all time in view)`,
        href: "/issues",
      })
    }

    const ownerBottlenecks = issues.filter(
      (i) => i.owner_required && isIssueUnresolved(i.status)
    )

    if (ownerBottlenecks.length >= 1) {
      const complaintCount = complaintsNeedingOwner.length
      const title =
        complaintCount > 0 ? "Guest complaints and bottlenecks still route to you" : "Owner-required bottlenecks still open"
      const body =
        complaintCount > 0
          ? "Some open items are customer complaints marked owner-required; others may be equipment or judgment calls—either way, recovery is not fully off your plate yet."
          : "Operational items flagged for owner attention are still open—delegation is not complete for those paths."
      push("owner_only", {
        id: "pot-owner-bottlenecks",
        title,
        body,
        metric: `${ownerBottlenecks.length} open · owner-required`,
        href: "/issues",
      })
    } else if (resolvedTeamComplaints.length === 0 && complaints.length === 0) {
      push("fragile", {
        id: "pot-complaints-none",
        title: "No complaint issues in the log yet",
        body: "When complaints are logged as bottlenecks, Rivet will show whether they close without owner escalation.",
        href: "/issues",
      })
    }

    const recentSnaps = snapshots.filter((s) => dates14.includes(s.snapshot_date))
    const pqScores = recentSnaps
      .map((s) => scoreFromCategorySnap(s.category_scores, "product_quality"))
      .filter((n): n is number => n != null)

    if (pqScores.length >= 5) {
      const sd = stdev(pqScores)
      if (sd <= 12) {
        push("newly_stable", {
          id: "pot-quality-band",
          title: "Quality load steady in recent snapshots",
          body: "Product quality dependency in your Rivet Index history stayed in a tight band—less whiplash day to day while you step in and out.",
          metric: `14-day window · σ ≈ ${sd.toFixed(1)} pts`,
          href: "/dashboard",
        })
      } else if (sd >= 18) {
        push("fragile", {
          id: "pot-quality-swing",
          title: "Quality signal swinging in snapshots",
          body: "Product quality load is moving a lot in recent score history—expect visible variance on the floor until standards and training catch up.",
          metric: `14-day window · σ ≈ ${sd.toFixed(1)} pts`,
          href: "/dashboard",
        })
      }
    }

    const depSeries = snapshots
      .filter((s) => dates14.includes(s.snapshot_date))
      .sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date))
      .map((s) => Number(s.dependency_score))
      .filter((n) => !Number.isNaN(n))

    if (depSeries.length >= 8) {
      const mid = Math.floor(depSeries.length / 2)
      const first = mean(depSeries.slice(0, mid))
      const second = mean(depSeries.slice(mid))
      if (first - second >= 3) {
        push("newly_stable", {
          id: "pot-dep-trend",
          title: "Overall dependency eased recently",
          body: "Your Rivet Index dependency read averaged lower in the more recent half of the window—systems and people are absorbing more load.",
          metric: "Snapshot trend · last 14 days",
          href: "/dashboard",
        })
      }
    }

    const bucketCounts: ProofOfTransferView["bucketCounts"] = {
      transferred: columns.transferred.length,
      fragile: columns.fragile.length,
      owner_only: columns.owner_only.length,
      newly_stable: columns.newly_stable.length,
    }

    const total = bucketCounts.transferred + bucketCounts.fragile + bucketCounts.owner_only + bucketCounts.newly_stable
    if (total === 0) {
      return {
        source: "live",
        headline: COPY.proofPage.title,
        promise: PROMISE,
        bucketCounts,
        columns: emptyColumns(),
      }
    }

    return {
      source: "live",
      headline: "Proof of Transfer",
      promise: PROMISE,
      bucketCounts,
      columns,
    }
  } catch {
    return proofOfTransferUnlinkedView()
  }
}
