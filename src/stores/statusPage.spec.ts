import { parse } from "@/lib/parser";
import { afterEach, describe, expect, test, vi } from "vitest";
import { useStatusPage } from "./statusPage";

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
          "[ ] Open from Page 1",
          "[/] In progress from Page 1",
          "[?] Blocked from Page 1",
          "[*] Important from Page 1",
          "[x] Completed from Page 1",
        ].map(parse),
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
        ].map(parse),
      },
    },
    updatePage: mocks.updatePage,
  }),
}));

describe("statusPage", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  test("returns tasks grouped by status", () => {
    const { items } = useStatusPage();
    expect(items.value).toMatchSnapshot();
  });

  test("updates an item on the page", () => {
    const { updateOnPage } = useStatusPage();

    updateOnPage(0, "incomplete", "inProgress");

    expect(mocks.updatePage).toHaveBeenNthCalledWith(
      1,
      "foo",
      expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({ raw: "[/] Open from Page 1" }),
        ]),
      })
    );

    updateOnPage(1, "important", "completed");

    expect(mocks.updatePage).toHaveBeenNthCalledWith(
      2,
      "bar",
      expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({ raw: "[x] Important from Page 2" }),
        ]),
      })
    );
  });
});
