/**
 * All schedule math runs in Europe/Madrid, regardless of the device clock's zone.
 */
export const MADRID_TZ = "Europe/Madrid";

export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7; // ISO: 1 = Monday

export interface MadridNow {
  weekday: Weekday;
  minutes: number; // minutes since 00:00 Madrid time
  hh: number;
  mm: number;
}

const WEEKDAY_MAP: Record<string, Weekday> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

export function madridNow(date: Date = new Date()): MadridNow {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: MADRID_TZ,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "0";
  const hh = Number(get("hour"));
  const mm = Number(get("minute"));
  return { weekday: WEEKDAY_MAP[get("weekday")] ?? 1, hh, mm, minutes: hh * 60 + mm };
}

export function madridClock(date: Date, lang: "es" | "en"): string {
  return new Intl.DateTimeFormat(lang === "es" ? "es-ES" : "en-GB", {
    timeZone: MADRID_TZ,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function madridDate(date: Date, lang: "es" | "en"): string {
  return new Intl.DateTimeFormat(lang === "es" ? "es-ES" : "en-GB", {
    timeZone: MADRID_TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export interface Slot { day: Weekday; open: string; close: string }

export type OpenState =
  | { kind: "open"; closesAt: string; minutesLeft: number }
  | { kind: "later-today"; opensAt: string; minutesUntil: number }
  | { kind: "future"; day: Weekday; opensAt: string; daysAhead: number }
  | { kind: "none" };

export function openState(slots: Slot[], now: MadridNow = madridNow()): OpenState {
  const today = slots.filter((s) => s.day === now.weekday).sort((a, b) => toMin(a.open) - toMin(b.open));
  for (const s of today) {
    const o = toMin(s.open), c = toMin(s.close);
    if (now.minutes >= o && now.minutes < c) return { kind: "open", closesAt: s.close, minutesLeft: c - now.minutes };
  }
  const nextToday = today.find((s) => toMin(s.open) > now.minutes);
  if (nextToday) return { kind: "later-today", opensAt: nextToday.open, minutesUntil: toMin(nextToday.open) - now.minutes };
  for (let i = 1; i <= 7; i++) {
    const d = (((now.weekday - 1 + i) % 7) + 1) as Weekday;
    const first = slots.filter((s) => s.day === d).sort((a, b) => toMin(a.open) - toMin(b.open))[0];
    if (first) return { kind: "future", day: d, opensAt: first.open, daysAhead: i };
  }
  return { kind: "none" };
}

/** Sort key: open first (closing soonest last), then soonest to open. */
export function openSortKey(st: OpenState): number {
  switch (st.kind) {
    case "open": return -10000;
    case "later-today": return st.minutesUntil;
    case "future": return st.daysAhead * 1440 + toMin(st.opensAt);
    default: return 1e9;
  }
}
