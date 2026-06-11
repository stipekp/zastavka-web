import { MENU_TAGS, type MenuGroup, type MenuItem } from "../../lib/types";
import { arrayMove, useSortable } from "./sortable";

function newItem(): MenuItem {
  return { id: crypto.randomUUID(), name: "", desc: "", price: 0, tag: null, available: true };
}

function newGroup(): MenuGroup {
  return { id: crypto.randomUUID(), name: "Nová skupina", items: [] };
}

interface GroupProps {
  group: MenuGroup;
  onChange: (g: MenuGroup) => void;
  onDelete: () => void;
}

function GroupEditor({ group, onChange, onDelete }: GroupProps) {
  const itemsRef = useSortable(
    (from, to) => onChange({ ...group, items: arrayMove(group.items, from, to) }),
    { handle: ".i-handle", group: `items-${group.id}` }
  );

  const setItem = (id: string, patch: Partial<MenuItem>) =>
    onChange({ ...group, items: group.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) });

  return (
    <div class="adm-group">
      <div class="adm-group-head">
        <span class="handle g-handle" title="Přetáhnout skupinu">⠿</span>
        <input
          value={group.name}
          onInput={(e) => onChange({ ...group, name: (e.target as HTMLInputElement).value })}
          aria-label="Název skupiny"
        />
        <button
          class="btn-sm danger"
          type="button"
          onClick={() => {
            if (group.items.length === 0 || confirm(`Smazat skupinu „${group.name}" včetně položek?`)) onDelete();
          }}
        >
          Smazat
        </button>
      </div>
      <div ref={itemsRef}>
        {group.items.map((i) => (
          <div class={`adm-item${i.available ? "" : " off"}`} key={i.id}>
            <span class="handle i-handle" title="Přetáhnout položku">⠿</span>
            <input
              placeholder="Název jídla"
              value={i.name}
              onInput={(e) => setItem(i.id, { name: (e.target as HTMLInputElement).value })}
            />
            <input
              type="number"
              min={0}
              placeholder="Kč"
              value={i.price || ""}
              onInput={(e) => setItem(i.id, { price: Number((e.target as HTMLInputElement).value) || 0 })}
              aria-label="Cena v Kč"
            />
            <select
              value={i.tag ?? ""}
              onChange={(e) => setItem(i.id, { tag: ((e.target as HTMLSelectElement).value || null) as MenuItem["tag"] })}
              aria-label="Štítek"
            >
              <option value="">bez štítku</option>
              {MENU_TAGS.map((t) => (
                <option value={t} key={t}>{t}</option>
              ))}
            </select>
            <div class="toggles">
              <button
                class="btn-sm"
                type="button"
                title={i.available ? "Položka je v nabídce — kliknutím skryjete" : "Položka je skrytá — kliknutím vrátíte"}
                onClick={() => setItem(i.id, { available: !i.available })}
              >
                {i.available ? "Skrýt" : "Skryto"}
              </button>
            </div>
            <button
              class="btn-sm danger"
              type="button"
              onClick={() => {
                if (!i.name || confirm(`Smazat „${i.name}"?`))
                  onChange({ ...group, items: group.items.filter((x) => x.id !== i.id) });
              }}
            >
              ✕
            </button>
            <input
              class="sub"
              placeholder="Popis (nepovinný)"
              value={i.desc}
              onInput={(e) => setItem(i.id, { desc: (e.target as HTMLInputElement).value })}
            />
          </div>
        ))}
      </div>
      <button class="btn-sm" type="button" style="margin-top: 10px;" onClick={() => onChange({ ...group, items: [...group.items, newItem()] })}>
        + Přidat položku
      </button>
    </div>
  );
}

export default function GroupsEditor({ groups, onChange }: { groups: MenuGroup[]; onChange: (g: MenuGroup[]) => void }) {
  const groupsRef = useSortable((from, to) => onChange(arrayMove(groups, from, to)), { handle: ".g-handle" });

  return (
    <div>
      <div ref={groupsRef}>
        {groups.map((g) => (
          <GroupEditor
            key={g.id}
            group={g}
            onChange={(ng) => onChange(groups.map((x) => (x.id === g.id ? ng : x)))}
            onDelete={() => onChange(groups.filter((x) => x.id !== g.id))}
          />
        ))}
      </div>
      <button class="btn-sm" type="button" onClick={() => onChange([...groups, newGroup()])}>
        + Přidat skupinu
      </button>
    </div>
  );
}
