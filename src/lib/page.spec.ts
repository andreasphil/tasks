import { describe, expect, it } from "vitest";
import { compareByTitle, createModel, getTitle, type Page } from "./page";

describe("page", () => {
  describe("getTitle", () => {
    it("returns the title of the page", () => {
      const page: Page = createModel({ text: "Title\nContent" });
      expect(getTitle(page)).toEqual("Title");
    });

    it("trims the title of the page", () => {
      const page: Page = createModel({ text: "  Title  \nContent" });
      expect(getTitle(page)).toEqual("Title");
    });

    it("returns a default title if the page is empty", () => {
      const page: Page = createModel({ text: "" });
      expect(getTitle(page)).toEqual("Untitled");
    });

    it("skips blank lines when determining the title", () => {
      const page: Page = createModel({ text: "\n\nTitle" });
      expect(getTitle(page)).toEqual("Title");
    });
  });

  describe("compareByTitle", () => {
    it("sorts alphabetically", () => {
      const pages: Page[] = [
        { id: "1", text: "B" },
        { id: "2", text: "C" },
        { id: "3", text: "A" },
      ];

      const sorted = pages.sort(compareByTitle).map((page) => page.text);
      expect(sorted).toStrictEqual(["A", "B", "C"]);
    });

    it("does not change the order if titles are the same", () => {
      const pages: Page[] = [
        { id: "1", text: "A" },
        { id: "2", text: "A" },
        { id: "3", text: "A" },
      ];

      const sorted = pages.sort(compareByTitle).map((page) => page.id);
      expect(sorted).toStrictEqual(["1", "2", "3"]);
    });
  });
});
