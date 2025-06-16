import assert from "node:assert/strict";
import { before, describe, mock, test } from "node:test";
import { parse } from "../lib/parser.ts";
import type { useTodayCount as useTodayCountFn } from "./todayCount.ts";

describe("useTodayPage", () => {
  let useTodayCount: typeof useTodayCountFn;

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
        }),
      },
    });

    useTodayCount = (await import("./todayCount.ts")).useTodayCount;
  });

  test("returns the number of tasks due today", ({ mock }) => {
    mock.timers.enable({ apis: ["Date"], now: new Date("2024-01-01") });
    const count = useTodayCount();
    assert.equal(count.value, 4);
  });
});
