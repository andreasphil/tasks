import type { DeepReadonly } from "vue";
import type { Item } from "./parser.ts";

export type Model<T = any> = {
  id: string;
} & T;

export function createModel<T>(init: T): Model<T> {
  init = structuredClone(init);
  return { id: crypto.randomUUID(), ...init };
}

export type Page = Model<{
  items: Item[];
}>;

export function getTitle(page: Page | DeepReadonly<Page>): string {
  const firstItem = page.items.find((i) => Boolean(i.raw));
  return firstItem?.raw?.replace(/^# /, "").trim() || "Untitled";
}

export function compareByTitle(
  a: Page | DeepReadonly<Page>,
  b: Page | DeepReadonly<Page>
): number {
  const aTitle = getTitle(a);
  const bTitle = getTitle(b);

  if (aTitle === bTitle) return 0;
  else if (aTitle < bTitle) return -1;
  else return 1;
}
