import type { Config } from "@netlify/functions";
import { json, err } from "../lib/http";
import { isAdmin } from "../lib/auth";
import { store } from "../lib/store";
import type { ReservationDoc } from "../../src/lib/types";

export default async (req: Request): Promise<Response> => {
  if (!isAdmin(req)) return err("Nepřihlášeno.", 401);

  if (req.method === "GET") {
    const s = store();
    const all = await s.list();
    // Lokální emulace Blobs (netlify dev) vrací klíče percent-encoded — dekódujeme
    // vždy, v produkci je decode na čistém klíči neškodný. Viz docs/GOTCHAS.md.
    // Klíč začíná `reservation:{date}T{time}` → řazení podle klíče = podle termínu.
    const keys = all.blobs
      .map((b) => decodeURIComponent(b.key))
      .filter((k) => k.startsWith("reservation:"))
      .sort()
      .slice(-200);
    const items = await Promise.all(
      keys.map(async (key) => ({ key, ...(await s.get(key, { type: "json" })) as ReservationDoc }))
    );
    return json({ reservations: items });
  }

  if (req.method === "DELETE") {
    const key = new URL(req.url).searchParams.get("key") ?? "";
    if (!key.startsWith("reservation:")) return err("Neplatný klíč.");
    await store().delete(key);
    return json({ ok: true });
  }

  return err("Method not allowed", 405);
};

export const config: Config = { path: "/api/admin/reservations" };
