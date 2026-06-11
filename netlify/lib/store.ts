import { getStore } from "@netlify/blobs";
import type { DayDoc, MenuGroup, StaticMenuDoc } from "../../src/lib/types";
import { menuTypesForDate } from "../../src/lib/menu-time";

export const store = () => getStore("zastavka");

export const dayKey = (date: string) => `day:${date}`;
export const STATIC_KEY = "static-menu";

function defaultGroups(): MenuGroup[] {
  return ["Polévky", "Hlavní chody", "Dezerty"].map((name) => ({
    id: crypto.randomUUID(),
    name,
    items: [],
  }));
}

/** Nový den dostane předvyplněné prázdné skupiny, ať obsluha nezačíná na nule. */
export function emptyDay(date: string): DayDoc {
  const menus: DayDoc["menus"] = {};
  for (const type of menuTypesForDate(date)) menus[type] = defaultGroups();
  return { date, menus, note: "", showStaticLink: true };
}

export async function getDayRaw(date: string): Promise<DayDoc | null> {
  return (await store().get(dayKey(date), { type: "json" })) as DayDoc | null;
}

export async function getDay(date: string): Promise<DayDoc> {
  return (await getDayRaw(date)) ?? emptyDay(date);
}

export async function getStaticMenu(): Promise<StaticMenuDoc> {
  const doc = (await store().get(STATIC_KEY, { type: "json" })) as StaticMenuDoc | null;
  return doc ?? { groups: [] };
}

/** Jen dostupné položky a neprázdné skupiny — pro veřejný web, e-mail a tisk. */
export function availableOnly(groups: MenuGroup[]): MenuGroup[] {
  return groups
    .map((g) => ({ ...g, items: g.items.filter((i) => i.available) }))
    .filter((g) => g.items.length > 0);
}
