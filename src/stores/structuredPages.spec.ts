import { parse } from "@/lib/parser";
import { afterEach, describe, expect, test } from "vitest";
import { usePages } from "./structuredPages";

describe("pages store", () => {
  afterEach(() => {
    // Reset the store to its initial state after each run
    const { pages, removePage } = usePages();
    Object.keys(pages).forEach((id) => removePage(id));
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
});
