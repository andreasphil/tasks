import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";
import { getDateHint } from "./date";

describe("date", () => {
  describe("getDateHint", () => {
    beforeAll(() => {
      vi.useFakeTimers();
      vi.setSystemTime("2024-07-25");
    });

    afterAll(() => {
      vi.useRealTimers();
    });

    test("returns the hint for today", () => {
      const hint = getDateHint("2024-07-25");
      expect(hint).toBe("Thursday (today)");
    });

    test("returns the hint for tomorrow", () => {
      const hint = getDateHint("2024-07-26");
      expect(hint).toBe("Friday (tomorrow)");
    });

    test("returns the hint for yesterday", () => {
      const hint = getDateHint("2024-07-24");
      expect(hint).toBe("Wednesday (yesterday)");
    });

    test("returns the hint for a date in the past", () => {
      const hint = getDateHint("2024-07-20");
      expect(hint).toBe("Saturday (5 days ago)");
    });

    test("returns the hint for a date in the future", () => {
      const hint = getDateHint("2024-07-30");
      expect(hint).toBe("Tuesday (in 5 days)");
    });
  });
});
