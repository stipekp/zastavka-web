const BASE = "https://api2.ecomailapp.cz";

function apiKey(): string {
  const k = process.env.ECOMAIL_API_KEY;
  if (!k) throw new Error("Chybí env proměnná ECOMAIL_API_KEY");
  return k;
}

function fromEmail(): string {
  return process.env.FROM_EMAIL ?? process.env.RESERVATION_EMAIL ?? "";
}

/** Odpovědi hostů mají chodit do skutečné schránky, ne na odesílací adresu bez mailboxu. */
function replyTo(): string {
  return process.env.RESERVATION_EMAIL ?? fromEmail();
}

async function api(path: string, method: string, body?: unknown): Promise<any> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { key: apiKey(), "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Ecomail ${method} ${path} → ${res.status}: ${text.slice(0, 300)}`);
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function subscribeToList(listId: string, email: string): Promise<void> {
  await api(`/lists/${listId}/subscribe`, "POST", {
    subscriber_data: { email },
    update_existing: true,
    resubscribe: true,
    trigger_autoresponders: true,
  });
}

export async function sendTransactional(opts: { to: string; subject: string; html: string; replyTo?: string }): Promise<void> {
  await api("/transactional/send-message", "POST", {
    message: {
      subject: opts.subject,
      from_name: "Zastávka",
      from_email: fromEmail(),
      reply_to: opts.replyTo ?? replyTo(),
      html: opts.html,
      to: [{ email: opts.to }],
    },
  });
}

/** Vytvoří kampaň a hned ji odešle. Pozor: pole `recepient_lists` má překlep přímo v Ecomail API. */
export async function sendCampaign(opts: { listId: string; title: string; subject: string; html: string }): Promise<number> {
  const created = await api("/campaigns", "POST", {
    title: opts.title,
    subject: opts.subject,
    from_name: "Zastávka",
    from_email: fromEmail(),
    reply_to: replyTo(),
    html_text: opts.html,
    recepient_lists: [Number(opts.listId)],
  });
  const id = typeof created === "number" ? created : created?.id;
  if (!id) throw new Error(`Ecomail nevrátil ID kampaně: ${JSON.stringify(created).slice(0, 300)}`);
  await api(`/campaign/${id}/send`, "GET");
  return id;
}
