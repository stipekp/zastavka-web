import { purgeCache, type Config } from "@netlify/functions";
import { json, err, readJson } from "../lib/http";
import { isAdmin } from "../lib/auth";
import { store, getStaticMenu, STATIC_KEY } from "../lib/store";
import type { StaticMenuDoc } from "../../src/lib/types";

export default async (req: Request): Promise<Response> => {
  if (!isAdmin(req)) return err("Nepřihlášeno.", 401);

  if (req.method === "GET") {
    return json(await getStaticMenu());
  }

  if (req.method === "PUT") {
    const doc = await readJson<StaticMenuDoc>(req);
    if (!doc || !Array.isArray(doc.groups)) return err("Neplatná data lístku.");
    await store().setJSON(STATIC_KEY, doc);
    await purgeCache({ tags: ["menu"] });
    return json({ ok: true });
  }

  return err("Method not allowed", 405);
};

export const config: Config = { path: "/api/admin/static-menu" };
