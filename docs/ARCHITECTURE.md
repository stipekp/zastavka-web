# Architektura

## Stack

- **Astro 6** — statický web, Preact ostrůvky (`@astrojs/preact`) jen pro interaktivní části
- **Netlify Functions v2** (`netlify/functions/*.mts`) — API pod `/api/*`
- **Netlify Blobs** (store `zastavka`) — úložiště menu a záloh rezervací; žádná databáze
- **Ecomail** — newsletter (kampaně) i transakční e-maily (rezervace)
- Fonty self-hostované přes `@fontsource` (Cormorant Garamond + Manrope)
- SortableJS — drag & drop v adminu

## Datový model (Netlify Blobs, store `zastavka`)

| Klíč | Obsah |
|---|---|
| `day:YYYY-MM-DD` | `DayDoc` — menu daného dne: `menus.lunch/afternoon` (všední den) nebo `menus.weekend` (víkend), `note`, `showStaticLink` |
| `static-menu` | `StaticMenuDoc` — stálý lístek (skupiny + položky) |
| `reservation:…` | záloha každé přijaté rezervace (kdyby selhal e-mail) |

Typy v `src/lib/types.ts` — sdílené mezi frontendem a funkcemi. Položka:
název, popis, cena, štítek (Doporučujeme/Vege/GF/Klasika/Signature), `available`.

## Logika času (src/lib/menu-time.ts)

Vše se počítá **serverově v zóně Europe/Prague** (`Intl.DateTimeFormat`),
nikdy podle hodin návštěvníka:

- Po–Pá do 15.00 → `lunch`, od 15.00 → `afternoon`
- So+Ne → `weekend`

## API

| Endpoint | Metody | Auth | Účel |
|---|---|---|---|
| `/api/menu` | GET | – | aktivní menu + stálý lístek (jen dostupné položky) |
| `/api/subscribe` | POST | – | přihlášení k odběru `{email, topics[], t}` |
| `/api/reserve` | POST | – | rezervace; 8+ hostů server odmítne s odkazem na telefon |
| `/api/admin/session` | GET/POST/DELETE | cookie | stav / login / logout |
| `/api/admin/day` | GET/PUT | cookie | čtení/zápis celého dne (PUT = celý dokument) |
| `/api/admin/static-menu` | GET/PUT | cookie | stálý lístek |
| `/api/admin/newsletter` | POST | cookie | sestaví e-mail z menu a odešle kampaň `{type: lunch|weekend}` |

## Cache — jak se změny dostanou na web „do pár sekund"

`/api/menu` se cachuje na Netlify CDN (`Netlify-CDN-Cache-Control: s-maxage=30,
stale-while-revalidate=60`) s tagem `menu`. Každý admin zápis volá
`purgeCache({tags:["menu"]})` → CDN cache spadne okamžitě. Přepnutí
poledne→odpoledne v 15.00 pokryje 30s expirace. Prohlížeč necachuje
(`max-age=0, must-revalidate`).

## Auth admina

Jedno heslo (`ADMIN_PASSWORD` env) → HttpOnly cookie `zast_admin` s HMAC
podpisem (`SESSION_SECRET` env), platnost 7 dní. Porovnání hesla přes HMAC
obou stran + `timingSafeEqual`. Žádné účty, žádná DB.

## Frontend

- `/` — jednostránkový web; ostrovy: DailyMenu (client:load), StaticMenu,
  NewsletterInline (okruh podle dne v týdnu), NewsletterSection (checkboxy),
  ReservationForm. Všechny menu ostrovy sdílí jeden fetch přes `islands/api.ts`.
- `/admin` — Preact SPA (`client:only`), login → editor dne (taby podle typu
  dne) → stálý lístek → newsletter tlačítka. Ukládá se celý dokument naráz.
- `/tisk?date=&type=` — tisková verze, čte admin endpoint (nutné přihlášení),
  print CSS.

## Antispam

Honeypot pole `website` + timestamp `t` (odeslání do 3 s od načtení = bot).
Server botům vrací `{ok: true}`, ať nic nepoznají. Žádná CAPTCHA.
