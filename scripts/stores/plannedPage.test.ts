import assert from "node:assert/strict";
import { afterEach, before, describe, mock, test } from "node:test";
import { parse } from "../lib/parser.ts";
import type { usePlannedPage as usePlannedPageFn } from "./plannedPage.ts";

describe("usePlannedPage", () => {
  let mocks = { updatePage: mock.fn() };
  let usePlannedPage: typeof usePlannedPageFn;

  before(async () => {
    mock.module("./pages.ts", {
      namedExports: {
        usePages: () => ({
          pages: {
            foo: {
              id: "foo",
              items: [
                "Page 1",
                "[ ] Due today @2024-01-01",
                "[ ] Overdue @2023-12-01",
                "[ ] Due in the future @2024-02-01",
                "[ ] No due date",
                "\t[ ] With indent due tomorrow @2024-01-02",
              ].map((i) => parse(i)),
            },
            bar: {
              id: "bar",
              items: [
                "Page 2",
                "[x] Overdue completed @2023-11-01",
                "[ ] Due in the future @2024-03-01",
                "[ ] No due date",
              ].map((i) => parse(i)),
            },
          },
          updatePage: mocks.updatePage,
        }),
      },
    });

    usePlannedPage = (await import("./plannedPage.ts")).usePlannedPage;
  });

  afterEach(() => {
    mock.timers.reset();
  });

  test("returns planned tasks grouped by date", (t) => {
    mock.timers.enable({ apis: ["Date"], now: new Date("2024-01-01") });
    const { text } = usePlannedPage();
    t.assert.snapshot(text.value);
  });

  test("updates an item on the page", () => {
    mock.timers.enable({ apis: ["Date"], now: new Date("2024-01-01") });

    const { updateOnPage } = usePlannedPage();

    updateOnPage(4, (item) => {
      item.status = "completed";
    });

    assert.equal(mocks.updatePage.mock.calls[0].arguments[0], "foo");
    assert.equal(
      mocks.updatePage.mock.calls[0].arguments[1].items[5].raw,
      "\t[x] With indent due tomorrow @2024-01-02",
    );
  });
});
