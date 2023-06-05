import { Page, createPage as createPageModel } from "@/lib/page";

export async function listPageIds(): Promise<string[]> {
  const keys = [];

  for (let i = 0; i < localStorage.length; i++) {
    const current = localStorage.key(i);
    if (!current || !current.startsWith("page_")) continue;
    keys.push(current.replace("page_", ""));
  }

  return keys;
}

export async function listPages(): Promise<Page[]> {
  let ids = await listPageIds();
  return Promise.all(ids.map((id) => fetchPage(id)));
}

export async function fetchPage(id: string): Promise<Page> {
  const raw = localStorage.getItem(`page_${id}`);
  if (!raw) throw new Error(`Page with ID ${id} doesn't exist!`);

  try {
    const parsed = JSON.parse(raw);
    return parsed;
  } catch {
    throw new Error(`Failed to restore page with ID ${id} from storage!`);
  }
}

export type PageInit = Pick<Page, "text">;

export async function createPage(init: PageInit): Promise<Page> {
  const page = createPageModel(init);
  const raw = JSON.stringify(page);
  localStorage.setItem(`page_${page.id}`, raw);
  return page;
}

export async function patchPage(id: string, payload: Page): Promise<void> {
  const raw = JSON.stringify(payload);
  localStorage.setItem(`page_${id}`, raw);
}

export async function deletePage(id: string): Promise<void> {
  localStorage.removeItem(`page_${id}`);
}
