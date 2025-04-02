import {
  compareByTitle,
  createModel,
  getTitle,
  type Model,
  type Page,
} from "@/lib/page";
import { type Item } from "@/lib/parser";
import { parse } from "@/stores/appParser";
import { useSettings } from "@/stores/settings";
import { computed, reactive, watch } from "vue";

type SerializedPage = Model<{ text: string }>;

function createPagesStore() {
  const pages = reactive<Record<string, Page>>({});

  const list = computed(() =>
    Object.values(pages)
      .map((page) => ({ ...page, title: getTitle(page) }))
      .sort(compareByTitle)
  );

  function refresh() {
    Object.keys(pages).forEach((p) => {
      pages[p].items = pages[p].items.map((i) => parse.withMemo(i.raw));
    });
  }

  const { onSettingsChange } = useSettings();

  onSettingsChange(refresh);

  // Managing pages -----------------------------------------

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

  // Persisting ---------------------------------------------

  function loadFromStorage() {
    const saved = localStorage.getItem("pages");
    if (!saved) return;

    try {
      importBackup(saved);
    } catch (e) {
      console.error("Failed to restore pages from backup:", e);
    }
  }

  function saveToStorage() {
    localStorage.setItem("pages", exportBackup());
  }

  watch(pages, () => saveToStorage(), { deep: true });

  loadFromStorage();

  // Import and export --------------------------------------

  /**
   * Imports the pages included in the backup. The backup is expected to
   * correspond to the type `SerializedPage[]`, as stringified JSON.
   */
  function importBackup(serializedPages: string) {
    const textPages: SerializedPage[] = JSON.parse(serializedPages) ?? [];
    textPages.forEach(({ id, text }) => {
      pages[id] = { id, items: text.split("\n").map((line) => parse(line)) };
    });
  }

  /**
   * Exports the pages currently in the list. The backup will correspond to
   * the type `SerializedPage[]`, as stringified JSON.
   */
  function exportBackup(): string {
    const textPages: SerializedPage[] = Object.values(pages).map((page) => ({
      id: page.id,
      text: page.items.map((item) => item.raw).join("\n"),
    }));

    return JSON.stringify(textPages);
  }

  return () => ({
    createPage: create,
    exportBackup,
    importBackup,
    pageList: list,
    pages,
    removePage: remove,
    updatePage: update,
  });
}

export const usePages = createPagesStore();
