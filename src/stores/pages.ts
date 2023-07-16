import { touch } from "@/lib/model";
import { Page, getTitle } from "@/lib/page";
import { createPage, deletePage, listPages, patchPage } from "@/lib/storage";
import { MaybeRefOrGetter, computed, reactive, readonly, toValue } from "vue";

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

  function listItem(id: MaybeRefOrGetter<string>) {
    return computed(() => {
      const idVal = toValue(id);
      return list.value.find((i) => i.id === idVal);
    });
  }

  return () => ({
    addPage: add,
    fetchPages: fetch,
    listItem,
    pages: readonly(pages),
    pagesList: readonly(list),
    removePage: remove,
    updatePage: update,
  });
}

export const usePages = createPagesStore();
