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

export function shouldAppendDivider(page: Page | DeepReadonly<Page>): boolean {
  let i = 1;
  let done = false;

  while (!done && i <= page.items.length) {
    const item = page.items.at(-i);
    if (item && item.type === "divider") return true;
    done = item?.raw !== "";
    i++;
  }

  return false;
}

export function fmt(text: string): string {
  let result = text.trimEnd();
  if (!result) return result;

  return result
    .split("\n")
    .map((line) => line.trimEnd())
    .concat("")
    .join("\n");
}

export function compareByTitle(a: Page | DeepReadonly<Page>, b: Page | DeepReadonly<Page>): number {
  const aTitle = getTitle(a);
  const bTitle = getTitle(b);

  if (aTitle === bTitle) return 0;
  else if (aTitle < bTitle) return -1;
  else return 1;
}
