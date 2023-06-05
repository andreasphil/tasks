import { Model, createModel } from "@/lib/model";

export type Page = Model<{
  text: string;
}>;

export function createPage(init?: Partial<Page>): Page {
  return createModel({ text: init?.text ?? "" });
}

export function getTitle(page: Page): string {
  const [firstLine] = page.text.trim().split("\n");
  return firstLine || "Untitled";
}
