import Sortable from "sortablejs";
import { useEffect, useRef } from "preact/hooks";

export function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const copy = [...arr];
  const [moved] = copy.splice(from, 1);
  copy.splice(to, 0, moved);
  return copy;
}

/**
 * SortableJS nad seznamem renderovaným Preactem: po dotažení vrátíme DOM
 * do původního pořadí a změnu propíšeme jen do stavu — překreslení podle
 * klíčů pak udělá Preact. Bez revertu by spolu DOM a virtuální strom bojovaly.
 */
export function useSortable(
  onMove: (from: number, to: number) => void,
  options: { handle: string; group?: string } = { handle: ".handle" }
) {
  const elRef = useRef<HTMLDivElement>(null);
  const cbRef = useRef(onMove);
  cbRef.current = onMove;

  useEffect(() => {
    if (!elRef.current) return;
    const s = Sortable.create(elRef.current, {
      handle: options.handle,
      group: options.group,
      animation: 150,
      onEnd(evt) {
        const { oldIndex, newIndex, item, from } = evt;
        if (oldIndex == null || newIndex == null || oldIndex === newIndex) return;
        from.removeChild(item);
        from.insertBefore(item, from.children[oldIndex] ?? null);
        cbRef.current(oldIndex, newIndex);
      },
    });
    return () => s.destroy();
  }, []);

  return elRef;
}
