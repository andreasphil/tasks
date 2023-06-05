import { touch } from "@/lib/model";
import { Page, getTitle } from "@/lib/page";
import { createPage, deletePage, listPages, patchPage } from "@/lib/storage";
import { computed, reactive, readonly } from "vue";

type PageUpdate = Partial<Page>;

function createPagesStore() {
  const pages = reactive<Page[]>([]);

  const list = computed<{ id: string; title: string }[]>(() =>
    pages
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((i) => ({ id: i.id, title: getTitle(i) }))
  );

  async function fetch(): Promise<void> {
    const result = await listPages();
    console.log(result);
    pages.splice(0, pages.length);
    pages.push(...result);
  }

  async function add(text = ""): Promise<string> {
    const page = await createPage({ text });
    pages.push(page);
    return page.id;
  }

  async function remove(id: string) {
    await deletePage(id);
    const index = pages.findIndex((i) => i.id === id);
    if (index >= 0) pages.splice(index, 1);
  }

  async function update(id: string, page: PageUpdate): Promise<void> {
    const index = pages.findIndex((i) => i.id === id);
    if (index < 0) return;

    const updatedPage = { ...pages[index], ...page };
    touch(updatedPage);

    await patchPage(id, updatedPage);
    pages[index] = updatedPage;
  }

  return () => ({
    pages: readonly(pages),
    pagesList: list,
    fetchPages: fetch,
    addPage: add,
    removePage: remove,
    updatePage: update,
  });
}

export const usePages = createPagesStore();
