import type { Config } from "@netlify/functions";
import { json, err, readJson } from "../lib/http";
import { isAdmin } from "../lib/auth";
import { getDayRaw, availableOnly } from "../lib/store";
import { sendCampaign } from "../lib/ecomail";
import { buildMenuEmail } from "../lib/email";
import { pragueNow, weekdayOf, addDays, czDateLabel, isWeekend } from "../../src/lib/menu-time";
import { MENU_TYPE_LABELS } from "../../src/lib/types";

/** Polední menu posíláme na dnešek; víkendové na nejbližší sobotu (v pátek ráno). */
function targetDate(type: "lunch" | "weekend", today: string): string {
  if (type === "lunch") return today;
  if (isWeekend(today)) return today;
  let d = today;
  while (weekdayOf(d) !== 6) d = addDays(d, 1);
  return d;
}

export default async (req: Request): Promise<Response> => {
  if (!isAdmin(req)) return err("Nepřihlášeno.", 401);
  if (req.method !== "POST") return err("Method not allowed", 405);

  const body = await readJson<{ type?: "lunch" | "weekend" }>(req);
  const type = body?.type;
  if (type !== "lunch" && type !== "weekend") return err("Neplatný typ newsletteru.");

  if (type === "lunch" && isWeekend(pragueNow().date)) {
    return err("Polední menu se o víkendu neposílá.");
  }

  const listId = process.env[type === "lunch" ? "ECOMAIL_LIST_LUNCH" : "ECOMAIL_LIST_WEEKEND"];
  if (!listId) return err("Chybí ID seznamu odběratelů v nastavení (env).", 500);

  const date = targetDate(type, pragueNow().date);
  const day = await getDayRaw(date);
  const groups = availableOnly(day?.menus?.[type] ?? []);
  if (groups.length === 0) {
    return err(`Menu pro ${czDateLabel(date)} je prázdné — nejdřív ho naplňte a uložte.`);
  }

  const label = MENU_TYPE_LABELS[type];
  const dateLabel = czDateLabel(date);
  const siteUrl = process.env.URL ?? "";
  const html = buildMenuEmail({ label, dateLabel, groups, note: day?.note ?? "", siteUrl });

  try {
    const campaignId = await sendCampaign({
      listId,
      title: `${label} ${date}`,
      subject: `${label} · ${dateLabel}`,
      html,
    });
    return json({ ok: true, campaignId, date, dateLabel });
  } catch (e) {
    console.error("newsletter failed:", e);
    return err("Odeslání se nepovedlo — zkuste to za chvíli, případně zkontrolujte Ecomail.", 502);
  }
};

export const config: Config = { path: "/api/admin/newsletter" };
