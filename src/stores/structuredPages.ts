import { type Item } from "@/lib/parser";
import {
  compareByTitle,
  createModel,
  getTitle,
  type Page,
} from "@/lib/structuredPage";
import { computed, reactive, readonly } from "vue";

function createPagesStore() {
  const pages = reactive<Record<string, Page>>({});

  const list = computed(() =>
    Object.values(pages)
      .map((page) => ({ ...page, title: getTitle(page) }))
      .sort(compareByTitle)
  );

  /* -------------------------------------------------- *
   * Managing pages                                     *
   * -------------------------------------------------- */

  function create(items: Item[] = []): string {
    const page = createModel({ items });
    pages[page.id] = page;
    return page.id;
  }

  function update(id: string, page: Partial<Page>) {
    if (!pages[id]) return;
    const updatedPage = { ...pages[id], ...page };
    pages[id] = updatedPage;
  }

  function remove(id: string) {
    delete pages[id];
  }

  return () => ({
    createPage: create,
    pageList: readonly(list),
    pages: readonly(pages),
    removePage: remove,
    updatePage: update,
  });
}

export const usePages = createPagesStore();
