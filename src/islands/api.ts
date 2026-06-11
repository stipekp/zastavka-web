import type { PublicMenuResponse } from "../lib/types";

let menuPromise: Promise<PublicMenuResponse> | null = null;

/** Jeden fetch /api/menu sdílený všemi ostrovy na stránce. */
export function fetchMenu(): Promise<PublicMenuResponse> {
  if (!menuPromise) {
    menuPromise = fetch("/api/menu").then((r) => {
      if (!r.ok) throw new Error(`menu ${r.status}`);
      return r.json();
    });
  }
  return menuPromise;
}

export function tagClass(tag: string): string {
  return `tag ${tag.toLowerCase()}`;
}
