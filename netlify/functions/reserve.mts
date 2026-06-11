import type { Config } from "@netlify/functions";
import { json, err, readJson } from "../lib/http";
import { store } from "../lib/store";
import type { ReservationDoc } from "../../src/lib/types";

interface ReservationBody {
  name?: string;
  phone?: string;
  email?: string;
  date?: string;
  time?: string;
  guests?: number;
  note?: string;
  website?: string;
  t?: number;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Notifikace jde přes Netlify Forms (form „rezervace" registrovaný skrytým
 * formulářem na hlavní stránce) — e-mail obsluze posílá Netlify. Transakční
 * e-maily Ecomailu vyžadují placený účet s doménou, viz docs/GOTCHAS.md.
 */
async function submitToNetlifyForms(r: ReservationDoc): Promise<void> {
  const siteUrl = process.env.URL;
  if (!siteUrl) throw new Error("Chybí env proměnná URL");
  const body = new URLSearchParams({
    "form-name": "rezervace",
    name: r.name,
    phone: r.phone,
    email: r.email,
    date: r.date,
    time: r.time,
    guests: String(r.guests),
    note: r.note,
  });
  const res = await fetch(`${siteUrl}/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) throw new Error(`Netlify Forms → ${res.status}`);
}

export default async (req: Request): Promise<Response> => {
  if (req.method !== "POST") return err("Method not allowed", 405);

  const b = await readJson<ReservationBody>(req);
  if (!b) return err("Neplatný požadavek.");
  if (b.website || (typeof b.t === "number" && Date.now() - b.t < 3000)) return json({ ok: true });

  const name = (b.name ?? "").trim();
  const phone = (b.phone ?? "").trim();
  const email = (b.email ?? "").trim().toLowerCase();
  const guests = Number(b.guests);

  if (name.length < 2) return err("Vyplňte prosím jméno.");
  if (phone.replace(/\D/g, "").length < 9) return err("Vyplňte prosím platný telefon.");
  if (!EMAIL_RE.test(email)) return err("Vyplňte prosím platný e-mail.");
  if (!DATE_RE.test(b.date ?? "")) return err("Vyberte prosím datum.");
  if (!TIME_RE.test(b.time ?? "")) return err("Vyberte prosím čas.");
  if (!Number.isInteger(guests) || guests < 1) return err("Vyberte prosím počet hostů.");
  if (guests > 7) return err("Skupiny od 8 osob řešíme po telefonu — zavolejte nám prosím na +420 311 678 432.");

  const reservation: ReservationDoc = {
    name,
    phone,
    email,
    date: b.date!,
    time: b.time!,
    guests,
    note: (b.note ?? "").trim().slice(0, 500),
    createdAt: new Date().toISOString(),
  };

  // Primární úložiště — rezervace se zobrazují v adminu
  await store().setJSON(`reservation:${reservation.date}T${reservation.time}:${crypto.randomUUID()}`, reservation);

  // E-mailová notifikace je best-effort; rezervace už je uložená
  try {
    await submitToNetlifyForms(reservation);
  } catch (e) {
    console.error("forms notification failed:", e);
  }

  return json({ ok: true });
};

export const config: Config = { path: "/api/reserve" };
