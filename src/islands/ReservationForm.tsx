import { useMemo, useState } from "preact/hooks";

/** Pevné sloty po půlhodině; poslední usazení hodinu před zavírací dobou. */
function slotsFor(dateStr: string): string[] {
  const day = dateStr ? new Date(`${dateStr}T12:00:00`).getDay() : 1;
  const lastHour = day === 0 ? 20 : 21;
  const out: string[] = [];
  for (let h = 11; h <= lastHour; h++) {
    out.push(`${String(h).padStart(2, "0")}:00`);
    if (h < lastHour) out.push(`${String(h).padStart(2, "0")}:30`);
  }
  return out;
}

export default function ReservationForm() {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ name: "", phone: "", email: "", date: "", time: "", guests: "2", note: "" });
  const [state, setState] = useState<"idle" | "busy" | "ok" | "error">("idle");
  const [msg, setMsg] = useState("");
  const mounted = useMemo(() => Date.now(), []);

  const set = (k: string) => (e: Event) =>
    setForm((f) => ({ ...f, [k]: (e.target as HTMLInputElement).value }));

  const bigGroup = form.guests === "8+";

  async function submit(e: Event) {
    e.preventDefault();
    if (bigGroup) return;
    setState("busy");
    try {
      const res = await fetch("/api/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, guests: Number(form.guests), t: mounted }),
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
      <div class="form-msg ok" style="font-size: 16px; padding: 24px; line-height: 1.7;">
        <strong>Rezervace je u nás.</strong><br />
        Na {form.email} jsme poslali potvrzení. Kdyby termín z naší strany nevycházel, ozveme se — jinak se na vás těšíme.
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <div class="form-grid">
        <div class="field">
          <label for="r-name">Jméno</label>
          <input id="r-name" required value={form.name} onInput={set("name")} autocomplete="name" />
        </div>
        <div class="field">
          <label for="r-phone">Telefon</label>
          <input id="r-phone" type="tel" required value={form.phone} onInput={set("phone")} autocomplete="tel" placeholder="+420" />
        </div>
      </div>
      <div class="field">
        <label for="r-email">E-mail</label>
        <input id="r-email" type="email" required value={form.email} onInput={set("email")} autocomplete="email" />
      </div>
      <div class="form-grid">
        <div class="field">
          <label for="r-date">Datum</label>
          <input id="r-date" type="date" required min={today} value={form.date} onInput={set("date")} />
        </div>
        <div class="field">
          <label for="r-time">Čas</label>
          <select id="r-time" required value={form.time} onChange={set("time")}>
            <option value="" disabled>Vyberte…</option>
            {slotsFor(form.date).map((s) => (
              <option value={s} key={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
      <div class="field">
        <label for="r-guests">Počet hostů</label>
        <select id="r-guests" value={form.guests} onChange={set("guests")}>
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <option value={String(n)} key={n}>{n}</option>
          ))}
          <option value="8+">8 a více</option>
        </select>
      </div>
      <div class="field">
        <label for="r-note">Poznámka <span style="font-weight: 400; color: var(--muted);">(nepovinné)</span></label>
        <textarea id="r-note" rows={3} value={form.note} onInput={set("note")} placeholder="Kočárek, oslava, dietní omezení…" />
      </div>
      <input class="hp" type="text" name="website" tabindex={-1} autocomplete="off" aria-hidden="true" />
      {bigGroup ? (
        <div class="form-msg error" style="background: var(--beige); color: var(--ink);">
          Pro 8 a více lidí nám prosím zavolejte na{" "}
          <a href="tel:+420311678432" style="white-space: nowrap;">+420 311 678 432</a> — větší stoly
          domlouváme osobně, ať všechno klapne.
        </div>
      ) : (
        <button class="btn btn-primary" style="width: 100%;" disabled={state === "busy"} type="submit">
          {state === "busy" ? "Odesílám…" : "Odeslat rezervaci"}
        </button>
      )}
      {state === "error" && <div class="form-msg error">{msg}</div>}
    </form>
  );
}
