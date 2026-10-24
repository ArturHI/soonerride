const DAY = 24 * 60 * 60 * 1000;

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function dayLabel(date: Date) {
  const diff = Math.round((startOfDay(date).getTime() - startOfDay(new Date()).getTime()) / DAY);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff > 1 && diff < 7) return date.toLocaleDateString("en-US", { weekday: "long" });
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function timeLabel(date: Date) {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function when(iso: string) {
  const d = new Date(iso);
  return `${dayLabel(d)} · ${timeLabel(d)}`;
}

export function fullDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

export function ymdLabel(ymd: string) {
  return dayLabel(new Date(ymd + "T12:00"));
}

export function price(p: number | null) {
  return p ? `$${p}` : "Free";
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("");
}

export function firstName(name: string) {
  return name.split(" ")[0];
}

export function todayYMD() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Approximate one-way road miles from Norman for common destinations.
export const DESTINATIONS: { name: string; match: RegExp; miles: number }[] = [
  { name: "OKC Airport", match: /okc airport|will rogers/i, miles: 25 },
  { name: "Oklahoma City", match: /okc|oklahoma city/i, miles: 20 },
  { name: "Lawton", match: /lawton/i, miles: 65 },
  { name: "Ardmore", match: /ardmore/i, miles: 75 },
  { name: "Stillwater", match: /stillwater/i, miles: 85 },
  { name: "Tulsa", match: /tulsa/i, miles: 130 },
  { name: "DFW Airport", match: /dfw/i, miles: 185 },
  { name: "Dallas", match: /dallas|arlington/i, miles: 190 },
  { name: "Fort Worth", match: /fort worth/i, miles: 190 },
  { name: "Wichita", match: /wichita/i, miles: 180 },
  { name: "Kansas City", match: /kansas city/i, miles: 360 },
  { name: "Little Rock", match: /little rock/i, miles: 350 },
  { name: "Austin", match: /austin/i, miles: 385 },
  { name: "Houston", match: /houston/i, miles: 430 },
  { name: "San Antonio", match: /san antonio/i, miles: 460 },
];

export function milesTo(to: string): number | undefined {
  return DESTINATIONS.find((d) => d.match.test(to))?.miles;
}

/** Trips at least this long may ask riders for a gas share. Shorter rides are always free. */
export const LONG_TRIP_MILES = 100;
const GAS_PRICE = 3.1; // $/gallon
const MPG = 28;

/** Suggested gas share per seat: fuel cost split evenly between the driver and every seat. */
export function gasEstimate(miles: number, seats: number) {
  return Math.max(1, Math.round(((miles / MPG) * GAS_PRICE) / (seats + 1)));
}

/** Prices this far above the estimate are labeled for riders and need a reason. */
export const ABOVE_ESTIMATE = 1.25;

export function driveMinutes(miles: number) {
  return Math.round(miles * 0.95 + 5);
}

export function duration(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? (m ? `${h} hr ${m} min` : `${h} hr`) : `${m} min`;
}

export function arrival(iso: string, miles: number) {
  return new Date(new Date(iso).getTime() + driveMinutes(miles) * 60 * 1000).toISOString();
}
