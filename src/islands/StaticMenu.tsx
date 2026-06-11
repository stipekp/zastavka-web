import { useEffect, useState } from "preact/hooks";
import type { StaticMenuDoc } from "../lib/types";
import { fetchMenu, tagClass } from "./api";

export default function StaticMenu() {
  const [doc, setDoc] = useState<StaticMenuDoc | null>(null);

  useEffect(() => {
    fetchMenu()
      .then((d) => setDoc(d.staticMenu))
      .catch(() => setDoc({ groups: [] }));
  }, []);

  const groups = (doc?.groups ?? [])
    .map((g) => ({ ...g, items: g.items.filter((i) => i.available) }))
    .filter((g) => g.items.length > 0);

  if (!doc) {
    return <div class="menu-card menu-empty" aria-busy="true"><span class="name">Načítáme…</span></div>;
  }

  if (groups.length === 0) {
    return (
      <div class="menu-card menu-empty">
        <span class="name">Stálý lístek doplňujeme</span>
        Zeptejte se obsluhy, ráda poradí.
      </div>
    );
  }

  return (
    <div class="menu-card">
      {groups.map((g) => (
        <div key={g.id}>
          <p class="menu-group-name" style="margin-top: 18px;">{g.name}</p>
          {g.items.map((i) => (
            <div class="menu-item" key={i.id}>
              <div>
                <span class="name">{i.name}</span>
                {i.tag && <span class={tagClass(i.tag)}>{i.tag}</span>}
                {i.desc && <div class="desc">{i.desc}</div>}
              </div>
              <span class="price">{i.price} Kč</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
