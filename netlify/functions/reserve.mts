import type { Config } from "@netlify/functions";
import { json, err, readJson } from "../lib/http";
import { store } from "../lib/store";
import { sendTransactional } from "../lib/ecomail";
import { buildReservationEmails } from "../lib/email";
import { czDateLabel } from "../../src/lib/menu-time";

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

  const reservation = {
    name,
    phone,
    email,
    date: b.date!,
    time: b.time!,
    guests,
    note: (b.note ?? "").trim().slice(0, 500),
    createdAt: new Date().toISOString(),
  };

  // Záloha do Blobs — i kdyby e-mail selhal, rezervace se neztratí
  await store().setJSON(`reservation:${reservation.date}T${reservation.time}:${crypto.randomUUID()}`, reservation);

  const restaurantEmail = process.env.RESERVATION_EMAIL;
  if (!restaurantEmail) {
    console.error("Chybí env proměnná RESERVATION_EMAIL");
    return err("Rezervaci teď nejde odeslat — zavolejte nám prosím na +420 311 678 432.", 502);
  }

  const dateLabel = czDateLabel(reservation.date);
  const emails = buildReservationEmails({ ...reservation, dateLabel });

  try {
    await sendTransactional({
      to: restaurantEmail,
      subject: `Rezervace · ${dateLabel} ${reservation.time} · ${guests} os. · ${name}`,
      html: emails.forRestaurant,
      replyTo: email,
    });
  } catch (e) {
    console.error("reservation mail failed:", e);
    return err("Rezervaci se nepodařilo odeslat — zavolejte nám prosím na +420 311 678 432.", 502);
  }

  // Potvrzení hostovi je best-effort — rezervace už u nás je
  try {
    await sendTransactional({ to: email, subject: "Držíme vám místo · Zastávka", html: emails.forGuest });
  } catch (e) {
    console.error("guest confirmation failed:", e);
  }

  return json({ ok: true });
};

export const config: Config = { path: "/api/reserve" };
