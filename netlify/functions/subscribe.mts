import type { Config } from "@netlify/functions";
import { json, err, readJson } from "../lib/http";
import { subscribeToList } from "../lib/ecomail";

type Topic = "lunch" | "weekend" | "news";

const LIST_ENV: Record<Topic, string> = {
  lunch: "ECOMAIL_LIST_LUNCH",
  weekend: "ECOMAIL_LIST_WEEKEND",
  news: "ECOMAIL_LIST_NEWS",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async (req: Request): Promise<Response> => {
  if (req.method !== "POST") return err("Method not allowed", 405);

  const body = await readJson<{ email?: string; topics?: Topic[]; website?: string; t?: number }>(req);
  if (!body) return err("Neplatný požadavek.");

  // Honeypot + příliš rychlé odeslání → tváříme se, že vše prošlo (bot nic nepozná)
  if (body.website || (typeof body.t === "number" && Date.now() - body.t < 3000)) {
    return json({ ok: true });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return err("Zadejte prosím platný e-mail.");

  const topics = (body.topics ?? []).filter((t): t is Topic => t in LIST_ENV);
  if (topics.length === 0) return err("Vyberte prosím alespoň jeden okruh.");

  try {
    for (const topic of topics) {
      const listId = process.env[LIST_ENV[topic]];
      if (!listId) throw new Error(`Chybí env proměnná ${LIST_ENV[topic]}`);
      await subscribeToList(listId, email);
    }
  } catch (e) {
    console.error("subscribe failed:", e);
    return err("Přihlášení se nepovedlo, zkuste to prosím za chvíli.", 502);
  }

  return json({ ok: true });
};

export const config: Config = { path: "/api/subscribe" };
