# Zastávka — web restaurace

Web bistra Zastávka v Nučicích: denní menu podle času, stálý lístek, admin pro
obsluhu, newsletter přes Ecomail, rezervační formulář. Statický Astro web +
Netlify Functions + Netlify Blobs, deploy GitHub → Netlify.

**Tohle je rozcestník. Detaily jsou v `docs/` — přečti si je, než začneš měnit kód.**

## Dokumentace

| Soubor | Co v něm je |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Stack, datový model, API endpointy, toky dat |
| [docs/SERVICES.md](docs/SERVICES.md) | GitHub, Netlify, Ecomail — konfigurace, ID, env proměnné |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Proč jsme co rozhodli (a co jsme zavrhli) |
| [docs/GOTCHAS.md](docs/GOTCHAS.md) | Pasti a antivzory — čti PŘED úpravou integrace |
| [docs/CHANGELOG.md](docs/CHANGELOG.md) | Důležité změny s datem |

## Pevná pravidla

1. **Před každým `git push` se zeptej uživatele.** Push na `main` spouští build
   a nasazení na Netlify. Bez výjimky.
2. Komunikace s uživatelem česky. Texty na webu česky, tón „jako k sousedovi" —
   přátelský, přímý, bez reklamních superlativ.
3. Barvy a typografie vychází z fyzického interiéru — neměnit bez zadání
   (tokeny v `src/styles/global.css`).
4. Po každém netriviálním rozhodnutí nebo objevené pasti aktualizuj `docs/`.

## Příkazy

```
npm run dev          # jen statická část (bez /api — funkce neběží)
npx netlify dev      # web + funkce + blobs lokálně (vyžaduje netlify link)
npm run build        # produkční build do dist/
npx tsc --noEmit     # typová kontrola (build ji nedělá!)
```

## Kde co je

- `src/pages/` — index (jednostránkový web), admin, tisk
- `src/islands/` — Preact komponenty (menu, formuláře, admin v `admin/`)
- `src/lib/` — sdílené typy a logika času menu (používá frontend i funkce)
- `netlify/functions/` — API (`/api/*`), `netlify/lib/` — sdílený serverový kód
- Admin: `/admin`, heslo v env `ADMIN_PASSWORD` na Netlify
