import assert from "node:assert/strict";
import { before, describe, mock, test } from "node:test";
import { parse } from "../lib/parser.ts";
import type { useStatusPage as useStatusPageFn } from "./statusPage.ts";

describe("statusPage", () => {
  let mocks = { updatePage: mock.fn() };
  let useStatusPage: typeof useStatusPageFn;

  before(async () => {
    mock.module("./pages.ts", {
      namedExports: {
        usePages: () => ({
          pages: {
            foo: {
              id: "foo",
              items: [
                "Page 1",
                "[ ] Open from Page 1",
                "[/] In progress from Page 1",
                "[?] Blocked from Page 1",
                "[*] Important from Page 1",
                "[x] Completed from Page 1",
              ].map((i) => parse(i)),
            },

            bar: {
              id: "bar",
              items: [
                "Page 2",
                "[ ] Open from Page 2",
                "[/] In progress from Page 2",
                "[?] Blocked from Page 2",
                "[*] Important from Page 2",
                "[x] Completed from Page 2",
              ].map((i) => parse(i)),
            },
          },
          updatePage: mocks.updatePage,
        }),
      },
    });

    useStatusPage = (await import("./statusPage.ts")).useStatusPage;
  });

  test("returns tasks grouped by status", (t) => {
    const { items } = useStatusPage();

    t.assert.snapshot(Object.fromEntries(items.value.entries()));
  });

  test("updates an item on the page", () => {
    const { updateOnPage } = useStatusPage();

    updateOnPage(0, "incomplete", "inProgress");

    assert.equal(mocks.updatePage.mock.calls[0].arguments[0], "foo");
    assert.equal(
      mocks.updatePage.mock.calls[0].arguments[1].items[1].raw,
      "[/] Open from Page 1"
    );

    updateOnPage(1, "important", "completed");

    assert.equal(mocks.updatePage.mock.calls[1].arguments[0], "bar");
    assert.equal(
      mocks.updatePage.mock.calls[1].arguments[1].items[4].raw,
      "[x] Important from Page 2"
    );
  });
});
