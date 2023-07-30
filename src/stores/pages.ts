import { createModel, getTitle, touch, type Page } from "@/lib/page";
import { computed, reactive, readonly, watch } from "vue";

type PageUpdate = Partial<Page>;

function createPagesStore() {
  /* -------------------------------------------------- *
   * Stored pages                                       *
   * -------------------------------------------------- */

  const pages = reactive<Record<string, Page>>({});

  function restore() {
    const saved = localStorage.getItem("pages");
    if (!saved) return;

    try {
      Object.assign(pages, JSON.parse(saved));
    } catch {}
  }

  function persist() {
    localStorage.setItem("pages", JSON.stringify(pages));
  }

  watch(pages, persist, { deep: true });

  /* -------------------------------------------------- *
   * Managing pages                                     *
   * -------------------------------------------------- */

  const list = computed<{ id: string; title: string }[]>(() =>
    Object.values(pages)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((i) => ({ id: i.id, title: getTitle(i) }))
  );

  function add(text = ""): string {
    const page = createModel({ text });
    pages[page.id] = page;
    return page.id;
  }

  function remove(id: string): void {
    delete pages[id];
  }

  function update(id: string, page: PageUpdate): void {
    if (!pages[id]) return;
    const updatedPage = { ...pages[id], ...page };
    touch(updatedPage);
    pages[id] = updatedPage;
  }

  /* -------------------------------------------------- *
   * Import and export                                  *
   * -------------------------------------------------- */

  function exportPages() {
    return JSON.stringify(pages);
  }

  function importPages(data: string) {
    try {
      const parsed = JSON.parse(data);
      Object.assign(pages, parsed);
    } catch {}
  }

  restore();

  return () => ({
    addPage: add,
    exportPages,
    importPages,
    pages: readonly(pages),
    pagesList: readonly(list),
    removePage: remove,
    updatePage: update,
  });
}

export const usePages = createPagesStore();
