import assert from "node:assert/strict";
import { before, describe, mock, test } from "node:test";
import { parse } from "../lib/parser.ts";
import type { useTagsPage as useTagsPageFn } from "./tagsPage.ts";

describe("tagsPage", () => {
  let mocks = { updatePage: mock.fn() };
  let useTagsPage: typeof useTagsPageFn;

  before(async () => {
    mock.module("./pages.ts", {
      namedExports: {
        usePages: () => ({
          pages: {
            foo: {
              id: "foo",
              items: [
                "Page 1",
                "[ ] One tag from Page 1 #tag1",
                "[ ] Multiple tags from Page 1 #tag1 #tag2",
                "[ ] No tags from Page 1",
                "\t[ ] Tag from Page 1 with indent #tag1",
              ].map((i) => parse(i)),
            },
            bar: {
              id: "bar",
              items: [
                "Page 2",
                "[ ] One tag from Page 2 #tag2",
                "[ ] Multiple tags from Page 2 #tag2 #tag3",
                "[ ] No tags from Page 2",
              ].map((i) => parse(i)),
            },
            baz: {
              id: "bar",
              items: ["Page 3", "[ ] No tags from Page 3"].map((i) => parse(i)),
            },
          },
          updatePage: mocks.updatePage,
        }),
      },
    });

    useTagsPage = (await import("./tagsPage.ts")).useTagsPage;
  });

  test("returns tasks due today grouped by page", (t) => {
    const { text } = useTagsPage();
    t.assert.snapshot(text.value);
  });

  test("updates an item on the page", () => {
    const { updateOnPage } = useTagsPage();

    updateOnPage(4, (item) => {
      item.status = "completed";
    });

    assert.equal(mocks.updatePage.mock.calls[0].arguments[0], "foo");
    assert.equal(
      mocks.updatePage.mock.calls[0].arguments[1].items[1].raw,
      "[x] One tag from Page 1 #tag1"
    );

    updateOnPage(11, (item) => {
      item.status = "completed";
      item.dueDate = new Date(2023, 0, 1);
    });

    assert.equal(mocks.updatePage.mock.calls[1].arguments[0], "bar");
    assert.equal(
      mocks.updatePage.mock.calls[1].arguments[1].items[1].raw,
      "[x] One tag from Page 2 #tag2 @2023-01-01"
    );
  });
});
