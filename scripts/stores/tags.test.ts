import assert from "node:assert/strict";
import { before, describe, mock, test } from "node:test";
import { parse } from "../lib/parser.ts";
import type { useTags as useTagsFn } from "./tags.ts";

describe("tags", () => {
  let useTags: typeof useTagsFn;

  before(async () => {
    mock.module("./pages.ts", {
      namedExports: {
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
              ].map((i) => parse(i)),
            },

            bar: {
              id: "bar",
              items: [
                "Page 2",
                "[ ] One tag from Page 2 #tag2",
                "[ ] Another one tag from Page 2 #tag2",
                "[ ] Multiple tags from Page 2 #tag2 #tag3",
                "[ ] No tags from Page 2",
              ].map((i) => parse(i)),
            },

            baz: {
              id: "bar",
              items: ["Page 3", "[ ] No tags from Page 3"].map((i) => parse(i)),
            },
          },
          updatePage: mock.fn(),
        }),
      },
    });

    useTags = (await import("./tags.ts")).useTags;
  });

  test("returns the list of tags sorted by number of occurences", () => {
    const tags = useTags();
    assert.deepEqual(tags.value, ["tag2", "tag1", "tag3"]);
  });
});
