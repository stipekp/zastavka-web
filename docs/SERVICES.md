# Napojené služby

## GitHub

- Repo: `stipekp/zastavka-web` (public)
- Větev `main` = produkce; každý push spouští Netlify build.
- Auth lokálně přes `gh` CLI (účet stipekp).

## Netlify

- Site: **zastavka-web** · https://zastavka-web.netlify.app
  - site id `8bb88db6-8103-4ee6-bcc1-9abd3fb8a008`, tým `stipek-p`
  - admin: https://app.netlify.com/projects/zastavka-web
- Napojeno na GitHub (installation_id 139345471), branch `main`, auto-deploy
- Build: `npm run build` → `dist/`, funkce `netlify/functions/`
- Blobs store: `zastavka` (vzniká automaticky prvním zápisem)
- **Netlify Forms**: form `rezervace` (id `6a2b03007d60320008917bab`) —
  registruje ho skrytý formulář na hlavní stránce; submissions posílá
  serverově funkce `/api/reserve`. E-mail notifikace na stipek.p@gmail.com
  přes hook `6a2b039ddfed56f0dbeda009` (email/submission_created).
  Free tier: 100 submissions/měsíc.
- **Netlify MCP konektor vrací 401 (expirovaný token)** — používej lokální
  `netlify` CLI, je přihlášené jako stipek.p@gmail.com a funguje.
  V účtu je i starší sajta `zastavka-restaurace` (jiné repo) — nesahat.

### Env proměnné (Site settings → Environment variables)

| Proměnná | Účel |
|---|---|
| `ADMIN_PASSWORD` | heslo do /admin |
| `SESSION_SECRET` | náhodný řetězec pro podpis admin cookie |
| `ECOMAIL_API_KEY` | API klíč Ecomailu (Ecomail → Integrace → API); nastaven jako secret pro production/deploy-preview/branch-deploy |
| `ECOMAIL_LIST_LUNCH` | `5` — seznam Polední menu |
| `ECOMAIL_LIST_WEEKEND` | `6` — seznam Víkendové menu |
| `ECOMAIL_LIST_NEWS` | `7` — seznam Novinky a akce |
| `RESERVATION_EMAIL` | kam chodí rezervace: stipek.p@gmail.com |
| `FROM_EMAIL` | odesílatel e-mailů: `zastavka@novinky.dobry-duvod.cz` (adresa na doméně ověřené v Ecomailu; mailbox neexistuje, odpovědi chodí na reply-to = RESERVATION_EMAIL) |

`URL` nastavuje Netlify samo (používá se v odkazech v e-mailech).

## Ecomail

- Účet: napojený přes MCP (vlastník stipek.p@gmail.com)
- Seznamy: **5** polední menu · **6** víkendové menu · **7** novinky a akce
  (v účtu existuje i ID 1 — patří jinému projektu „Dobrý důvod", nesahat)
- Ověřená doména: **novinky.dobry-duvod.cz** (sdílená s projektem Dobrý
  důvod) — odesílatel kampaní je Zastávka <zastavka@novinky.dobry-duvod.cz>,
  reply-to stipek.p@gmail.com. Až bude vlastní doména restaurace, ověřit ji
  v Ecomailu a přepnout `FROM_EMAIL`.
- Newsletter = kampaň přes API; rezervace = transakční e-mail
- Odhlašování řeší Ecomail (merge tag v patičce šablony)

## Fotografie

Unsplash (licence Unsplash — volné použití, uvádíme kredit v patičce webu):
- `public/img/hero.jpg` — photo-1414235077428-338989a2e8c0
- `public/img/interier.jpg` — photo-1555396273-367ea4eb4db5
- `public/img/staly-listek.jpg` — photo-1600891964599-f61ba0e24092

Až budou fotky skutečného podniku, stačí přepsat soubory ve stejných cestách.
