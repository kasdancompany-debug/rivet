import type { ShiftSnapshot } from "@/lib/daily-ops/shift-snapshot"

export type StaffChecklistLine = {
  id: string
  text: string
  required_photo: boolean
}

export type StaffRunItem = {
  id: string
  checklist_item_id: string
  completed: boolean
  note: string | null
  photo_url: string | null
  completed_at: string | null
  completed_by: string | null
}

export type StaffChecklistPack = {
  checklistId: string
  title: string
  kind: "opening" | "closing"
  lines: StaffChecklistLine[]
  run: { id: string; status: string; notes: string | null } | null
  runItems: StaffRunItem[]
}

export function shiftSnapshotToStaffPack(
  snapshot: ShiftSnapshot | null,
  kind: "opening" | "closing"
): StaffChecklistPack | null {
  if (!snapshot) return null
  const lines = [...snapshot.checklist.daily_checklist_items]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((li) => ({
      id: li.id,
      text: li.text,
      required_photo: li.required_photo,
    }))
  return {
    checklistId: snapshot.checklist.id,
    title: snapshot.checklist.title,
    kind,
    lines,
    run: snapshot.run
      ? {
          id: snapshot.run.id,
          status: snapshot.run.status,
          notes: snapshot.run.notes,
        }
      : null,
    runItems: snapshot.items.map((i) => ({
      id: i.id,
      checklist_item_id: i.checklist_item_id,
      completed: i.completed,
      note: i.note,
      photo_url: i.photo_url,
      completed_at: i.completed_at,
      completed_by: i.completed_by,
    })),
  }
}
