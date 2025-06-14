import assert from "node:assert/strict";
import { before, describe, mock, test } from "node:test";
import { parse } from "../lib/parser.ts";
import type { useTodayPage as useTodayPageFn } from "./todayPage.ts";

describe("useTodayPage", () => {
  let mocks = { updatePage: mock.fn() };
  let useTodayPage: typeof useTodayPageFn;

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
                "\t[*] With indent @2024-01-01",
              ].map((i) => parse(i)),
            },
            bar: {
              id: "bar",
              items: [
                "Page 2",
                "[ ] Due today @2024-01-01",
                "[x] Overdue completed @2023-11-01",
                "[ ] Due in the future @2024-03-01",
                "[ ] No due date",
              ].map((i) => parse(i)),
            },
            baz: {
              id: "bar",
              items: [
                "Page 3",
                "[ ] Due in the future @2024-02-01",
                "[ ] No due date",
              ].map((i) => parse(i)),
            },
          },
          updatePage: mocks.updatePage,
        }),
      },
    });

    useTodayPage = (await import("./todayPage.ts")).useTodayPage;
  });

  test("returns tasks due today grouped by page", (t) => {
    const { text } = useTodayPage();
    t.assert.snapshot(text.value);
  });

  test("returns an empty page if no tasks are due today", ({ mock }) => {
    mock.timers.enable({ apis: ["Date"], now: new Date("2023-01-01") });
    const { text } = useTodayPage();
    assert.ok(!text.value);
  });

  test("updates an item on the page", () => {
    mock.timers.enable({ apis: ["Date"], now: new Date("2024-01-01") });

    const { updateOnPage } = useTodayPage();

    updateOnPage(4, (item) => {
      item.status = "inProgress";
    });

    assert.equal(mocks.updatePage.mock.calls[0].arguments[0], "foo");
    assert.equal(
      mocks.updatePage.mock.calls[0].arguments[1].items[5].raw,
      "\t[/] With indent @2024-01-01"
    );

    updateOnPage(10, (item) => {
      item.status = "completed";
      item.dueDate = new Date(2023, 0, 1);
    });

    assert.equal(mocks.updatePage.mock.calls[1].arguments[0], "bar");
    assert.equal(
      mocks.updatePage.mock.calls[1].arguments[1].items[1].raw,
      "[x] Due today @2023-01-01"
    );
  });
});
