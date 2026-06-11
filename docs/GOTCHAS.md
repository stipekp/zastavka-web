# Pasti a antivzory

## Ecomail API

- **`recepient_lists` je překlep přímo v Ecomail API** (POST /campaigns).
  Neopravovat na „recipient" — přestalo by to fungovat.
- Odeslání kampaně je **GET** `/campaign/{id}/send` (singulár!), zatímco
  vytvoření je POST `/campaigns` (plurál). Podle API blueprintu na Apiary.
- Auth header se jmenuje doslova `key` (ne Authorization).
- **NEOVĚŘENO V PRAXI** (čeká na první ostré odeslání): přesný tvar odpovědi
  POST /campaigns (bereme `created.id`), merge tag `*|UNSUB|*` v patičce
  e-mailu, tvar `/transactional/send-message`. Až se pošle první newsletter
  a rezervace, ověřit a tenhle bod smazat/aktualizovat.
- Odesílatel je gmail adresa → bez SPF/DKIM hrozí spam folder. Pro ostrý
  provoz pořídit doménu a ověřit ji v Ecomailu (Nastavení → Domény).
- V účtu je i cizí seznam ID 1 („Dobrý důvod") — patří jinému projektu.

## Netlify

- `purgeCache` funguje jen v nasazených funkcích (lokálně selže) — proto je
  v admin funkcích, ne v buildu.
- Blobs lokálně fungují jen přes `npx netlify dev` na nalinkovaném projektu
  (`npx netlify link`). Čistý `npm run dev` = web bez /api.
- Sdílený serverový kód patří do `netlify/lib/`, NE do `netlify/functions/`
  — co je ve functions adresáři, Netlify zkouší nasadit jako funkci.
- Hlavička pro CDN cache je `Netlify-CDN-Cache-Control` a tag
  `Netlify-Cache-Tag` — obyčejný `Cache-Control` ovlivňuje i prohlížeč
  (ten necachovat, jinak purge nepomůže).

## Build a TypeScript

- `npm run build` **nedělá typovou kontrolu** TSX/TS — vždy spustit i
  `npx tsc --noEmit`.
- TypeScript 6 nenačítá `@types/*` automaticky — v tsconfig musí být
  `"types": ["node"]`. Bez toho TS2591 na `process`/`Buffer`.

## Frontend

- SortableJS + Preact: po dotažení se DOM **vrací do původního pořadí**
  a změnu dělá jen stav (viz `src/islands/admin/sortable.ts`). Bez revertu
  se virtuální DOM popere se skutečným a položky se duplikují.
- Ostrovy na hlavní stránce sdílí jeden fetch `/api/menu` přes modulový
  singleton (`src/islands/api.ts`) — nepřidávat vlastní fetch do ostrovů.
- Datum „dnes" pro admin se počítá v zóně Europe/Prague
  (`Intl.DateTimeFormat("en-CA", …)`), ne `toISOString()` — to je UTC
  a po půlnoci by ukazovalo včerejšek.

## Antispam

- Server na honeypot/rychlé odeslání odpovídá `{ok: true}` — to je záměr
  (bot se nesmí dozvědět, že byl odhalen). Nepřepisovat na chybu.
- Kdyby spam přerostl: Cloudflare Turnstile, ne reCAPTCHA (GDPR, UX).
