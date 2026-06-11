import type { MenuGroup } from "../../src/lib/types";

const C = {
  green: "#1f3a2e",
  cream: "#faf6ec",
  beige: "#ece5d2",
  brown: "#8b5a2b",
  ink: "#181612",
  muted: "#5f5949",
  line: "#d8cfb4",
};

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function itemRow(name: string, desc: string, price: number, tag: string | null): string {
  const tagHtml = tag
    ? ` <span style="font-size:11px;color:${C.cream};background:${C.green};border-radius:10px;padding:1px 8px;white-space:nowrap;">${esc(tag)}</span>`
    : "";
  return `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid ${C.line};">
        <span style="font-family:Georgia,'Times New Roman',serif;font-size:18px;color:${C.green};">${esc(name)}</span>${tagHtml}
        ${desc ? `<br><span style="font-size:13px;color:${C.muted};line-height:1.5;">${esc(desc)}</span>` : ""}
      </td>
      <td align="right" valign="top" style="padding:8px 0 8px 16px;border-bottom:1px solid ${C.line};font-family:Georgia,serif;font-size:18px;color:${C.brown};white-space:nowrap;">${price}&nbsp;Kč</td>
    </tr>`;
}

/**
 * E-mail s menu — tabulkový layout s inline styly (jediná spolehlivá cesta
 * napříč e-mailovými klienty), jeden sloupec kvůli mobilům.
 * *|UNSUB|* je merge tag Ecomailu pro odhlašovací odkaz.
 */
export function buildMenuEmail(opts: {
  label: string;
  dateLabel: string;
  groups: MenuGroup[];
  note: string;
  siteUrl: string;
}): string {
  const groupsHtml = opts.groups
    .map(
      (g) => `
      <tr><td colspan="2" style="padding:22px 0 4px;">
        <span style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${C.brown};font-weight:bold;">${esc(g.name)}</span>
      </td></tr>
      ${g.items.map((i) => itemRow(i.name, i.desc, i.price, i.tag)).join("")}`
    )
    .join("");

  const noteHtml = opts.note
    ? `<tr><td colspan="2" style="padding:18px 0 0;font-size:13px;color:${C.muted};font-style:italic;">${esc(opts.note)}</td></tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="cs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${C.cream};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.cream};">
<tr><td align="center" style="padding:24px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;font-family:Verdana,Geneva,sans-serif;color:${C.ink};">
    <tr><td align="center" style="background:${C.green};border-radius:10px 10px 0 0;padding:26px 24px;">
      <span style="font-family:Georgia,serif;font-size:30px;color:${C.cream};">Zastávka</span><br>
      <span style="font-size:12px;color:${C.beige};letter-spacing:1px;">bistro · Nučice</span>
    </td></tr>
    <tr><td style="background:${C.beige};border-radius:0 0 10px 10px;padding:24px 26px 28px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td colspan="2" style="padding-bottom:4px;">
          <span style="font-family:Georgia,serif;font-size:24px;color:${C.green};">${esc(opts.label)}</span><br>
          <span style="font-size:13px;color:${C.muted};">${esc(opts.dateLabel)}</span>
        </td></tr>
        ${groupsHtml}
        ${noteHtml}
        <tr><td colspan="2" align="center" style="padding:26px 0 0;">
          <a href="${opts.siteUrl}#rezervace" style="background:${C.brown};color:${C.cream};text-decoration:none;font-size:14px;padding:11px 22px;border-radius:8px;display:inline-block;">Rezervovat stůl</a>
        </td></tr>
      </table>
    </td></tr>
    <tr><td align="center" style="padding:20px 12px;font-size:12px;color:${C.muted};line-height:1.7;">
      Zastávka · Nádražní 138, Nučice · +420 311 678 432<br>
      Po–So 11–22 · Ne 11–21<br>
      <a href="${opts.siteUrl}" style="color:${C.brown};">zastávka na webu</a> · <a href="*|UNSUB|*" style="color:${C.muted};">odhlásit odběr</a>
    </td></tr>
  </table>
</td></tr>
</table>
</body></html>`;
}

export function buildReservationEmails(r: {
  name: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  guests: number;
  note: string;
  dateLabel: string;
}): { forRestaurant: string; forGuest: string } {
  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 12px 6px 0;color:${C.muted};font-size:13px;white-space:nowrap;">${label}</td><td style="padding:6px 0;font-size:15px;">${esc(value)}</td></tr>`;

  const details = `<table role="presentation" cellpadding="0" cellspacing="0" style="font-family:Verdana,sans-serif;color:${C.ink};">
    ${row("Kdy", `${r.dateLabel} v ${r.time}`)}
    ${row("Hostů", String(r.guests))}
    ${row("Jméno", r.name)}
    ${row("Telefon", r.phone)}
    ${row("E-mail", r.email)}
    ${r.note ? row("Poznámka", r.note) : ""}
  </table>`;

  const forRestaurant = `<!DOCTYPE html><html lang="cs"><body style="margin:0;padding:20px;background:#fff;">
    <p style="font-family:Verdana,sans-serif;font-size:16px;color:${C.ink};">Nová rezervace z webu:</p>${details}
  </body></html>`;

  const forGuest = `<!DOCTYPE html><html lang="cs"><body style="margin:0;padding:0;background:${C.cream};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px;">
    <table role="presentation" width="100%" style="max-width:520px;font-family:Verdana,sans-serif;color:${C.ink};">
      <tr><td style="background:${C.beige};border-radius:10px;padding:26px 28px;">
        <span style="font-family:Georgia,serif;font-size:24px;color:${C.green};">Držíme vám místo</span>
        <p style="font-size:14px;line-height:1.7;color:${C.ink};">Dobrý den, vaši rezervaci jsme přijali. Kdyby termín z naší strany nevycházel, ozveme se vám telefonicky — jinak platí a těšíme se na vás.</p>
        ${details}
        <p style="font-size:13px;color:${C.muted};line-height:1.7;">Kdyby se vám plány změnily, dejte nám prosím vědět na +420 311 678 432.<br>Zastávka · Nádražní 138, Nučice</p>
      </td></tr>
    </table>
  </td></tr></table>
  </body></html>`;

  return { forRestaurant, forGuest };
}
