import { computed, reactive, readonly } from "vue";
import { createModel, touch } from "../lib/model";
import { getTitle } from "../lib/page";
import { deletePage, listPages, patchPage } from "../lib/storage";

function createPagesStore() {
  /** @type {import("../lib/page").Page[]} */
  const pages = reactive([]);

  const list = computed(() =>
    pages
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((i) => ({ id: i.id, title: getTitle(i) }))
  );

  async function fetch() {
    const result = await listPages();
    console.log(result);
    pages.splice(0, pages.length);
    pages.push(...result);
  }

  /**
   * @param {string | undefined} text
   * @returns {string}
   */
  function add(text = "") {
    const newPage = createModel({ text });
    pages.push(newPage);
    return newPage.id;
  }

  /** @param {string} id */
  function remove(id) {
    const index = pages.findIndex((i) => i.id === id);
    if (index >= 0) pages.splice(index, 1);
    deletePage(id);
  }

  /**
   * @param {string} id
   * @param {object} payload
   * @param {string | undefined} payload.text
   */
  function update(id, { text }) {
    const index = pages.findIndex((i) => i.id === id);

    if (index >= 0) {
      pages[index].text = text;
      touch(pages[index]);
      patchPage(id, pages[index]);
    }
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
