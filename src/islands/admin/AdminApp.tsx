import { useEffect, useState } from "preact/hooks";
import type { DayDoc, MenuGroup, MenuType, StaticMenuDoc } from "../../lib/types";
import { MENU_TYPE_LABELS } from "../../lib/types";
import { addDays, czDateLabel, menuTypesForDate } from "../../lib/menu-time";
import GroupsEditor from "./GroupsEditor";

type Tab = MenuType | "static";

function pragueToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Prague" }).format(new Date());
}

/** Kopie skupin s novými ID — ať se klíče nepletou mezi menu. */
function cloneGroups(groups: MenuGroup[]): MenuGroup[] {
  return groups.map((g) => ({
    ...g,
    id: crypto.randomUUID(),
    items: g.items.map((i) => ({ ...i, id: crypto.randomUUID() })),
  }));
}

async function apiJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Chyba ${res.status}`);
  return data;
}

const put = (url: string, body: unknown) =>
  apiJson(url, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const post = (url: string, body: unknown) =>
  apiJson(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

function Login({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: Event) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await post("/api/admin/session", { password });
      onSuccess();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Nepovedlo se.");
      setBusy(false);
    }
  }

  return (
    <form class="adm-login" onSubmit={submit}>
      <h1>Zastávka · admin</h1>
      <div class="field" style="text-align: left;">
        <label for="pw">Heslo</label>
        <input id="pw" type="password" value={password} onInput={(e) => setPassword((e.target as HTMLInputElement).value)} autofocus />
      </div>
      <button class="btn btn-dark" style="width: 100%;" disabled={busy} type="submit">
        {busy ? "Moment…" : "Přihlásit se"}
      </button>
      {err && <div class="form-msg error">{err}</div>}
    </form>
  );
}

export default function AdminApp() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [date, setDate] = useState(pragueToday());
  const [tab, setTab] = useState<Tab>("lunch");
  const [day, setDay] = useState<DayDoc | null>(null);
  const [staticDoc, setStaticDoc] = useState<StaticMenuDoc | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ text: string; kind: "ok" | "error" } | null>(null);

  const types = menuTypesForDate(date);

  function notify(text: string, kind: "ok" | "error" = "ok") {
    setToast({ text, kind });
    setTimeout(() => setToast(null), 5000);
  }

  useEffect(() => {
    apiJson("/api/admin/session").then((d) => setAuthed(d.authed)).catch(() => setAuthed(false));
  }, []);

  useEffect(() => {
    if (!authed) return;
    setDay(null);
    apiJson(`/api/admin/day?date=${date}`)
      .then((d: DayDoc) => {
        setDay(d);
        setDirty(false);
      })
      .catch((e) => notify(e.message, "error"));
  }, [authed, date]);

  useEffect(() => {
    if (!authed || staticDoc) return;
    apiJson("/api/admin/static-menu").then(setStaticDoc).catch(() => {});
  }, [authed]);

  useEffect(() => {
    if (!types.includes(tab as MenuType) && tab !== "static") setTab(types[0]);
  }, [date]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  if (authed === null) return <div class="adm-login"><h1>Zastávka · admin</h1>Načítám…</div>;
  if (!authed) return <Login onSuccess={() => setAuthed(true)} />;

  const groups: MenuGroup[] = tab === "static" ? staticDoc?.groups ?? [] : day?.menus?.[tab] ?? [];

  function setGroups(g: MenuGroup[]) {
    if (tab === "static") setStaticDoc({ groups: g });
    else if (day) setDay({ ...day, menus: { ...day.menus, [tab]: g } });
    setDirty(true);
  }

  async function save() {
    setBusy(true);
    try {
      if (tab === "static") {
        if (staticDoc) await put("/api/admin/static-menu", staticDoc);
      } else if (day) {
        await put("/api/admin/day", day);
      }
      setDirty(false);
      notify("Uloženo — na webu se to projeví do pár sekund.");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Uložení selhalo.", "error");
    } finally {
      setBusy(false);
    }
  }

  /** Najde poslední den (max. týden zpět), který má pro aktuální typ menu nějaké položky. */
  async function copyFromPrevious() {
    if (tab === "static" || !day) return;
    setBusy(true);
    try {
      for (let i = 1; i <= 7; i++) {
        const d = addDays(date, -i);
        const doc: DayDoc = await apiJson(`/api/admin/day?date=${d}`);
        const src = doc.menus?.[tab];
        if (src && src.some((g) => g.items.length > 0)) {
          setDay({ ...day, menus: { ...day.menus, [tab]: cloneGroups(src) } });
          setDirty(true);
          notify(`Zkopírováno z ${czDateLabel(d)} — nezapomeňte uložit.`);
          return;
        }
      }
      notify("V posledním týdnu není žádné menu tohoto typu.", "error");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Kopírování selhalo.", "error");
    } finally {
      setBusy(false);
    }
  }

  function copyLunchToAfternoon() {
    if (!day || !day.menus.lunch) return;
    setDay({ ...day, menus: { ...day.menus, afternoon: cloneGroups(day.menus.lunch) } });
    setDirty(true);
    notify("Polední menu zkopírováno do odpoledního — nezapomeňte uložit.");
  }

  async function sendNewsletter(type: "lunch" | "weekend") {
    const label = type === "lunch" ? "polední menu" : "víkendové menu";
    if (!confirm(`Opravdu odeslat newsletter (${label}) všem odběratelům?`)) return;
    setBusy(true);
    try {
      const r = await post("/api/admin/newsletter", { type });
      notify(`Newsletter odeslán — ${label}, ${r.dateLabel}.`);
    } catch (e) {
      notify(e instanceof Error ? e.message : "Odeslání selhalo.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    if (dirty && !confirm("Máte neuložené změny. Opravdu se odhlásit?")) return;
    await fetch("/api/admin/session", { method: "DELETE" });
    setAuthed(false);
  }

  return (
    <div class="adm-wrap">
      <div class="adm-top">
        <span class="ttl">Zastávka · admin</span>
        <input type="date" value={date} onChange={(e) => setDate((e.target as HTMLInputElement).value)} aria-label="Den" />
        <button class="btn btn-primary" onClick={save} disabled={busy || !dirty} type="button">
          {dirty ? "Uložit změny" : "Uloženo"}
        </button>
        <button class="btn btn-outline-light" onClick={logout} type="button">Odhlásit</button>
      </div>

      <div class="adm-tabs">
        {types.map((t) => (
          <button class={`adm-tab${tab === t ? " active" : ""}`} key={t} onClick={() => setTab(t)} type="button">
            {MENU_TYPE_LABELS[t]}
          </button>
        ))}
        <button class={`adm-tab${tab === "static" ? " active" : ""}`} onClick={() => setTab("static")} type="button">
          Stálý lístek
        </button>
      </div>

      {tab !== "static" && (
        <div class="adm-bar">
          <span style="font-size: 14px; color: var(--muted);">{czDateLabel(date)}</span>
          <span class="spacer" />
          <button class="btn-sm" onClick={copyFromPrevious} disabled={busy} type="button">Zkopírovat z minulého dne</button>
          {tab === "afternoon" && (
            <button class="btn-sm" onClick={copyLunchToAfternoon} disabled={busy} type="button">Zkopírovat z poledního</button>
          )}
          <a class="btn-sm" href={`/tisk?date=${date}&type=${tab}`} target="_blank" rel="noopener" style="text-decoration: none;">
            Tisk
          </a>
        </div>
      )}

      {tab === "static" && !staticDoc ? (
        <p>Načítám stálý lístek…</p>
      ) : tab !== "static" && !day ? (
        <p>Načítám menu…</p>
      ) : (
        <GroupsEditor groups={groups} onChange={setGroups} />
      )}

      {tab !== "static" && day && (
        <div class="adm-day-settings">
          <div>
            <label for="day-note">Poznámka pod menu (platí pro celý den)</label>
            <input
              id="day-note"
              placeholder="Např. Polévka je dnes pikantní"
              value={day.note}
              onInput={(e) => {
                setDay({ ...day, note: (e.target as HTMLInputElement).value });
                setDirty(true);
              }}
            />
          </div>
          <label class="check">
            <input
              type="checkbox"
              checked={day.showStaticLink}
              onChange={(e) => {
                setDay({ ...day, showStaticLink: (e.target as HTMLInputElement).checked });
                setDirty(true);
              }}
            />
            <span>Zobrazit u menu odkaz na stálý lístek</span>
          </label>
        </div>
      )}

      <div class="adm-panel">
        <h3>Newsletter</h3>
        <p style="font-size: 14px; color: var(--muted); margin: 0 0 12px;">
          E-mail se sestaví automaticky z uloženého menu. Před odesláním všechno uložte.
        </p>
        <div class="row">
          <button class="btn-sm primary" onClick={() => sendNewsletter("lunch")} disabled={busy} type="button">
            Odeslat polední menu (dnes)
          </button>
          <button class="btn-sm primary" onClick={() => sendNewsletter("weekend")} disabled={busy} type="button">
            Odeslat víkendové menu (nejbližší víkend)
          </button>
        </div>
      </div>

      {toast && <div class={`form-msg adm-msg ${toast.kind}`}>{toast.text}</div>}
    </div>
  );
}
