// Weekly circles: which dates a repeating ride happens on.

import type { Circle } from "./types";

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
// Shown Monday-first in pickers.
export const PICKER_DAYS = [1, 2, 3, 4, 5, 6, 0];

const pad = (n: number) => String(n).padStart(2, "0");
export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

type Schedule = Pick<Circle, "date" | "days" | "time" | "endDate">;

/** Next `count` ride times on or after `from`, within the circle's start and end dates. */
export function occurrences(s: Schedule, count: number, from = new Date()): Date[] {
  if (!s.days?.length || !s.time) return [];
  const [h, m] = s.time.split(":").map(Number);
  const start = new Date(s.date + "T00:00");
  const end = s.endDate ? new Date(s.endDate + "T23:59") : null;
  const d = new Date(Math.max(start.getTime(), from.getTime()));
  d.setHours(0, 0, 0, 0);
  const out: Date[] = [];
  for (let i = 0; i < 400 && out.length < count; i++, d.setDate(d.getDate() + 1)) {
    if (end && d > end) break;
    if (!s.days.includes(d.getDay())) continue;
    const at = new Date(d);
    at.setHours(h, m, 0, 0);
    // Still list today's ride until an hour after it leaves.
    if (at.getTime() > from.getTime() - 60 * 60 * 1000) out.push(at);
  }
  return out;
}

export function isOver(s: Schedule) {
  return occurrences(s, 1).length === 0;
}

function clock(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/** "Every Mon, Wed · 8:40 AM" */
export function scheduleLabel(s: Pick<Circle, "days" | "time">) {
  if (!s.days?.length || !s.time) return "";
  const days = [...s.days].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
  const names = days.join() === "1,2,3,4,5" ? "weekday" : days.map((d) => WEEKDAYS[d]).join(", ");
  return `Every ${names} · ${clock(s.time)}`;
}

export function returnLabel(s: Pick<Circle, "returnTime">) {
  return s.returnTime ? `back at ${clock(s.returnTime)}` : "";
}

/** A rough end of the current OU semester, used as the default end date. */
export function semesterEnd(now = new Date()) {
  const y = now.getFullYear();
  const m = now.getMonth();
  if (m <= 4) return `${y}-05-08`;
  if (m <= 6) return `${y}-07-31`;
  return `${y}-12-11`;
}

export function shortDate(d: Date | string) {
  const x = typeof d === "string" ? new Date(d + "T12:00") : d;
  return x.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}
