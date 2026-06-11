# Changelog

## 2026-06-11 (noc)

- Newsletter odblokován: odesílatel přepnut na ověřenou doménu
  novinky.dobry-duvod.cz (`FROM_EMAIL=zastavka@novinky.dobry-duvod.cz`),
  reply-to nově míří na RESERVATION_EMAIL (skutečná schránka).

## 2026-06-11 (pozdě večer)

- Zjištěno: i kampaně Ecomailu vyžadují ověřenou doménu (`unverified-domain`)
  → newsletter pojede až s doménou; kód ověřen po krok odeslání.
- Rezervace předělány: e-mailová notifikace přes Netlify Forms (skrytý form
  „rezervace"), primární úložiště Blobs, nový tab Rezervace v adminu
  (přehled + mazání vyřízených). Endpoint `/api/admin/reservations`.
- Oprava: Blobs `list()` v netlify dev vrací percent-encoded klíče.

## 2026-06-11 (večer)

- Nasazena první verze na https://zastavka-web.netlify.app, naplněna ukázkovým
  menu (den 2026-06-11 + stálý lístek).
- Nastaven `ECOMAIL_API_KEY` (pozor na past s `--context`, viz GOTCHAS).
- Ověřeno: admin auth, zápis menu + okamžitý purge cache, subscribe do
  Ecomail seznamů.
- Zjištěno: transakční e-maily vyžadují placený Ecomail účet s ověřenou
  doménou → rezervace zatím bez e-mailových notifikací (ukládají se do Blobs).

## 2026-06-11

- Založen projekt: Astro 6 + Preact, Netlify Functions + Blobs, Ecomail.
- Kompletní první verze: jednostránkový web (hero, denní menu, stálý lístek,
  o nás, newsletter, rezervace, kontakt), admin panel (editace dnů, drag &
  drop, kopírování, dostupnost, poznámka, odkaz na stálý lístek, odeslání
  newsletteru), tisková verze `/tisk`.
- Vytvořeny Ecomail seznamy: 5 (polední), 6 (víkendové), 7 (novinky).
- Repo `stipekp/zastavka-web`, napojeno na Netlify (auto-deploy z `main`).
- Netlify sajta `zastavka-web` vytvořena přes CLI (MCP konektor má mrtvý
  token), env proměnné nastaveny — chybí jen `ECOMAIL_API_KEY`.
