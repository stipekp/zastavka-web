# Rozhodnutí a zdůvodnění

## 2026-06-11 — založení projektu

**Astro + Preact ostrůvky, ne SPA framework.** Web je z 90 % statický obsah;
Astro vygeneruje čisté HTML (rychlost na mobilech), interaktivita jen tam, kde
je potřeba. Preact místo Reactu kvůli velikosti bundle.

**Netlify Blobs, ne databáze.** Pár desítek položek denně, jeden editor.
Externí DB (Supabase apod.) = další účet, klíče a věc, co se může rozbít.
Blobs jsou v ceně hostingu a bez konfigurace. Limit: žádné dotazy napříč
dokumenty — pro tenhle use-case nevadí (čteme vždy konkrétní den).

**Menu se ukládá jako celý dokument dne (PUT), ne granulárně.** Jeden editor,
malá data → poslední uložení vyhrává je přijatelné. Granulární API by
zkomplikovalo drag & drop a kopírování.

**Cache: CDN s tagem + purge po zápisu** místo krátké TTL bez purge.
Splňuje „změna do pár sekund" a zároveň drží menu na CDN. 30s `s-maxage`
navíc pokryje samovolné přepnutí v 15.00 bez purge.

**Tři Ecomail seznamy místo jednoho s tagy.** Kampaň se přes API cílí na
`recepient_lists` přímo; segmenty podle tagů by se musely klikat ručně
v Ecomail UI. Tři seznamy = subscribe i kampaně čistě přes API.

**Jednostránkový web + /admin + /tisk.** Obsah restaurace je malý; kotvy
fungují líp než podstránky. Tisk je oddělený kvůli print CSS.

**Auth: jedno heslo + podepsaná cookie.** Jeden tým obsluhy, žádné role.
Cokoliv víc (účty, OAuth) je údržba navíc bez přínosu.

**Výběr menu podle času počítá server (Europe/Prague).** Hodiny návštěvníka
mohou lhát; v 15.00 se menu přepne pro všechny stejně.

**Honeypot + time-check místo CAPTCHA.** Hosté restaurace nemají luštit
obrázky. Kdyby spam přerostl, přidat Turnstile (viz GOTCHAS).

**Rezervace bez potvrzovacího workflow.** Host dostane „přijato, ozveme se
jen kdyby termín nevyšel" — odpovídá tomu, jak malé bistro reálně funguje.
Stav rezervací se neeviduje, jen e-mail + záloha v Blobs.

**Fotky z Unsplash jako placeholder.** Brief fotky nedodal; reálné fotky
podniku je nahradí 1:1 (stejné cesty).
