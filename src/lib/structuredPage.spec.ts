import { parse } from "@/lib/parser";
import { describe, expect, test } from "vitest";
import {
  compareByTitle,
  createModel,
  getTitle,
  type Page,
} from "./structuredPage";

describe("page", () => {
  describe("getTitle", () => {
    test("returns the title of the page", () => {
      const page: Page = createModel({
        items: [parse("Title"), parse(""), parse("Content")],
      });

      expect(getTitle(page)).toEqual("Title");
    });

    test("trims the title of the page", () => {
      const page: Page = createModel({
        items: [parse("  Title  ")],
      });

      expect(getTitle(page)).toEqual("Title");
    });

    test("returns a default title if the page is empty", () => {
      const page: Page = createModel({ items: [parse("")] });

      expect(getTitle(page)).toEqual("Untitled");
    });

    test("returns a default title if the page has no items", () => {
      const page: Page = createModel({ items: [] });

      expect(getTitle(page)).toEqual("Untitled");
    });

    test("skips blank lines when determining the title", () => {
      const page: Page = createModel({
        items: [parse(""), parse(""), parse("Title")],
      });

      expect(getTitle(page)).toEqual("Title");
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

      expect(sorted).toStrictEqual(["A", "B", "C"]);
    });

    test("does not change the order if titles are the same", () => {
      const pages: Page[] = [
        { id: "1", items: [parse("A")] },
        { id: "2", items: [parse("A")] },
        { id: "3", items: [parse("A")] },
      ];

      const sorted = pages.sort(compareByTitle).map((page) => page.id);
      expect(sorted).toStrictEqual(["1", "2", "3"]);
    });
  });
});
