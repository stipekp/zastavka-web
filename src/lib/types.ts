export const MENU_TAGS = ["Doporučujeme", "Vege", "GF", "Klasika", "Signature"] as const;
export type MenuTag = (typeof MENU_TAGS)[number];

export interface MenuItem {
  id: string;
  name: string;
  desc: string;
  price: number;
  tag: MenuTag | null;
  available: boolean;
}

export interface MenuGroup {
  id: string;
  name: string;
  items: MenuItem[];
}

export type MenuType = "lunch" | "afternoon" | "weekend";

export const MENU_TYPE_LABELS: Record<MenuType, string> = {
  lunch: "Polední menu",
  afternoon: "Odpolední menu",
  weekend: "Víkendové menu",
};

/** Jeden den v adminu = jeden dokument v Netlify Blobs (`day:YYYY-MM-DD`). */
export interface DayDoc {
  date: string;
  menus: Partial<Record<MenuType, MenuGroup[]>>;
  note: string;
  showStaticLink: boolean;
}

export interface StaticMenuDoc {
  groups: MenuGroup[];
}

/** Odpověď veřejného endpointu /api/menu — bez nedostupných položek. */
export interface PublicMenuResponse {
  now: { date: string; minutes: number };
  active: {
    type: MenuType;
    label: string;
    dateLabel: string;
    groups: MenuGroup[];
    note: string;
    showStaticLink: boolean;
  } | null;
  staticMenu: StaticMenuDoc;
}
