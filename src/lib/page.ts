/* -------------------------------------------------- *
 * Base model                                         *
 * -------------------------------------------------- */

export type Model<T = any> = {
  id: string;
  createdAt: number;
  updatedAt: number;
} & T;

export function uid(): string {
  return Math.round(Math.random() * 10 ** 16)
    .toString()
    .padEnd(16, "0");
}

export function createModel<T>(init: T): Model<T> {
  const now = new Date().getTime();
  init = structuredClone(init);
  return { id: uid(), createdAt: now, updatedAt: now, ...init };
}

export function touch(model: Model): void {
  model.updatedAt = new Date().getTime();
}

/* -------------------------------------------------- *
 * Page                                               *
 * -------------------------------------------------- */

export type Page = Model<{
  text: string;
}>;

export function getTitle(page: Page): string {
  const [firstLine] = page.text.trim().split("\n");
  return firstLine.trim() || "Untitled";
}

export function compareByTitle(a: Page, b: Page) {
  const aTitle = getTitle(a);
  const bTitle = getTitle(b);

  if (aTitle === bTitle) return 0;
  else if (aTitle < bTitle) return -1;
  else return 1;
}
