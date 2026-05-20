/** Calendar date in UTC (YYYY-MM-DD), aligned with `execution_records.shift_date` defaults. */
export function utcShiftDate(d = new Date()): string {
  return d.toISOString().slice(0, 10)
}
