import { mutate } from "@/lib/item";
import { compareByTitle, createModel, getTitle, type Page } from "@/lib/page";
import { parse } from "@/lib/parser";
import { joinLines, splitLines } from "@andreasphil/vue-textarea2/text";
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

  watch(pages, () => persist(), { deep: true });

  /* -------------------------------------------------- *
   * Managing pages                                     *
   * -------------------------------------------------- */

  const list = computed<{ id: string; title: string }[]>(() =>
    Object.values(pages)
      .sort(compareByTitle)
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
    pages[id] = updatedPage;
  }

  /* -------------------------------------------------- *
   * Managing items                                     *
   * -------------------------------------------------- */

  function updateItem(
    id: string,
    index: number,
    factory: Parameters<typeof mutate>[1]
  ) {
    const lines = splitLines(pages[id]?.text ?? "");
    if (index >= lines.length) return;

    const item = parse(lines[index]);
    mutate(item, factory);
    lines[index] = item.raw;

    update(id, { text: joinLines(lines) });
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
    updateItem,
    updatePage: update,
  });
}

export const usePages = createPagesStore();
