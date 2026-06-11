import { purgeCache, type Config } from "@netlify/functions";
import { json, err, readJson } from "../lib/http";
import { isAdmin } from "../lib/auth";
import { store, dayKey, getDay } from "../lib/store";
import type { DayDoc } from "../../src/lib/types";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async (req: Request): Promise<Response> => {
  if (!isAdmin(req)) return err("Nepřihlášeno.", 401);

  if (req.method === "GET") {
    const date = new URL(req.url).searchParams.get("date") ?? "";
    if (!DATE_RE.test(date)) return err("Neplatné datum.");
    return json(await getDay(date));
  }

  if (req.method === "PUT") {
    const doc = await readJson<DayDoc>(req);
    if (!doc || !DATE_RE.test(doc.date) || typeof doc.menus !== "object") {
      return err("Neplatná data menu.");
    }
    await store().setJSON(dayKey(doc.date), doc);
    await purgeCache({ tags: ["menu"] });
    return json({ ok: true });
  }

  return err("Method not allowed", 405);
};

export const config: Config = { path: "/api/admin/day" };
