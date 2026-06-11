# Pasti a antivzory

## Ecomail API

- **`recepient_lists` je překlep přímo v Ecomail API** (POST /campaigns).
  Neopravovat na „recipient" — přestalo by to fungovat.
- Odeslání kampaně je **GET** `/campaign/{id}/send` (singulár!), zatímco
  vytvoření je POST `/campaigns` (plurál). Podle API blueprintu na Apiary.
- Auth header se jmenuje doslova `key` (ne Authorization).
- **Transakční e-maily (`/transactional/send-message`) vyžadují placený účet
  a ověřenou doménu** — ověřeno 2026-06-11, API vrací 422 „Only for paid
  accounts and verified domains". Na současném free účtu s gmail odesílatelem
  **e-maily z rezervací nefungují** — formulář hostovi vrátí hlášku
  „zavolejte nám", rezervace se ale uloží do Blobs (klíče `reservation:*`).
  Řešení čeká na rozhodnutí (doména+placený plán / přehled rezervací
  v adminu / jiný kanál).
- Subscribe přes API ověřeno, funguje (200, `already_subscribed` u známých
  kontaktů — kontakty jsou sdílené napříč účtem, status per seznam).
- **NEOVĚŘENO V PRAXI**: tvar odpovědi POST /campaigns (bereme `created.id`)
  a merge tag `*|UNSUB|*` — ověřit při prvním odeslání newsletteru.
- Odesílatel je gmail adresa → bez SPF/DKIM hrozí spam folder. Pro ostrý
  provoz pořídit doménu a ověřit ji v Ecomailu (Nastavení → Domény).
- V účtu je i cizí seznam ID 1 („Dobrý důvod") — patří jinému projektu.

## Netlify

- **`netlify env:set --context` s čárkami NEFUNGUJE**: CLI vezme
  `--context production,deploy-preview` jako název custom větve a proměnná
  skončí v kontextu `branch` — produkce ji nevidí a funkce padají na chybějící
  env. Flag se musí opakovat: `--context production --context deploy-preview`.
  Ověřit po nastavení přes `netlify api getEnvVar` (pole `values[].context`).
- Změna env proměnné se do funkcí dostane **až s novým deployem** — env se
  injektuje při nasazení, ne za běhu.
- **Blobs v `netlify dev` vrací z `list()` percent-encoded klíče**
  (`reservation%3A…` místo `reservation:…`) — prefix filtr na `:` lokálně
  selže. Klíče z listu vždy prohnat `decodeURIComponent` (v produkci
  neškodné, naše klíče neobsahují `%`). `get()`/`set()` fungují s čistými
  klíči správně v obou prostředích.

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
