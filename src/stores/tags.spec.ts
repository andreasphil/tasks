import { parse } from "@/lib/parser";
import { afterEach, describe, expect, test, vi } from "vitest";
import { useTags } from "./tags";

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
          "[ ] One tag from Page 1 #tag1",
          "[ ] Multiple tags from Page 1 #tag1 #tag2",
          "[ ] No tags from Page 1",
          "\t[ ] Tag from Page 1 with indent #tag1",
        ].map(parse),
      },

      bar: {
        id: "bar",
        items: [
          "Page 2",
          "[ ] One tag from Page 2 #tag2",
          "[ ] Another one tag from Page 2 #tag2",
          "[ ] Multiple tags from Page 2 #tag2 #tag3",
          "[ ] No tags from Page 2",
        ].map(parse),
      },

      baz: {
        id: "bar",
        items: ["Page 3", "[ ] No tags from Page 3"].map(parse),
      },
    },
    updatePage: mocks.updatePage,
  }),
}));

describe("tags", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  test("returns the list of tags sorted by number of occurences", () => {
    const tags = useTags();
    expect(tags.value).toEqual(["tag2", "tag1", "tag3"]);
  });
});
