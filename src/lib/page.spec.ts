import { describe, expect, it } from "vitest";
import { Page, createModel, getTitle } from "./page";

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
