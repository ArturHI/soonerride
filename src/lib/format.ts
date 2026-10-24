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

// Rough drive times from Norman, used for arrival estimates.
const DRIVE_MIN: [RegExp, number][] = [
  [/okc|oklahoma city|will rogers/i, 35],
  [/dfw/i, 190],
  [/dallas|arlington|fort worth/i, 185],
  [/tulsa/i, 130],
  [/austin/i, 360],
  [/houston/i, 420],
  [/stillwater/i, 85],
  [/wichita/i, 200],
];

export function driveMinutes(to: string) {
  return DRIVE_MIN.find(([re]) => re.test(to))?.[1] ?? 120;
}

export function duration(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? (m ? `${h} hr ${m} min` : `${h} hr`) : `${m} min`;
}

export function arrival(iso: string, to: string) {
  return new Date(new Date(iso).getTime() + driveMinutes(to) * 60 * 1000).toISOString();
}
