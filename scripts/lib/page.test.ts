import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { compareByTitle, createModel, getTitle, type Page } from "./page.ts";
import { parse } from "./parser.ts";

describe("page", () => {
  describe("getTitle", () => {
    test("returns the title of the page", () => {
      const page: Page = createModel({
        items: [parse("Title"), parse(""), parse("Content")],
      });

      assert.equal(getTitle(page), "Title");
    });

    test("trims the title of the page", () => {
      const page: Page = createModel({
        items: [parse("  Title  ")],
      });

      assert.equal(getTitle(page), "Title");
    });

    test("remove a heading marker from the title", () => {
      const page: Page = createModel({
        items: [parse("# Title")],
      });

      assert.equal(getTitle(page), "Title");
    });

    test("returns a default title if the page is empty", () => {
      const page: Page = createModel({ items: [parse("")] });

      assert.equal(getTitle(page), "Untitled");
    });

    test("returns a default title if the page has no items", () => {
      const page: Page = createModel({ items: [] });

      assert.equal(getTitle(page), "Untitled");
    });

    test("skips blank lines when determining the title", () => {
      const page: Page = createModel({
        items: [parse(""), parse(""), parse("Title")],
      });

      assert.equal(getTitle(page), "Title");
    });
  });

  describe("compareByTitle", () => {
    test("sorts alphabetically", () => {
      const pages: Page[] = [
        { id: "1", items: [parse("B")] },
        { id: "2", items: [parse("C")] },
        { id: "3", items: [parse("A")] },
      ];

      const sorted = pages
        .sort(compareByTitle)
        .map((page) => page.items[0].raw);

      assert.deepEqual(sorted, ["A", "B", "C"]);
    });

    test("does not change the order if titles are the same", () => {
      const pages: Page[] = [
        { id: "1", items: [parse("A")] },
        { id: "2", items: [parse("A")] },
        { id: "3", items: [parse("A")] },
      ];

      const sorted = pages.sort(compareByTitle).map((page) => page.id);
      assert.deepEqual(sorted, ["1", "2", "3"]);
    });
  });
});
