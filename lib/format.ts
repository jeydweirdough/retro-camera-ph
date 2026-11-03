const dateTime = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
  // Always Philippine time, whatever timezone the server runs in.
  timeZone: "Asia/Manila",
});

/** "Nov 2, 2026, 1:15 PM" in Philippine time. */
export function formatDateTime(date: Date) {
  return dateTime.format(date);
}

/** 0.2345 → "23.5%"; null (nothing to divide by) → "—". */
export function formatPercent(ratio: number | null) {
  return ratio === null ? "—" : `${(ratio * 100).toFixed(1)}%`;
}
