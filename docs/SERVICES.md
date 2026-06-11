# Napojené služby

## GitHub

- Repo: `stipekp/zastavka-web` (public)
- Větev `main` = produkce; každý push spouští Netlify build.
- Auth lokálně přes `gh` CLI (účet stipekp).

## Netlify

- Site: *(doplněno při vytvoření — viz CHANGELOG)*
- Build: `npm run build` → `dist/`, funkce `netlify/functions/`
- Blobs store: `zastavka` (vzniká automaticky prvním zápisem)

### Env proměnné (Site settings → Environment variables)

| Proměnná | Účel |
|---|---|
| `ADMIN_PASSWORD` | heslo do /admin |
| `SESSION_SECRET` | náhodný řetězec pro podpis admin cookie |
| `ECOMAIL_API_KEY` | API klíč Ecomailu (Ecomail → Integrace → API) |
| `ECOMAIL_LIST_LUNCH` | `5` — seznam Polední menu |
| `ECOMAIL_LIST_WEEKEND` | `6` — seznam Víkendové menu |
| `ECOMAIL_LIST_NEWS` | `7` — seznam Novinky a akce |
| `RESERVATION_EMAIL` | kam chodí rezervace: stipek.p@gmail.com |
| `FROM_EMAIL` | odesílatel e-mailů (default = RESERVATION_EMAIL) |

`URL` nastavuje Netlify samo (používá se v odkazech v e-mailech).

## Ecomail

- Účet: napojený přes MCP (vlastník stipek.p@gmail.com)
- Seznamy: **5** polední menu · **6** víkendové menu · **7** novinky a akce
  (v účtu existuje i ID 1 — patří jinému projektu „Dobrý důvod", nesahat)
- Odesílatel: Zastávka <stipek.p@gmail.com> — gmail adresa nemá SPF/DKIM,
  pro ostrý provoz je potřeba vlastní doména (viz GOTCHAS)
- Newsletter = kampaň přes API; rezervace = transakční e-mail
- Odhlašování řeší Ecomail (merge tag v patičce šablony)

## Fotografie

Unsplash (licence Unsplash — volné použití, uvádíme kredit v patičce webu):
- `public/img/hero.jpg` — photo-1414235077428-338989a2e8c0
- `public/img/interier.jpg` — photo-1555396273-367ea4eb4db5
- `public/img/staly-listek.jpg` — photo-1600891964599-f61ba0e24092

Až budou fotky skutečného podniku, stačí přepsat soubory ve stejných cestách.
