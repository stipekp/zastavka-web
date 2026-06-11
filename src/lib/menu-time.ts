import type { MenuType } from "./types";

const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** Aktuální datum/čas v Europe/Prague — nikdy nespoléháme na lokální zónu serveru ani prohlížeče. */
export function pragueNow(d: Date = new Date()): { date: string; weekday: number; minutes: number } {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Prague",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hour12: false,
  });
  const p = Object.fromEntries(fmt.formatToParts(d).map((x) => [x.type, x.value]));
  const hour = p.hour === "24" ? 0 : Number(p.hour);
  return {
    date: `${p.year}-${p.month}-${p.day}`,
    weekday: WEEKDAYS[p.weekday] ?? 0,
    minutes: hour * 60 + Number(p.minute),
  };
}

export function weekdayOf(dateStr: string): number {
  return new Date(`${dateStr}T12:00:00Z`).getUTCDay();
}

export function isWeekend(dateStr: string): boolean {
  const wd = weekdayOf(dateStr);
  return wd === 0 || wd === 6;
}

/** Které typy menu daný den vůbec připadají v úvahu (pro admin i web). */
export function menuTypesForDate(dateStr: string): MenuType[] {
  return isWeekend(dateStr) ? ["weekend"] : ["lunch", "afternoon"];
}

/** Pracovní dny: do 15.00 polední, pak odpolední. Víkend: víkendové. */
export function activeMenuType(weekday: number, minutes: number): MenuType {
  if (weekday === 0 || weekday === 6) return "weekend";
  return minutes < 15 * 60 ? "lunch" : "afternoon";
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** „čtvrtek 11. června" */
export function czDateLabel(dateStr: string): string {
  return new Intl.DateTimeFormat("cs-CZ", {
    timeZone: "Europe/Prague",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${dateStr}T12:00:00Z`));
}
