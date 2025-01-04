import { describe, expect, test } from "vitest";
import { parse, stringify } from "./parser";

describe("parse", () => {
  describe("headings", () => {
    test("correctly identifies headings", () => {
      const r = parse("# Heading");
      expect(r.type).toBe("heading");
    });

    test("finds a single tag", () => {
      const r = parse("# Heading #tag1");
      expect(r.tags).toEqual(["tag1"]);
    });

    test("finds multiple tags", () => {
      const r = parse("# Heading #tag1 #tag2");
      expect(r.tags).toEqual(["tag1", "tag2"]);
    });

    test("ignores duplicate tags", () => {
      const r = parse("# Heading #tag1 #tag1");
      expect(r.tags).toEqual(["tag1"]);
    });

    test("finds a due date", () => {
      const r = parse("# Heading @2021-01-01");
      expect(r.dueDate).toEqual(new Date("2021-01-01"));
    });

    test("finds a due date and tags", () => {
      const r = parse("# Heading #tag1 @2021-01-01");
      expect(r.dueDate).toEqual(new Date("2021-01-01"));
      expect(r.tags).toEqual(["tag1"]);
    });

    test("ignores '[ ]' in the middle of a heading", () => {
      const r = parse("# Heading [ ] heading");
      expect(r.type).not.toBe("task");
    });

    test("finds an url", () => {
      const r = parse("# Heading https://example.com");
      expect(r.tokens[2].type).toBe("link");
    });

    test("reads the url correctly", () => {
      const r = parse("# Heading https://example.com");
      expect(r.tokens[2].value).toBe("https://example.com");
    });

    test("finds an automatic link", () => {
      const r = parse("# Heading EXAMPLE-1", {
        autoLinkRules: [
          { pattern: "(EXAMPLE-\\d+)", target: "https://example.com/$1" },
        ],
      });

      expect(r.tokens[2].type).toBe("link");
      expect(r.tokens[2].raw).toBe("EXAMPLE-1");
      expect(r.tokens[2].value).toBe("https://example.com/EXAMPLE-1");
    });

    test("finds multiple automatic links of the same type", () => {
      const r = parse("# EXAMPLE-1 Heading EXAMPLE-2", {
        autoLinkRules: [
          { pattern: "(EXAMPLE-\\d+)", target: "https://example.com/$1" },
        ],
      });

      expect(r.tokens[1].type).toBe("link");
      expect(r.tokens[1].raw).toBe("EXAMPLE-1");
      expect(r.tokens[1].value).toBe("https://example.com/EXAMPLE-1");

      expect(r.tokens[3].type).toBe("link");
      expect(r.tokens[3].raw).toBe("EXAMPLE-2");
      expect(r.tokens[3].value).toBe("https://example.com/EXAMPLE-2");
    });

    test("finds mulitple automatic links of different types", () => {
      const r = parse("# FOO-1 Heading BAR-2", {
        autoLinkRules: [
          { pattern: "(FOO-\\d+)", target: "https://example.com/foo/$1" },
          { pattern: "(BAR-\\d+)", target: "https://example.com/bar/$1" },
        ],
      });

      expect(r.tokens[1].type).toBe("link");
      expect(r.tokens[1].raw).toBe("FOO-1");
      expect(r.tokens[1].value).toBe("https://example.com/foo/FOO-1");

      expect(r.tokens[3].type).toBe("link");
      expect(r.tokens[3].raw).toBe("BAR-2");
      expect(r.tokens[3].value).toBe("https://example.com/bar/BAR-2");
    });
  });

  describe("tasks", () => {
    test("correctly identifies tasks", () => {
      const r = parse("[ ] Task 1");
      expect(r.type).toBe("task");
    });

    test("identifies incomplete tasks", () => {
      const r = parse("[ ] Task 1");
      if (r.type !== "task") throw new Error("Expected task");
      expect(r.status).toBe("incomplete");
    });

    test("identifies completed tasks", () => {
      const r = parse("[x] Task 1");
      if (r.type !== "task") throw new Error("Expected task");
      expect(r.status).toBe("completed");
    });

    test("identifies in-progress tasks", () => {
      const r = parse("[/] Task 1");
      if (r.type !== "task") throw new Error("Expected task");
      expect(r.status).toBe("inProgress");
    });

    test("identifies important tasks", () => {
      const r = parse("[*] Task 1");
      if (r.type !== "task") throw new Error("Expected task");
      expect(r.status).toBe("important");
    });

    test("identifies question tasks", () => {
      const r = parse("[?] Task 1");
      if (r.type !== "task") throw new Error("Expected task");
      expect(r.status).toBe("question");
    });

    test("finds a single tag", () => {
      const r = parse("[ ] Task 1 #tag1");
      expect(r.tags).toEqual(["tag1"]);
    });

    test("finds multiple tags", () => {
      const r = parse("[ ] Task 1 #tag1 continued text #tag2");
      expect(r.tags).toEqual(["tag1", "tag2"]);
    });

    test("ignores duplicate tags", () => {
      const r = parse("[ ] Task 1 #tag1 #tag1");
      expect(r.tags).toEqual(["tag1"]);
    });

    test("finds a due date", () => {
      const r = parse("[ ] Task 1 @2021-01-01");
      expect(r.dueDate).toEqual(new Date("2021-01-01"));
    });

    test("ignores an invalid due date", () => {
      const r = parse("[ ] Task 1 @2021-01-32");
      expect(r.dueDate).toBeUndefined();
    });

    test("finds a due date and tags", () => {
      const r = parse("[ ] Task 1 #tag1 @2021-01-01 text #tag2");
      expect(r.dueDate).toEqual(new Date("2021-01-01"));
      expect(r.tags).toEqual(["tag1", "tag2"]);
    });

    test("identifies tasks indented with spaces", () => {
      const r = parse("  [ ] Task 1");
      expect(r.type).toBe("task");
    });

    test("identifies tasks indented with tabs", () => {
      const r = parse("\t[ ] Task 1");
      expect(r.type).toBe("task");
    });

    test("ignores indentation with spaces", () => {
      const r = parse("  [ ] Task 1");
      expect(r.tokens[0].raw).toBe("  ");
      expect(r.tokens[1].raw.trim()).toBe(r.tokens[1].raw);
    });

    test("ignores indentation with tabs", () => {
      const r = parse("\t[ ] Task 1");
      expect(r.tokens[0].raw).toBe("\t");
      expect(r.tokens[1].raw.trim()).toBe(r.tokens[1].raw);
    });

    test("ignores '#' in the middle of a task", () => {
      const r = parse("[ ] Task 1 # Not a heading");
      expect(r.tags).toEqual([]);
    });

    test("finds an url", () => {
      const r = parse("[ ] Task 1 https://example.com");
      expect(r.tokens[2].type).toBe("link");
    });

    test("reads the url correctly", () => {
      const r = parse("[ ] Task 1 https://example.com");
      expect(r.tokens[2].value).toBe("https://example.com");
    });

    test("finds an automatic link", () => {
      const r = parse("[ ] Task 1 EXAMPLE-1", {
        autoLinkRules: [
          { pattern: "(EXAMPLE-\\d+)", target: "https://example.com/$1" },
        ],
      });

      expect(r.tokens[2].type).toBe("link");
      expect(r.tokens[2].raw).toBe("EXAMPLE-1");
      expect(r.tokens[2].value).toBe("https://example.com/EXAMPLE-1");
    });

    test("finds multiple automatic links of the same type", () => {
      const r = parse("[ ] EXAMPLE-1 Task 1 EXAMPLE-2", {
        autoLinkRules: [
          { pattern: "(EXAMPLE-\\d+)", target: "https://example.com/$1" },
        ],
      });

      expect(r.tokens[2].type).toBe("link");
      expect(r.tokens[2].raw).toBe("EXAMPLE-1");
      expect(r.tokens[2].value).toBe("https://example.com/EXAMPLE-1");

      expect(r.tokens[4].type).toBe("link");
      expect(r.tokens[4].raw).toBe("EXAMPLE-2");
      expect(r.tokens[4].value).toBe("https://example.com/EXAMPLE-2");
    });

    test("finds mulitple automatic links of different types", () => {
      const r = parse("[ ] FOO-1 Task 1 BAR-2", {
        autoLinkRules: [
          { pattern: "(FOO-\\d+)", target: "https://example.com/foo/$1" },
          { pattern: "(BAR-\\d+)", target: "https://example.com/bar/$1" },
        ],
      });

      expect(r.tokens[2].type).toBe("link");
      expect(r.tokens[2].raw).toBe("FOO-1");
      expect(r.tokens[2].value).toBe("https://example.com/foo/FOO-1");

      expect(r.tokens[4].type).toBe("link");
      expect(r.tokens[4].raw).toBe("BAR-2");
      expect(r.tokens[4].value).toBe("https://example.com/bar/BAR-2");
    });
  });

  describe("notes", () => {
    test("correctly identifies notes in tasks", () => {
      const r = parse("[-] This is a note.");
      expect(r.type).toBe("note");
    });

    test("correctly identifies notes", () => {
      const r = parse("This is a note.");
      expect(r.type).toBe("note");
    });

    test("finds a single tag", () => {
      const r = parse("This is a note. #tag1");
      expect(r.tags).toEqual(["tag1"]);
    });

    test("finds multiple tags", () => {
      const r = parse("This is a note. #tag1 continued #tag2");
      expect(r.tags).toEqual(["tag1", "tag2"]);
    });

    test("ignores duplicate tags", () => {
      const r = parse("This is a note. #tag1 #tag1");
      expect(r.tags).toEqual(["tag1"]);
    });

    test("finds a due date", () => {
      const r = parse("This is a note. @2021-01-01");
      expect(r.dueDate).toEqual(new Date("2021-01-01"));
    });

    test("ignores any additional due dates", () => {
      const r = parse("This is a note. @2021-01-01 @2021-01-02");
      expect(r.dueDate).toEqual(new Date("2021-01-01"));
    });

    test("finds a due date and tags", () => {
      const r = parse("This is a note. #tag1 @2021-01-01 #tag2");
      expect(r.dueDate).toEqual(new Date("2021-01-01"));
      expect(r.tags).toEqual(["tag1", "tag2"]);
    });

    test("ignores '#' in the middle of a note", () => {
      const r = parse("This is a note. # Not a heading");
      expect(r.tags).toEqual([]);
    });

    test("ignores '[ ]' in the middle of a note", () => {
      const r = parse("This is a note. [ ] Not a task");
      expect(r.type).not.toBe("task");
    });

    test("finds an url", () => {
      const r = parse("This is a note. https://example.com");
      expect(r.tokens[1].type).toBe("link");
    });

    test("reads the url correctly", () => {
      const r = parse("This is a note. https://example.com");
      expect(r.tokens[1].value).toBe("https://example.com");
    });

    test("finds an automatic link", () => {
      const r = parse("This is a note. EXAMPLE-1", {
        autoLinkRules: [
          { pattern: "(EXAMPLE-\\d+)", target: "https://example.com/$1" },
        ],
      });

      expect(r.tokens[1].type).toBe("link");
      expect(r.tokens[1].raw).toBe("EXAMPLE-1");
      expect(r.tokens[1].value).toBe("https://example.com/EXAMPLE-1");
    });

    test("finds multiple automatic links of the same type", () => {
      const r = parse("EXAMPLE-1 This is a note. EXAMPLE-2", {
        autoLinkRules: [
          { pattern: "(EXAMPLE-\\d+)", target: "https://example.com/$1" },
        ],
      });

      expect(r.tokens[0].type).toBe("link");
      expect(r.tokens[0].raw).toBe("EXAMPLE-1");
      expect(r.tokens[0].value).toBe("https://example.com/EXAMPLE-1");

      expect(r.tokens[2].type).toBe("link");
      expect(r.tokens[2].raw).toBe("EXAMPLE-2");
      expect(r.tokens[2].value).toBe("https://example.com/EXAMPLE-2");
    });

    test("finds mulitple automatic links of different types", () => {
      const r = parse("FOO-1 This is a note. BAR-2", {
        autoLinkRules: [
          { pattern: "(FOO-\\d+)", target: "https://example.com/foo/$1" },
          { pattern: "(BAR-\\d+)", target: "https://example.com/bar/$1" },
        ],
      });

      expect(r.tokens[0].type).toBe("link");
      expect(r.tokens[0].raw).toBe("FOO-1");
      expect(r.tokens[0].value).toBe("https://example.com/foo/FOO-1");

      expect(r.tokens[2].type).toBe("link");
      expect(r.tokens[2].raw).toBe("BAR-2");
      expect(r.tokens[2].value).toBe("https://example.com/bar/BAR-2");
    });
  });

  describe("tokens", () => {
    test("returns a heading section token", () => {
      const r = parse("# Heading");
      expect(r.tokens[0]).toEqual({
        type: "headingMarker",
        value: "# ",
        raw: "# ",
        matchStart: 0,
      });
    });

    test("returns a task status token", () => {
      const r = parse("[x] Completed task");
      expect(r.tokens[0]).toEqual({
        type: "status",
        value: "x",
        raw: "[x]",
        matchStart: 0,
      });
    });

    test("returns a due date token", () => {
      const r = parse("[ ] Task with due date @2021-01-01 continued");
      expect(r.tokens[2]).toEqual({
        type: "dueDate",
        value: "2021-01-01",
        raw: "@2021-01-01",
        matchStart: 23,
      });
    });

    test("returns a tag token", () => {
      const r = parse("[ ] Task with tag #tag1 continued");
      expect(r.tokens[2]).toEqual({
        type: "tag",
        value: "tag1",
        raw: "#tag1",
        matchStart: 18,
      });
    });

    test("returns multiple tag tokens", () => {
      const r = parse("[ ] Task with tags #tag1 #tag2 continued");

      expect(r.tokens[2]).toEqual({
        type: "tag",
        value: "tag1",
        raw: "#tag1",
        matchStart: 19,
      });
      expect(r.tokens[4]).toEqual({
        type: "tag",
        value: "tag2",
        raw: "#tag2",
        matchStart: 25,
      });
    });

    test("also returns duplicate tag tokens", () => {
      const r = parse("[ ] Task with tags #tag1 #tag1 continued");
      expect(r.tokens[2]).toEqual({
        type: "tag",
        value: "tag1",
        raw: "#tag1",
        matchStart: 19,
      });
      expect(r.tokens[4]).toEqual({
        type: "tag",
        value: "tag1",
        raw: "#tag1",
        matchStart: 25,
      });
    });

    test("returns a link token", () => {
      const r = parse("[ ] Task with a link http://example.com");
      expect(r.tokens.at(-1)).toEqual({
        type: "link",
        value: "http://example.com",
        raw: "http://example.com",
        matchStart: 21,
      });
    });

    test("returns an automatic link token", () => {
      const r = parse("This is a note. EXAMPLE-1", {
        autoLinkRules: [
          { pattern: "(EXAMPLE-\\d+)", target: "https://example.com/$1" },
        ],
      });

      expect(r.tokens.at(-1)).toEqual({
        type: "link",
        value: "https://example.com/EXAMPLE-1",
        raw: "EXAMPLE-1",
        matchStart: 16,
      });
    });

    test("returns text tokens if there's nothing but text", () => {
      const r = parse("This is a note.");
      expect(r.tokens[0]).toEqual({
        type: "text",
        value: "This is a note.",
        raw: "This is a note.",
        matchStart: 0,
      });
    });

    test("returns text tokens the the start", () => {
      const r = parse("Note with #tag1 and @2021-01-01");
      expect(r.tokens[0]).toEqual({
        type: "text",
        value: "Note with ",
        raw: "Note with ",
        matchStart: 0,
      });
    });

    test("returns text tokens between other tokens", () => {
      const r = parse("[ ] Task with #tag1 and @2021-01-01");
      expect(r.tokens[1]).toEqual({
        type: "text",
        value: " Task with ",
        raw: " Task with ",
        matchStart: 3,
      });
      expect(r.tokens[3]).toEqual({
        type: "text",
        value: " and ",
        raw: " and ",
        matchStart: 19,
      });
    });

    test("returns text tokens at the end", () => {
      const r = parse("[ ] Task with #tag1 continued");
      expect(r.tokens[3]).toEqual({
        type: "text",
        value: " continued",
        raw: " continued",
        matchStart: 19,
      });
    });
  });
});

describe("stringify", () => {
  [
    "  [ ] Task 1",
    "[ ] Task 1 @2021-01-01",
    "[ ] Task 1 # Not a heading",
    "[ ] Task 1 #tag1 @2021-01-01 text #tag2",
    "[ ] Task 1 #tag1 #tag1",
    "[ ] Task 1 #tag1 continued text #tag2",
    "[ ] Task 1 #tag1",
    "[ ] Task 1 https://example.com",
    "[ ] Task 1",
    "[ ] Task with #tag1 and @2021-01-01",
    "[ ] Task with #tag1 continued",
    "[ ] Task with due date @2021-01-01 continued",
    "[ ] Task with tag #tag1 continued",
    "[ ] Task with tags #tag1 #tag1 continued",
    "[-] This is a note.",
    "[?] Task 1",
    "[*] Task 1",
    "[/] Task 1",
    "[x] Completed task",
    "[x] Task 1",
    "\t[ ] Task 1",
    "# Heading @2021-01-01",
    "# Heading [ ] heading",
    "# Heading #tag1 @2021-01-01",
    "# Heading #tag1 #tag1",
    "# Heading #tag1",
    "# Heading https://example.com",
    "# Heading",
    "Note with #tag1 and @2021-01-01",
    "This is a note. @2021-01-01 @2021-01-02",
    "This is a note. @2021-01-01",
    "This is a note. [ ] Not a task",
    "This is a note. # Not a heading",
    "This is a note. #tag1 @2021-01-01 #tag2",
    "This is a note. #tag1 #tag1",
    "This is a note. #tag1 continued #tag2",
    "This is a note. #tag1",
    "This is a note. https://example.com",
    "This is a note.",
  ].forEach((input) => {
    test(`produces identical input and output for "${input}"`, () => {
      expect(stringify(parse(input))).toEqual(input);
    });
  });
});
