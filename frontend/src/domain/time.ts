// Simulated-clock helpers (research R3). Instants are "YYYY-MM-DDTHH:MM" strings, compared
// lexicographically and converted to milliseconds as UTC so no device timezone is involved.
import type { Instant } from "./types";

const toMs = (t: Instant): number => Date.parse(`${t}:00Z`);
const fromMs = (ms: number): Instant => new Date(ms).toISOString().slice(0, 16);

export function atTime(day: string, hhmm: string): Instant {
  return `${day}T${hhmm}`;
}

export function addMinutes(t: Instant, minutes: number): Instant {
  return fromMs(toMs(t) + minutes * 60_000);
}

/** Minutes from `a` to `b` (positive when b is later). */
export function minutesBetween(a: Instant, b: Instant): number {
  return (toMs(b) - toMs(a)) / 60_000;
}

export function formatHHMM(t: Instant): string {
  return t.slice(11, 16);
}

export function dayOf(t: Instant): string {
  return t.slice(0, 10);
}

export function isSameDay(a: Instant, b: Instant): boolean {
  return dayOf(a) === dayOf(b);
}

export function nextDay(day: string): string {
  return dayOf(addMinutes(atTime(day, "00:00"), 24 * 60));
}

/** "today 08:04", "yesterday 20:00" or "2026-11-12 20:00", relative to `now`. */
export function describeRelative(t: Instant, now: Instant): string {
  if (isSameDay(t, now)) return `today ${formatHHMM(t)}`;
  if (nextDay(dayOf(t)) === dayOf(now)) return `yesterday ${formatHHMM(t)}`;
  return `${dayOf(t)} ${formatHHMM(t)}`;
}
