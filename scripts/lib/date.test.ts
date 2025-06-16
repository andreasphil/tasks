import assert from "node:assert";
import { describe, test } from "node:test";
import { getDateHint } from "./date.ts";

describe("date", () => {
  describe("getDateHint", () => {
    test("returns the hint for today", ({ mock }) => {
      mock.timers.enable({ apis: ["Date"], now: new Date("2024-07-25") });
      const hint = getDateHint("2024-07-25");
      assert.strictEqual(hint, "Thursday (today)");
    });

    test("returns the hint for tomorrow", ({ mock }) => {
      mock.timers.enable({ apis: ["Date"], now: new Date("2024-07-25") });
      const hint = getDateHint("2024-07-26");
      assert.strictEqual(hint, "Friday (tomorrow)");
    });

    test("returns the hint for yesterday", ({ mock }) => {
      mock.timers.enable({ apis: ["Date"], now: new Date("2024-07-25") });
      const hint = getDateHint("2024-07-24");
      assert.strictEqual(hint, "Wednesday (yesterday)");
    });

    test("returns the hint for a date in the past", ({ mock }) => {
      mock.timers.enable({ apis: ["Date"], now: new Date("2024-07-25") });
      const hint = getDateHint("2024-07-20");
      assert.strictEqual(hint, "Saturday (5 days ago)");
    });

    test("returns the hint for a date in the future", ({ mock }) => {
      mock.timers.enable({ apis: ["Date"], now: new Date("2024-07-25") });
      const hint = getDateHint("2024-07-30");
      assert.strictEqual(hint, "Tuesday (in 5 days)");
    });
  });
});
