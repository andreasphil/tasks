import { parse } from "@/lib/parser";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  test,
  vi,
} from "vitest";
import { useTodayCount } from "./todayCount";

vi.mock("@/stores/pages", () => ({
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
}));

describe("useTodayPage", () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime("2024-01-01");
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  test("returns the number of tasks due today", () => {
    const count = useTodayCount();
    expect(count.value).toBe(4);
  });
});
