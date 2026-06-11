import { useMemo, useState } from "preact/hooks";

/**
 * Inline přihlášení pod denním menu — okruh se odvodí z kontextu:
 * ve všední den polední menu, o víkendu víkendové.
 */
export default function NewsletterInline() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "ok" | "error">("idle");
  const [msg, setMsg] = useState("");
  const mounted = useMemo(() => Date.now(), []);

  const day = new Date().getDay();
  const isWeekend = day === 0 || day === 6;
  const topic = isWeekend ? "weekend" : "lunch";
  const topicLabel = isWeekend ? "víkendové menu (pátky ráno)" : "polední menu (každé ráno)";

  async function submit(e: Event) {
    e.preventDefault();
    setState("busy");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, topics: [topic], t: mounted }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Nepovedlo se.");
      setState("ok");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Nepovedlo se.");
      setState("error");
    }
  }

  if (state === "ok") {
    return (
      <div class="newsletter-inline">
        <div>
          <div class="ttl">A je to.</div>
          <div class="sub">Menu vám teď bude chodit na {email}. Odhlásit se jde kdykoli v patičce e-mailu.</div>
        </div>
      </div>
    );
  }

  return (
    <div class="newsletter-inline">
      <div>
        <div class="ttl">Menu každé ráno do e-mailu</div>
        <div class="sub">Přihlásíte se k odběru: {topicLabel}. Žádný spam.</div>
      </div>
      <form onSubmit={submit}>
        <input
          type="email"
          required
          placeholder="vas@email.cz"
          value={email}
          onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
          aria-label="E-mail pro odběr menu"
        />
        <button class="btn btn-primary" disabled={state === "busy"} type="submit">
          {state === "busy" ? "Moment…" : "Odebírat"}
        </button>
      </form>
      {state === "error" && <div class="form-msg error" style="width: 100%;">{msg}</div>}
    </div>
  );
}
