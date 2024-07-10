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
      expect(r.tokens[2].text).toBe("https://example.com");
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
      expect(r.tokens[0].match).toBe("  ");
      expect(r.tokens[1].match.trim()).toBe(r.tokens[1].match);
    });

    test("ignores indentation with tabs", () => {
      const r = parse("\t[ ] Task 1");
      expect(r.tokens[0].match).toBe("\t");
      expect(r.tokens[1].match.trim()).toBe(r.tokens[1].match);
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
      expect(r.tokens[2].text).toBe("https://example.com");
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
      expect(r.tokens[1].text).toBe("https://example.com");
    });
  });

  describe("tokens", () => {
    test("returns a heading section token", () => {
      const r = parse("# Heading");
      expect(r.tokens[0]).toEqual({
        type: "headingMarker",
        text: "# ",
        match: "# ",
        matchStart: 0,
        matchLength: 2,
      });
    });

    test("returns a task status token", () => {
      const r = parse("[x] Completed task");
      expect(r.tokens[0]).toEqual({
        type: "status",
        text: "x",
        match: "[x]",
        matchStart: 0,
        matchLength: 3,
      });
    });

    test("returns a due date token", () => {
      const r = parse("[ ] Task with due date @2021-01-01 continued");
      expect(r.tokens[2]).toEqual({
        type: "dueDate",
        text: "2021-01-01",
        match: "@2021-01-01",
        matchStart: 23,
        matchLength: 11,
      });
    });

    test("returns a tag token", () => {
      const r = parse("[ ] Task with tag #tag1 continued");
      expect(r.tokens[2]).toEqual({
        type: "tag",
        text: "tag1",
        match: "#tag1",
        matchStart: 18,
        matchLength: 5,
      });
    });

    test("returns multiple tag tokens", () => {
      const r = parse("[ ] Task with tags #tag1 #tag2 continued");

      expect(r.tokens[2]).toEqual({
        type: "tag",
        text: "tag1",
        match: "#tag1",
        matchStart: 19,
        matchLength: 5,
      });
      expect(r.tokens[4]).toEqual({
        type: "tag",
        text: "tag2",
        match: "#tag2",
        matchStart: 25,
        matchLength: 5,
      });
    });

    test("also returns duplicate tag tokens", () => {
      const r = parse("[ ] Task with tags #tag1 #tag1 continued");
      expect(r.tokens[2]).toEqual({
        type: "tag",
        text: "tag1",
        match: "#tag1",
        matchStart: 19,
        matchLength: 5,
      });
      expect(r.tokens[4]).toEqual({
        type: "tag",
        text: "tag1",
        match: "#tag1",
        matchStart: 25,
        matchLength: 5,
      });
    });

    test("returns a link token", () => {
      const r = parse("[ ] Task with a link http://example.com");
      expect(r.tokens.at(-1)).toEqual({
        type: "link",
        text: "http://example.com",
        match: "http://example.com",
        matchStart: 21,
        matchLength: 18,
      });
    });

    test("returns text tokens if there's nothing but text", () => {
      const r = parse("This is a note.");
      expect(r.tokens[0]).toEqual({
        type: "text",
        text: "This is a note.",
        match: "This is a note.",
        matchStart: 0,
        matchLength: 15,
      });
    });

    test("returns text tokens the the start", () => {
      const r = parse("Note with #tag1 and @2021-01-01");
      expect(r.tokens[0]).toEqual({
        type: "text",
        text: "Note with ",
        match: "Note with ",
        matchStart: 0,
        matchLength: 10,
      });
    });

    test("returns text tokens between other tokens", () => {
      const r = parse("[ ] Task with #tag1 and @2021-01-01");
      expect(r.tokens[1]).toEqual({
        type: "text",
        text: " Task with ",
        match: " Task with ",
        matchStart: 3,
        matchLength: 11,
      });
      expect(r.tokens[3]).toEqual({
        type: "text",
        text: " and ",
        match: " and ",
        matchStart: 19,
        matchLength: 5,
      });
    });

    test("returns text tokens at the end", () => {
      const r = parse("[ ] Task with #tag1 continued");
      expect(r.tokens[3]).toEqual({
        type: "text",
        text: " continued",
        match: " continued",
        matchStart: 19,
        matchLength: 10,
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
