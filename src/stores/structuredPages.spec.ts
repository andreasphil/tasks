import { parse } from "@/lib/parser";
import { afterEach, describe, expect, test, vi } from "vitest";
import { nextTick } from "vue";
import { usePages } from "./structuredPages";

describe("pages store", () => {
  afterEach(() => {
    // Reset the store to its initial state after each run
    const { pages, removePage } = usePages();
    Object.keys(pages).forEach((id) => removePage(id));

    // Reset stubs
    vi.unstubAllGlobals();
  });

  test("returns an empty list of pages", () => {
    const { pages } = usePages();

    expect(pages).toBeTruthy();
    expect(Object.values(pages)).toHaveLength(0);
  });

  test("creates an empty new page and returns the ID", () => {
    const { createPage, pages } = usePages();

    const id = createPage();

    expect(pages[id]).toEqual({ id, items: [] });
  });

  test("creates a page with contents", () => {
    const { createPage, pages } = usePages();

    const id = createPage([parse("[ ] New task")]);

    expect(pages[id].items[0].raw).toBe("[ ] New task");
  });

  test("returns an empty list of pages", () => {
    const { pageList } = usePages();

    expect(pageList.value).toHaveLength(0);
  });

  test("includes the page titles in the list", () => {
    const { createPage, pageList } = usePages();

    createPage([parse("Page 1")]);
    createPage([parse("Page 2")]);

    expect(pageList.value).toEqual([
      expect.objectContaining({ title: "Page 1" }),
      expect.objectContaining({ title: "Page 2" }),
    ]);
  });

  test("sorts the page list by the titles", () => {
    const { createPage, pageList } = usePages();

    createPage([parse("Page 3")]);
    createPage([parse("Page 1")]);
    createPage([parse("Page 2")]);

    expect(pageList.value).toEqual([
      expect.objectContaining({ title: "Page 1" }),
      expect.objectContaining({ title: "Page 2" }),
      expect.objectContaining({ title: "Page 3" }),
    ]);
  });

  test("updates a page", () => {
    const { pages, createPage, updatePage } = usePages();

    const id = createPage([parse("Page 1")]);
    updatePage(id, { items: [parse("Page 1.1")] });

    expect(pages[id].items[0].raw).toBe("Page 1.1");
    expect(pages[id].items).toHaveLength(1);
  });

  test("doesn't crash when attempting to update a non-existent ID", () => {
    const { updatePage } = usePages();

    expect(() =>
      updatePage("foo", { items: [parse("Page 1.1")] })
    ).not.toThrow();
  });

  test("doesn't add a page when attempting to update a non-existent ID", () => {
    const { pages, updatePage } = usePages();

    updatePage("foo", { items: [parse("Page 1.1")] });

    expect(Object.values(pages)).toHaveLength(0);
  });

  test("removes a page", () => {
    const { pages, createPage, removePage } = usePages();

    const id = createPage();
    expect(pages[id]).toBeTruthy();

    removePage(id);
    expect(pages[id]).toBeFalsy();
  });

  test("doesn't crash when attempting to remove a non-existent ID", () => {
    const { removePage } = usePages();

    expect(() => removePage("foo")).not.toThrow();
  });

  test("persists modifications in local storage", async () => {
    const getItem = vi.fn();
    const setItem = vi.fn();
    vi.stubGlobal("localStorage", { ...localStorage, getItem, setItem });
    const { createPage, updatePage, removePage } = usePages();

    const id = createPage([parse("Page 1")]);
    await nextTick();
    expect(setItem).toHaveBeenCalledWith(
      "pages",
      JSON.stringify([{ id: id, text: "Page 1" }])
    );

    updatePage(id, { items: [parse("Page 1.2")] });
    await nextTick();
    expect(setItem).toHaveBeenCalledWith(
      "pages",
      JSON.stringify([{ id: id, text: "Page 1.2" }])
    );

    removePage(id);
    await nextTick();
    expect(setItem).toHaveBeenCalledWith("pages", JSON.stringify([]));
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

    expect(pages["foo"]).toBeTruthy();
  });

  test("does not remove existing pages not included in the backup", () => {
    const { pages, importBackup, createPage } = usePages();

    const id = createPage([parse("Page 2")]);
    importBackup('[{ "id": "foo", "text": "Page 1" }]');

    expect(pages[id]).toBeTruthy();
    expect(pages["foo"]).toBeTruthy();
  });

  test("does not modify existing page contents when importing", () => {
    const { pages, importBackup, createPage } = usePages();

    const id = createPage([parse("Page 1")]);
    importBackup('[{ "id": "foo", "text": "Page 1" }]');

    expect(pages[id].items[0].raw).toBe("Page 1");
    expect(pages["foo"]).toBeTruthy();
  });

  test("throws an error when attempting to import an invalid backup", () => {
    const { importBackup } = usePages();

    expect(() => importBackup("🐸")).toThrow();
  });

  test("exports a serialized version of the current pages", () => {
    const { createPage, exportBackup } = usePages();

    const id = createPage([parse("Page 1")]);
    const backup = exportBackup();

    expect(backup).toBe(JSON.stringify([{ id, text: "Page 1" }]));
  });
});
