import { Item } from "@/lib/parser";

/* -------------------------------------------------- *
 * Base model                                         *
 * -------------------------------------------------- */

export type Model<T = any> = {
  id: string;
} & T;

export function uid(): string {
  return Math.round(Math.random() * 10 ** 16)
    .toString()
    .padEnd(16, "0");
}

export function createModel<T>(init: T): Model<T> {
  init = structuredClone(init);
  return { id: uid(), ...init };
}

/* -------------------------------------------------- *
 * Page                                               *
 * -------------------------------------------------- */

export type Page = Model<{
  items: Item[];
}>;

export function getTitle(page: Page): string {
  const firstItem = page.items.find((i) => Boolean(i.raw));
  return firstItem?.text?.trim() || "Untitled";
}

export function compareByTitle(a: Page, b: Page): number {
  const aTitle = getTitle(a);
  const bTitle = getTitle(b);

  if (aTitle === bTitle) return 0;
  else if (aTitle < bTitle) return -1;
  else return 1;
}
