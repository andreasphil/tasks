import assert from "node:assert/strict";
import { afterEach, before, describe, mock, test } from "node:test";
import { nextTick } from "vue";
import { parse } from "../lib/parser.ts";
import type { usePages as usePagesFn } from "./pages.ts";

describe("usePages", () => {
  let usePages: typeof usePagesFn;

  before(async () => {
    const mockStorage = new Map();
    globalThis.localStorage = {
      getItem: (key: string) => mockStorage.get(key),
      setItem: (key: string, value: unknown) => mockStorage.set(key, value),
      removeItem: (key: string) => mockStorage.delete(key),
      key: (i: number) => Array.from(mockStorage.keys())[i] ?? null,
      clear: () => mockStorage.clear(),
      get length() {
        return mockStorage.size;
      },
    };

    usePages = (await import("./pages.ts")).usePages;
  });

  afterEach(() => {
    // Reset the store to its initial state after each run
    const { pages, removePage } = usePages();
    Object.keys(pages).forEach((id) => removePage(id));

    // Clear localStorage
    localStorage.clear();
  });

  test("returns an empty list of pages", () => {
    const { pages } = usePages();

    assert.ok(pages);
    assert.equal(Object.values(pages).length, 0);
  });

  test("creates an empty new page and returns the ID", () => {
    const { createPage, pages } = usePages();

    const id = createPage();

    assert.deepEqual(pages[id], { id, items: [] });
  });

  test("creates a page with contents", () => {
    const { createPage, pages } = usePages();

    const id = createPage([parse("[ ] New task")]);

    assert.equal(pages[id].items[0].raw, "[ ] New task");
  });

  test("returns an empty list of pages", () => {
    const { pageList } = usePages();

    assert.equal(pageList.value.length, 0);
  });

  test("includes the page titles in the list", () => {
    const { createPage, pageList } = usePages();

    createPage([parse("Page 1")]);
    createPage([parse("Page 2")]);

    assert.deepEqual(
      pageList.value.map((i) => i.title),
      ["Page 1", "Page 2"]
    );
  });

  test("sorts the page list by the titles", () => {
    const { createPage, pageList } = usePages();

    createPage([parse("Page 3")]);
    createPage([parse("Page 1")]);
    createPage([parse("Page 2")]);

    assert.deepEqual(
      pageList.value.map((i) => i.title),
      ["Page 1", "Page 2", "Page 3"]
    );
  });

  test("updates a page", () => {
    const { pages, createPage, updatePage } = usePages();

    const id = createPage([parse("Page 1")]);
    updatePage(id, { items: [parse("Page 1.1")] });

    assert.equal(pages[id].items[0].raw, "Page 1.1");
    assert.equal(pages[id].items.length, 1);
  });

  test("doesn't crash when attempting to update a non-existent ID", () => {
    const { updatePage } = usePages();

    assert.doesNotThrow(() => {
      updatePage("foo", { items: [parse("Page 1.1")] });
    });
  });

  test("doesn't add a page when attempting to update a non-existent ID", () => {
    const { pages, updatePage } = usePages();

    updatePage("foo", { items: [parse("Page 1.1")] });

    assert.equal(Object.values(pages).length, 0);
  });

  test("removes a page", () => {
    const { pages, createPage, removePage } = usePages();

    const id = createPage();
    assert.ok(pages[id]);

    removePage(id);
    assert.ok(!pages[id]);
  });

  test("doesn't crash when attempting to remove a non-existent ID", () => {
    const { removePage } = usePages();

    assert.doesNotThrow(() => removePage("foo"));
  });

  test("persists modifications in local storage", async () => {
    const setItem = mock.method(globalThis.localStorage, "setItem");

    const { createPage, updatePage, removePage } = usePages();

    const id = createPage([parse("Page 1")]);
    await nextTick();
    assert.deepEqual(setItem.mock.calls[0].arguments, [
      "pages",
      JSON.stringify([{ id: id, text: "Page 1" }]),
    ]);

    updatePage(id, { items: [parse("Page 1.2")] });
    await nextTick();
    assert.deepEqual(setItem.mock.calls[1].arguments, [
      "pages",
      JSON.stringify([{ id: id, text: "Page 1.2" }]),
    ]);

    removePage(id);
    await nextTick();
    assert.deepEqual(setItem.mock.calls[2].arguments, [
      "pages",
      JSON.stringify([]),
    ]);
  });

  test.todo("restores previous pages from local storage", () => {
    // TODO: Not sure how to test this ...
  });

  test.todo("doesn't break when local storage has an invalid value", () => {
    // TODO: Not sure how to test this ...
  });

  test.todo("doesn't break when local storage is empty", () => {
    // TODO: Not sure how to test this ...
  });

  test("imports the serialized version of a page", () => {
    const { pages, importBackup } = usePages();

    importBackup('[{ "id": "foo", "text": "Page 1" }]');

    assert.ok(pages["foo"]);
  });

  test("does not remove existing pages not included in the backup", () => {
    const { pages, importBackup, createPage } = usePages();

    const id = createPage([parse("Page 2")]);
    importBackup('[{ "id": "foo", "text": "Page 1" }]');

    assert.ok(pages[id]);
    assert.ok(pages["foo"]);
  });

  test("does not modify existing page contents when importing", () => {
    const { pages, importBackup, createPage } = usePages();

    const id = createPage([parse("Page 1")]);
    importBackup('[{ "id": "foo", "text": "Page 1" }]');

    assert.equal(pages[id].items[0].raw, "Page 1");
    assert.ok(pages["foo"]);
  });

  test("throws an error when attempting to import an invalid backup", () => {
    const { importBackup } = usePages();

    assert.throws(() => importBackup("🐸"));
  });

  test("exports a serialized version of the current pages", () => {
    const { createPage, exportBackup } = usePages();

    const id = createPage([parse("Page 1")]);
    const backup = exportBackup();

    assert.equal(backup, JSON.stringify([{ id, text: "Page 1" }]));
  });
});
