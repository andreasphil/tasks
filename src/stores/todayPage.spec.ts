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
import { useTodayPage } from "./todayPage";

const mocks = vi.hoisted(() => {
  return { updatePage: vi.fn() };
});

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
        ].map(parse),
      },

      bar: {
        id: "bar",
        items: [
          "Page 2",
          "[ ] Due today @2024-01-01",
          "[x] Overdue but completed @2023-11-01",
          "[ ] Due in the future @2024-03-01",
          "[ ] No due date",
        ].map(parse),
      },

      baz: {
        id: "bar",
        items: [
          "Page 3",
          "[ ] Due in the future @2024-02-01",
          "[ ] No due date",
        ].map(parse),
      },
    },
    updatePage: mocks.updatePage,
  }),
}));

describe("useTodayPage", () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 1));
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  test("returns tasks due today grouped by page", () => {
    const { text } = useTodayPage();
    expect(text.value).toMatchSnapshot();
  });

  test("returns an empty page if no tasks are due today", () => {
    vi.setSystemTime("2023-01-01");
    const { text } = useTodayPage();
    expect(text.value).toBeFalsy();
  });
});
