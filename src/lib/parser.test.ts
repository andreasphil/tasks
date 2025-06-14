import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { parse, stringify } from "./parser.ts";

describe("parse", () => {
  describe("headings", () => {
    test("correctly identifies headings", () => {
      const r = parse("# Heading");
      assert.equal(r.type, "heading");
    });

    test("finds a single tag", () => {
      const r = parse("# Heading #tag1");
      assert.deepEqual(r.tags, ["tag1"]);
    });

    test("finds multiple tags", () => {
      const r = parse("# Heading #tag1 #tag2");
      assert.deepEqual(r.tags, ["tag1", "tag2"]);
    });

    test("ignores duplicate tags", () => {
      const r = parse("# Heading #tag1 #tag1");
      assert.deepEqual(r.tags, ["tag1"]);
    });

    test("finds a due date", () => {
      const r = parse("# Heading @2021-01-01");
      assert.deepEqual(r.dueDate, new Date("2021-01-01"));
    });

    test("finds a due date and tags", () => {
      const r = parse("# Heading #tag1 @2021-01-01");
      assert.deepEqual(r.dueDate, new Date("2021-01-01"));
      assert.deepEqual(r.tags, ["tag1"]);
    });

    test("ignores '[ ]' in the middle of a heading", () => {
      const r = parse("# Heading [ ] heading");
      assert.notEqual(r.type, "task");
    });

    test("finds an url", () => {
      const r = parse("# Heading https://example.com");
      assert.equal(r.tokens[2].type, "link");
    });

    test("reads the url correctly", () => {
      const r = parse("# Heading https://example.com");
      assert.equal(r.tokens[2].value, "https://example.com");
    });

    test("finds an automatic link", () => {
      const r = parse("# Heading EXAMPLE-1", {
        autoLinkRules: [
          { pattern: "(EXAMPLE-\\d+)", target: "https://example.com/$1" },
        ],
      });

      assert.equal(r.tokens[2].type, "link");
      assert.equal(r.tokens[2].raw, "EXAMPLE-1");
      assert.equal(r.tokens[2].value, "https://example.com/EXAMPLE-1");
    });

    test("finds multiple automatic links of the same type", () => {
      const r = parse("# EXAMPLE-1 Heading EXAMPLE-2", {
        autoLinkRules: [
          { pattern: "(EXAMPLE-\\d+)", target: "https://example.com/$1" },
        ],
      });

      assert.equal(r.tokens[1].type, "link");
      assert.equal(r.tokens[1].raw, "EXAMPLE-1");
      assert.equal(r.tokens[1].value, "https://example.com/EXAMPLE-1");

      assert.equal(r.tokens[3].type, "link");
      assert.equal(r.tokens[3].raw, "EXAMPLE-2");
      assert.equal(r.tokens[3].value, "https://example.com/EXAMPLE-2");
    });

    test("finds mulitple automatic links of different types", () => {
      const r = parse("# FOO-1 Heading BAR-2", {
        autoLinkRules: [
          { pattern: "(FOO-\\d+)", target: "https://example.com/foo/$1" },
          { pattern: "(BAR-\\d+)", target: "https://example.com/bar/$1" },
        ],
      });

      assert.equal(r.tokens[1].type, "link");
      assert.equal(r.tokens[1].raw, "FOO-1");
      assert.equal(r.tokens[1].value, "https://example.com/foo/FOO-1");

      assert.equal(r.tokens[3].type, "link");
      assert.equal(r.tokens[3].raw, "BAR-2");
      assert.equal(r.tokens[3].value, "https://example.com/bar/BAR-2");
    });
  });

  describe("tasks", () => {
    test("correctly identifies tasks", () => {
      const r = parse("[ ] Task 1");
      assert.equal(r.type, "task");
    });

    test("identifies incomplete tasks", () => {
      const r = parse("[ ] Task 1");
      if (r.type !== "task") throw new Error("Expected task");
      assert.equal(r.status, "incomplete");
    });

    test("identifies completed tasks", () => {
      const r = parse("[x] Task 1");
      if (r.type !== "task") throw new Error("Expected task");
      assert.equal(r.status, "completed");
    });

    test("identifies in-progress tasks", () => {
      const r = parse("[/] Task 1");
      if (r.type !== "task") throw new Error("Expected task");
      assert.equal(r.status, "inProgress");
    });

    test("identifies important tasks", () => {
      const r = parse("[*] Task 1");
      if (r.type !== "task") throw new Error("Expected task");
      assert.equal(r.status, "important");
    });

    test("identifies question tasks", () => {
      const r = parse("[?] Task 1");
      if (r.type !== "task") throw new Error("Expected task");
      assert.equal(r.status, "question");
    });

    test("finds a single tag", () => {
      const r = parse("[ ] Task 1 #tag1");
      assert.deepEqual(r.tags, ["tag1"]);
    });

    test("finds multiple tags", () => {
      const r = parse("[ ] Task 1 #tag1 #tag2");
      assert.deepEqual(r.tags, ["tag1", "tag2"]);
    });

    test("ignores duplicate tags", () => {
      const r = parse("[ ] Task 1 #tag1 #tag1");
      assert.deepEqual(r.tags, ["tag1"]);
    });

    test("finds a due date", () => {
      const r = parse("[ ] Task 1 @2021-01-01");
      assert.deepEqual(r.dueDate, new Date("2021-01-01"));
    });

    test("ignores an invalid due date", () => {
      const r = parse("[ ] Task 1 @invalid-date");
      assert.equal(r.dueDate, undefined);
    });

    test("finds a due date and tags", () => {
      const r = parse("[ ] Task 1 #tag1 @2021-01-01");
      assert.deepEqual(r.dueDate, new Date("2021-01-01"));
      assert.deepEqual(r.tags, ["tag1"]);
    });

    test("identifies tasks indented with spaces", () => {
      const r = parse("  [ ] Task 1");
      assert.equal(r.type, "task");
    });

    test("identifies tasks indented with tabs", () => {
      const r = parse("\t[ ] Task 1");
      assert.equal(r.type, "task");
    });

    test("ignores indentation with spaces", () => {
      const r = parse("  [ ] Task 1");
      assert.equal(r.tokens[0].raw, "  ");
      assert.equal(r.tokens[1].raw.trim(), r.tokens[1].raw);
    });

    test("ignores indentation with tabs", () => {
      const r = parse("\t[ ] Task 1");
      assert.equal(r.tokens[0].raw, "\t");
      assert.equal(r.tokens[1].raw.trim(), r.tokens[1].raw);
    });

    test("ignores '#' in the middle of a task", () => {
      const r = parse("[ ] Task # 1");
      assert.equal(r.tags.length, 0);
    });

    test("finds an url", () => {
      const r = parse("[ ] Task 1 https://example.com");
      assert.equal(r.tokens[2].type, "link");
    });

    test("reads the url correctly", () => {
      const r = parse("[ ] Task 1 https://example.com");
      assert.equal(r.tokens[2].value, "https://example.com");
    });

    test("finds an automatic link", () => {
      const r = parse("[ ] Task 1 EXAMPLE-1", {
        autoLinkRules: [
          { pattern: "(EXAMPLE-\\d+)", target: "https://example.com/$1" },
        ],
      });

      assert.equal(r.tokens[2].type, "link");
      assert.equal(r.tokens[2].raw, "EXAMPLE-1");
      assert.equal(r.tokens[2].value, "https://example.com/EXAMPLE-1");
    });

    test("finds multiple automatic links of the same type", () => {
      const r = parse("[ ] EXAMPLE-1 Task 1 EXAMPLE-2", {
        autoLinkRules: [
          { pattern: "(EXAMPLE-\\d+)", target: "https://example.com/$1" },
        ],
      });

      assert.equal(r.tokens[2].type, "link");
      assert.equal(r.tokens[2].raw, "EXAMPLE-1");
      assert.equal(r.tokens[2].value, "https://example.com/EXAMPLE-1");

      assert.equal(r.tokens[4].type, "link");
      assert.equal(r.tokens[4].raw, "EXAMPLE-2");
      assert.equal(r.tokens[4].value, "https://example.com/EXAMPLE-2");
    });

    test("finds mulitple automatic links of different types", () => {
      const r = parse("[ ] FOO-1 Task 1 BAR-2", {
        autoLinkRules: [
          { pattern: "(FOO-\\d+)", target: "https://example.com/foo/$1" },
          { pattern: "(BAR-\\d+)", target: "https://example.com/bar/$1" },
        ],
      });

      assert.equal(r.tokens[2].type, "link");
      assert.equal(r.tokens[2].raw, "FOO-1");
      assert.equal(r.tokens[2].value, "https://example.com/foo/FOO-1");

      assert.equal(r.tokens[4].type, "link");
      assert.equal(r.tokens[4].raw, "BAR-2");
      assert.equal(r.tokens[4].value, "https://example.com/bar/BAR-2");
    });
  });

  describe("notes", () => {
    test("correctly identifies notes in tasks", () => {
      const r = parse("[-] Task 1");
      assert.equal(r.type, "note");
    });

    test("correctly identifies notes", () => {
      const r = parse("Note 1");
      assert.equal(r.type, "note");
    });

    test("finds a single tag", () => {
      const r = parse("Note 1 #tag1");
      assert.deepEqual(r.tags, ["tag1"]);
    });

    test("finds multiple tags", () => {
      const r = parse("Note 1 #tag1 #tag2");
      assert.deepEqual(r.tags, ["tag1", "tag2"]);
    });

    test("ignores duplicate tags", () => {
      const r = parse("Note 1 #tag1 #tag1");
      assert.deepEqual(r.tags, ["tag1"]);
    });

    test("finds a due date", () => {
      const r = parse("Note 1 @2021-01-01");
      assert.deepEqual(r.dueDate, new Date("2021-01-01"));
    });

    test("ignores any additional due dates", () => {
      const r = parse("Note 1 @2021-01-01 @2021-01-02");
      assert.deepEqual(r.dueDate, new Date("2021-01-01"));
    });

    test("finds a due date and tags", () => {
      const r = parse("Note 1 #tag1 @2021-01-01");
      assert.deepEqual(r.dueDate, new Date("2021-01-01"));
      assert.deepEqual(r.tags, ["tag1"]);
    });

    test("ignores '#' in the middle of a note", () => {
      const r = parse("Note # 1");
      assert.equal(r.tags.length, 0);
    });

    test("ignores '[ ]' in the middle of a note", () => {
      const r = parse("Note [ ] 1");
      assert.notEqual(r.type, "task");
    });

    test("finds an url", () => {
      const r = parse("Note 1 https://example.com");
      assert.equal(r.tokens[1].type, "link");
    });

    test("reads the url correctly", () => {
      const r = parse("Note 1 https://example.com");
      assert.equal(r.tokens[1].value, "https://example.com");
    });

    test("finds an automatic link", () => {
      const r = parse("Note 1 EXAMPLE-1", {
        autoLinkRules: [
          { pattern: "(EXAMPLE-\\d+)", target: "https://example.com/$1" },
        ],
      });

      assert.equal(r.tokens[1].type, "link");
      assert.equal(r.tokens[1].raw, "EXAMPLE-1");
      assert.equal(r.tokens[1].value, "https://example.com/EXAMPLE-1");
    });

    test("finds multiple automatic links of the same type", () => {
      const r = parse("EXAMPLE-1 This is a note. EXAMPLE-2", {
        autoLinkRules: [
          { pattern: "(EXAMPLE-\\d+)", target: "https://example.com/$1" },
        ],
      });

      assert.equal(r.tokens[0].type, "link");
      assert.equal(r.tokens[0].raw, "EXAMPLE-1");
      assert.equal(r.tokens[0].value, "https://example.com/EXAMPLE-1");

      assert.equal(r.tokens[2].type, "link");
      assert.equal(r.tokens[2].raw, "EXAMPLE-2");
      assert.equal(r.tokens[2].value, "https://example.com/EXAMPLE-2");
    });

    test("finds mulitple automatic links of different types", () => {
      const r = parse("FOO-1 This is a note. BAR-2", {
        autoLinkRules: [
          { pattern: "(FOO-\\d+)", target: "https://example.com/foo/$1" },
          { pattern: "(BAR-\\d+)", target: "https://example.com/bar/$1" },
        ],
      });

      assert.equal(r.tokens[0].type, "link");
      assert.equal(r.tokens[0].raw, "FOO-1");
      assert.equal(r.tokens[0].value, "https://example.com/foo/FOO-1");

      assert.equal(r.tokens[2].type, "link");
      assert.equal(r.tokens[2].raw, "BAR-2");
      assert.equal(r.tokens[2].value, "https://example.com/bar/BAR-2");
    });
  });

  describe("tokens", () => {
    test("returns a heading section token", () => {
      const r = parse("# Heading");
      assert.deepEqual(r.tokens[0], {
        type: "headingMarker",
        value: "# ",
        raw: "# ",
        matchStart: 0,
      });
    });

    test("returns a task status token", () => {
      const r = parse("[x] Completed task");
      assert.deepEqual(r.tokens[0], {
        type: "status",
        value: "x",
        raw: "[x]",
        matchStart: 0,
      });
    });

    test("returns a due date token", () => {
      const r = parse("[ ] Task with due date @2021-01-01 continued");
      assert.deepEqual(r.tokens[2], {
        type: "dueDate",
        value: "2021-01-01",
        raw: "@2021-01-01",
        matchStart: 23,
      });
    });

    test("returns a tag token", () => {
      const r = parse("[ ] Task with tag #tag1 continued");
      assert.deepEqual(r.tokens[2], {
        type: "tag",
        value: "tag1",
        raw: "#tag1",
        matchStart: 18,
      });
    });

    test("returns multiple tag tokens", () => {
      const r = parse("[ ] Task with tags #tag1 #tag2 continued");

      assert.deepEqual(r.tokens[2], {
        type: "tag",
        value: "tag1",
        raw: "#tag1",
        matchStart: 19,
      });
      assert.deepEqual(r.tokens[4], {
        type: "tag",
        value: "tag2",
        raw: "#tag2",
        matchStart: 25,
      });
    });

    test("also returns duplicate tag tokens", () => {
      const r = parse("[ ] Task with tags #tag1 #tag1 continued");
      assert.deepEqual(r.tokens[2], {
        type: "tag",
        value: "tag1",
        raw: "#tag1",
        matchStart: 19,
      });
      assert.deepEqual(r.tokens[4], {
        type: "tag",
        value: "tag1",
        raw: "#tag1",
        matchStart: 25,
      });
    });

    test("returns a link token", () => {
      const r = parse("[ ] Task with a link http://example.com");
      assert.deepEqual(r.tokens.at(-1), {
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

      assert.deepEqual(r.tokens.at(-1), {
        type: "link",
        value: "https://example.com/EXAMPLE-1",
        raw: "EXAMPLE-1",
        matchStart: 16,
      });
    });

    test("returns text tokens if there's nothing but text", () => {
      const r = parse("This is a note.");
      assert.deepEqual(r.tokens[0], {
        type: "text",
        value: "This is a note.",
        raw: "This is a note.",
        matchStart: 0,
      });
    });

    test("returns text tokens the the start", () => {
      const r = parse("Note with #tag1 and @2021-01-01");
      assert.deepEqual(r.tokens[0], {
        type: "text",
        value: "Note with ",
        raw: "Note with ",
        matchStart: 0,
      });
    });

    test("returns text tokens between other tokens", () => {
      const r = parse("[ ] Task with #tag1 and @2021-01-01");
      assert.deepEqual(r.tokens[1], {
        type: "text",
        value: " Task with ",
        raw: " Task with ",
        matchStart: 3,
      });
      assert.deepEqual(r.tokens[3], {
        type: "text",
        value: " and ",
        raw: " and ",
        matchStart: 19,
      });
    });

    test("returns text tokens at the end", () => {
      const r = parse("[ ] Task with #tag1 continued");
      assert.deepEqual(r.tokens[3], {
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
      assert.deepEqual(stringify(parse(input)), input);
    });
  });
});
