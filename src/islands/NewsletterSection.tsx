import { useMemo, useState } from "preact/hooks";

const TOPICS = [
  { id: "lunch", title: "Polední menu", desc: "Každé ráno v pracovní dny — co se ten den vaří." },
  { id: "weekend", title: "Víkendové menu", desc: "V pátek ráno, ať si naplánujete víkendový oběd." },
  { id: "news", title: "Novinky a akce", desc: "2–3× měsíčně. Jen když je opravdu co posílat." },
] as const;

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [picked, setPicked] = useState<string[]>(["lunch"]);
  const [state, setState] = useState<"idle" | "busy" | "ok" | "error">("idle");
  const [msg, setMsg] = useState("");
  const mounted = useMemo(() => Date.now(), []);

  function toggle(id: string) {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  async function submit(e: Event) {
    e.preventDefault();
    if (picked.length === 0) {
      setMsg("Vyberte prosím alespoň jeden okruh.");
      setState("error");
      return;
    }
    setState("busy");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, topics: picked, t: mounted }),
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
      <div class="form-msg ok" style="text-align: center; font-size: 16px; padding: 24px;">
        Hotovo — jste přihlášeni. První e-mail dorazí, až bude co poslat.
      </div>
    );
  }

  return (
    <form onSubmit={submit} class="menu-card" style="padding: 28px;">
      <div style="display: grid; gap: 14px; margin-bottom: 20px;">
        {TOPICS.map((t) => (
          <label class="check" key={t.id}>
            <input type="checkbox" checked={picked.includes(t.id)} onChange={() => toggle(t.id)} />
            <span>
              {t.title}
              <small>{t.desc}</small>
            </span>
          </label>
        ))}
      </div>
      <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        <input
          type="email"
          required
          placeholder="vas@email.cz"
          value={email}
          onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
          aria-label="Váš e-mail"
          style="flex: 1; min-width: 220px;"
        />
        <button class="btn btn-primary" disabled={state === "busy"} type="submit">
          {state === "busy" ? "Moment…" : "Přihlásit k odběru"}
        </button>
      </div>
      {state === "error" && <div class="form-msg error">{msg}</div>}
    </form>
  );
}
