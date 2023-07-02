import { describe, expect, it } from "vitest";
import { parse, stringify } from "./parser"; // TODO: Use path alias

describe("parser", () => {
  describe("headings", () => {
    it("correctly identifies headings", () => {
      const r = parse("# Heading");
      expect(r.type).toBe("heading");
    });

    it("finds a single tag", () => {
      const r = parse("# Heading #tag1");
      expect(r.tags).toEqual(["tag1"]);
    });

    it("finds multiple tags", () => {
      const r = parse("# Heading #tag1 #tag2");
      expect(r.tags).toEqual(["tag1", "tag2"]);
    });

    it("ignores duplicate tags", () => {
      const r = parse("# Heading #tag1 #tag1");
      expect(r.tags).toEqual(["tag1"]);
    });

    it("finds a due date", () => {
      const r = parse("# Heading ->2021-01-01");
      expect(r.dueDate).toEqual(new Date("2021-01-01"));
    });

    it("finds a due date and tags", () => {
      const r = parse("# Heading #tag1 ->2021-01-01");
      expect(r.dueDate).toEqual(new Date("2021-01-01"));
      expect(r.tags).toEqual(["tag1"]);
    });

    it("ignores '[ ]' in the middle of a heading", () => {
      const r = parse("# Heading [ ] heading");
      expect(r.type).toBe("heading");
    });

    it("finds an url", () => {
      const r = parse("# Heading https://example.com");
      expect(r.tokens[2].type).toBe("link");
    });

    it("reads the url correctly", () => {
      const r = parse("# Heading https://example.com");
      expect(r.tokens[2].text).toBe("https://example.com");
    });
  });

  describe("tasks", () => {
    it("correctly identifies tasks", () => {
      const r = parse("[ ] Task 1");
      expect(r.type).toBe("task");
    });

    it("identifies incomplete tasks", () => {
      const r = parse("[ ] Task 1");
      if (r.type !== "task") throw new Error("Expected task");
      expect(r.status).toBe("incomplete");
    });

    it("identifies completed tasks", () => {
      const r = parse("[x] Task 1");
      if (r.type !== "task") throw new Error("Expected task");
      expect(r.status).toBe("completed");
    });

    it("identifies in-progress tasks", () => {
      const r = parse("[/] Task 1");
      if (r.type !== "task") throw new Error("Expected task");
      expect(r.status).toBe("inProgress");
    });

    it("identifies important tasks", () => {
      const r = parse("[*] Task 1");
      if (r.type !== "task") throw new Error("Expected task");
      expect(r.status).toBe("important");
    });

    it("identifies question tasks", () => {
      const r = parse("[?] Task 1");
      if (r.type !== "task") throw new Error("Expected task");
      expect(r.status).toBe("question");
    });

    it("finds a single tag", () => {
      const r = parse("[ ] Task 1 #tag1");
      expect(r.tags).toEqual(["tag1"]);
    });

    it("finds multiple tags", () => {
      const r = parse("[ ] Task 1 #tag1 continued text #tag2");
      expect(r.tags).toEqual(["tag1", "tag2"]);
    });

    it("ignores duplicate tags", () => {
      const r = parse("[ ] Task 1 #tag1 #tag1");
      expect(r.tags).toEqual(["tag1"]);
    });

    it("finds a due date", () => {
      const r = parse("[ ] Task 1 ->2021-01-01");
      expect(r.dueDate).toEqual(new Date("2021-01-01"));
    });

    it("finds a due date and tags", () => {
      const r = parse("[ ] Task 1 #tag1 ->2021-01-01 text #tag2");
      expect(r.dueDate).toEqual(new Date("2021-01-01"));
      expect(r.tags).toEqual(["tag1", "tag2"]);
    });

    it("ignores indentation with spaces", () => {
      const r = parse("  [ ] Task 1");
      expect(r.type).toBe("task");
    });

    it("ignores indentation with tabs", () => {
      const r = parse("\t[ ] Task 1");
      expect(r.type).toBe("task");
    });

    it("ignores '#' in the middle of a task", () => {
      const r = parse("[ ] Task 1 # Not a heading");
      expect(r.tags).toEqual([]);
    });

    it("finds an url", () => {
      const r = parse("[ ] Task 1 https://example.com");
      expect(r.tokens[2].type).toBe("link");
    });

    it("reads the url correctly", () => {
      const r = parse("[ ] Task 1 https://example.com");
      expect(r.tokens[2].text).toBe("https://example.com");
    });
  });

  describe("notes", () => {
    it("correctly identifies notes in tasks", () => {
      const r = parse("[-] This is a note.");
      expect(r.type).toBe("note");
    });

    it("correctly identifies notes", () => {
      const r = parse("This is a note.");
      expect(r.type).toBe("note");
    });

    it("finds a single tag", () => {
      const r = parse("This is a note. #tag1");
      expect(r.tags).toEqual(["tag1"]);
    });

    it("finds multiple tags", () => {
      const r = parse("This is a note. #tag1 continued #tag2");
      expect(r.tags).toEqual(["tag1", "tag2"]);
    });

    it("ignores duplicate tags", () => {
      const r = parse("This is a note. #tag1 #tag1");
      expect(r.tags).toEqual(["tag1"]);
    });

    it("finds a due date", () => {
      const r = parse("This is a note. ->2021-01-01");
      expect(r.dueDate).toEqual(new Date("2021-01-01"));
    });

    it("ignores any additional due dates", () => {
      const r = parse("This is a note. ->2021-01-01 ->2021-01-02");
      expect(r.dueDate).toEqual(new Date("2021-01-01"));
    });

    it("finds a due date and tags", () => {
      const r = parse("This is a note. #tag1 ->2021-01-01 #tag2");
      expect(r.dueDate).toEqual(new Date("2021-01-01"));
      expect(r.tags).toEqual(["tag1", "tag2"]);
    });

    it("ignores '#' in the middle of a note", () => {
      const r = parse("This is a note. # Not a heading");
      expect(r.tags).toEqual([]);
    });

    it("ignores '[ ]' in the middle of a note", () => {
      const r = parse("This is a note. [ ] Not a task");
      expect(r.tags).toEqual([]);
    });

    it("finds an url", () => {
      const r = parse("This is a note. https://example.com");
      expect(r.tokens[1].type).toBe("link");
    });

    it("reads the url correctly", () => {
      const r = parse("This is a note. https://example.com");
      expect(r.tokens[1].text).toBe("https://example.com");
    });
  });

  describe("tokens", () => {
    it("returns a heading section token", () => {
      const r = parse("# Heading");
      expect(r.tokens[0]).toEqual({
        type: "headingMarker",
        text: "# ",
        match: "# ",
        matchStart: 0,
        matchLength: 2,
      });
    });

    it("returns a task status token", () => {
      const r = parse("[x] Completed task");
      expect(r.tokens[0]).toEqual({
        type: "status",
        text: "x",
        match: "[x]",
        matchStart: 0,
        matchLength: 3,
      });
    });

    it("returns a due date token", () => {
      const r = parse("[ ] Task with due date ->2021-01-01 continued");
      expect(r.tokens[2]).toEqual({
        type: "dueDate",
        text: "2021-01-01",
        match: "->2021-01-01",
        matchStart: 23,
        matchLength: 12,
      });
    });

    it("returns a tag token", () => {
      const r = parse("[ ] Task with tag #tag1 continued");
      expect(r.tokens[2]).toEqual({
        type: "tag",
        text: "tag1",
        match: "#tag1",
        matchStart: 18,
        matchLength: 5,
      });
    });

    it("returns multiple tag tokens", () => {
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

    it("also returns duplicate tag tokens", () => {
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

    it("returns text tokens if there's nothing but text", () => {
      const r = parse("This is a note.");
      expect(r.tokens[0]).toEqual({
        type: "text",
        text: "This is a note.",
        match: "This is a note.",
        matchStart: 0,
        matchLength: 15,
      });
    });

    it("returns text tokens the the start", () => {
      const r = parse("Note with #tag1 and ->2021-01-01");
      expect(r.tokens[0]).toEqual({
        type: "text",
        text: "Note with ",
        match: "Note with ",
        matchStart: 0,
        matchLength: 10,
      });
    });

    it("returns text tokens between other tokens", () => {
      const r = parse("[ ] Task with #tag1 and ->2021-01-01");
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

    it("returns text tokens at the end", () => {
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

describe("stringifier", () => {
  [
    "  [ ] Task 1",
    "[ ] Task 1 ->2021-01-01",
    "[ ] Task 1 # Not a heading",
    "[ ] Task 1 #tag1 ->2021-01-01 text #tag2",
    "[ ] Task 1 #tag1 #tag1",
    "[ ] Task 1 #tag1 continued text #tag2",
    "[ ] Task 1 #tag1",
    "[ ] Task 1 https://example.com",
    "[ ] Task 1",
    "[ ] Task with #tag1 and ->2021-01-01",
    "[ ] Task with #tag1 continued",
    "[ ] Task with due date ->2021-01-01 continued",
    "[ ] Task with tag #tag1 continued",
    "[ ] Task with tags #tag1 #tag1 continued",
    "[-] This is a note.",
    "[?] Task 1",
    "[*] Task 1",
    "[/] Task 1",
    "[x] Completed task",
    "[x] Task 1",
    "\t[ ] Task 1",
    "# Heading ->2021-01-01",
    "# Heading [ ] heading",
    "# Heading #tag1 ->2021-01-01",
    "# Heading #tag1 #tag1",
    "# Heading #tag1",
    "# Heading https://example.com",
    "# Heading",
    "Note with #tag1 and ->2021-01-01",
    "This is a note. ->2021-01-01 ->2021-01-02",
    "This is a note. ->2021-01-01",
    "This is a note. [ ] Not a task",
    "This is a note. # Not a heading",
    "This is a note. #tag1 ->2021-01-01 #tag2",
    "This is a note. #tag1 #tag1",
    "This is a note. #tag1 continued #tag2",
    "This is a note. #tag1",
    "This is a note. https://example.com",
    "This is a note.",
  ].forEach((input) => {
    it(`produces identical input and output for "${input}"`, () => {
      expect(stringify(parse(input))).toEqual(input);
    })
  })
});
