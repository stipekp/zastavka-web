import { useEffect, useState } from "preact/hooks";
import type { MenuGroup, PublicMenuResponse } from "../lib/types";
import { fetchMenu, tagClass } from "./api";

function Items({ groups }: { groups: MenuGroup[] }) {
  return (
    <>
      {groups.map((g) => (
        <div key={g.id}>
          <p class="menu-group-name">{g.name}</p>
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
    </>
  );
}

export default function DailyMenu() {
  const [data, setData] = useState<PublicMenuResponse | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetchMenu().then(setData).catch(() => setFailed(true));
  }, []);

  if (failed) {
    return (
      <div class="menu-card menu-empty">
        <span class="name">Menu se nepodařilo načíst</span>
        Zkuste obnovit stránku, případně nám zavolejte: <a href="tel:+420311678432">+420 311 678 432</a>.
      </div>
    );
  }

  if (!data) {
    return (
      <div class="menu-card menu-empty" aria-busy="true">
        <span class="name">Načítáme dnešní menu…</span>
      </div>
    );
  }

  if (!data.active) {
    return (
      <div class="menu-card menu-empty">
        <span class="name">Dnešní menu právě chystáme</span>
        Mezitím mrkněte na <a href="#staly-listek">stálý lístek</a> — ten platí pořád.
      </div>
    );
  }

  const m = data.active;
  return (
    <div class="menu-card">
      <div class="menu-card-head">
        <h3>{m.label}</h3>
        <span class="when">
          {m.dateLabel}
          {m.type === "lunch" && " · podáváme do 15.00"}
          {m.type === "afternoon" && " · podáváme od 15.00"}
        </span>
      </div>
      <Items groups={m.groups} />
      {(m.note || m.showStaticLink) && (
        <div class="menu-note">
          <span>{m.note}</span>
          {m.showStaticLink && <a href="#staly-listek">Stálý lístek platí celý den →</a>}
        </div>
      )}
    </div>
  );
}
