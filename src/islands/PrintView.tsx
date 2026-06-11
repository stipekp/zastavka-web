import { useEffect, useState } from "preact/hooks";
import type { DayDoc, MenuGroup, MenuType } from "../lib/types";
import { MENU_TYPE_LABELS } from "../lib/types";
import { czDateLabel } from "../lib/menu-time";

/** Tisková verze menu — načítá přes admin endpoint, je tedy potřeba být přihlášený. */
export default function PrintView() {
  const [state, setState] = useState<{ groups: MenuGroup[]; label: string; dateLabel: string; note: string } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const date = params.get("date") ?? "";
    const type = (params.get("type") ?? "lunch") as MenuType;

    fetch(`/api/admin/day?date=${date}`)
      .then(async (r) => {
        if (r.status === 401) throw new Error("Nejste přihlášeni — otevřete tisk z admin panelu.");
        if (!r.ok) throw new Error("Menu se nepodařilo načíst.");
        const day: DayDoc = await r.json();
        const groups = (day.menus?.[type] ?? [])
          .map((g) => ({ ...g, items: g.items.filter((i) => i.available) }))
          .filter((g) => g.items.length > 0);
        if (groups.length === 0) throw new Error("Toto menu je prázdné — není co tisknout.");
        setState({ groups, label: MENU_TYPE_LABELS[type], dateLabel: czDateLabel(date), note: day.note });
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p style="text-align: center; padding: 40px;">{error}</p>;
  if (!state) return <p style="text-align: center; padding: 40px;">Připravuji tisk…</p>;

  return (
    <div class="print-sheet">
      <header>
        <div class="brand">Zastávka</div>
        <div class="brand-sub">bistro · Nučice</div>
        <h1>{state.label}</h1>
        <div class="date">{state.dateLabel}</div>
      </header>
      {state.groups.map((g) => (
        <section key={g.id}>
          <h2>{g.name}</h2>
          {g.items.map((i) => (
            <div class="row" key={i.id}>
              <div>
                <span class="name">{i.name}</span>
                {i.tag && <span class="tag">{i.tag}</span>}
                {i.desc && <div class="desc">{i.desc}</div>}
              </div>
              <span class="price">{i.price} Kč</span>
            </div>
          ))}
        </section>
      ))}
      {state.note && <p class="note">{state.note}</p>}
      <footer>Nádražní 138, Nučice · +420 311 678 432 · Po–So 11–22, Ne 11–21</footer>
      <button class="no-print" onClick={() => window.print()} type="button">Vytisknout</button>
    </div>
  );
}
