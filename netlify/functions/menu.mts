import type { Config } from "@netlify/functions";
import { json } from "../lib/http";
import { getDayRaw, getStaticMenu, availableOnly } from "../lib/store";
import { pragueNow, activeMenuType, czDateLabel } from "../../src/lib/menu-time";
import { MENU_TYPE_LABELS, type PublicMenuResponse } from "../../src/lib/types";

export default async (): Promise<Response> => {
  const now = pragueNow();
  const type = activeMenuType(now.weekday, now.minutes);
  const day = await getDayRaw(now.date);

  let active: PublicMenuResponse["active"] = null;
  const rawGroups = day?.menus?.[type];
  if (day && rawGroups) {
    const groups = availableOnly(rawGroups);
    if (groups.length > 0) {
      active = {
        type,
        label: MENU_TYPE_LABELS[type],
        dateLabel: czDateLabel(now.date),
        groups,
        note: day.note ?? "",
        showStaticLink: day.showStaticLink ?? true,
      };
    }
  }

  const staticMenu = await getStaticMenu();
  const body: PublicMenuResponse = { now: { date: now.date, minutes: now.minutes }, active, staticMenu };

  return json(body, 200, {
    "Cache-Control": "public, max-age=0, must-revalidate",
    "Netlify-CDN-Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
    "Netlify-Cache-Tag": "menu",
  });
};

export const config: Config = { path: "/api/menu" };
