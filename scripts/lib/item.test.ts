import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { asWritable, compare, mutate } from "./item.ts";
import { parse, type Item } from "./parser.ts";

describe("item", () => {
  describe("set type", () => {
    type Fixtures = Array<{
      source: string;
      changeTo: Item["type"];
      expected: string;
    }>;

    test("changes the type of the item", () => {
      const items: Fixtures = [
        // Task conversion
        { source: "[ ] Task 1", changeTo: "task", expected: "[ ] Task 1" },
        { source: "[ ] Task 1", changeTo: "heading", expected: "# Task 1" },
        { source: "[ ] Task 1", changeTo: "note", expected: "Task 1" },

        // Heading conversion
        { source: "# Heading 1", changeTo: "task", expected: "[ ] Heading 1" },
        { source: "# Heading 1", changeTo: "heading", expected: "# Heading 1" },
        { source: "# Heading 1", changeTo: "note", expected: "Heading 1" },

        // Note conversion
        { source: "Note 1", changeTo: "task", expected: "[ ] Note 1" },
        { source: "Note 1", changeTo: "heading", expected: "# Note 1" },
        { source: "Note 1", changeTo: "note", expected: "Note 1" },
        { source: "[-] Note 1", changeTo: "task", expected: "[ ] Note 1" },
        { source: "[-] Note 1", changeTo: "heading", expected: "# Note 1" },
        { source: "[-] Note 1", changeTo: "note", expected: "[-] Note 1" },
      ];

      items.forEach(({ source, changeTo, expected }) => {
        const r = parse(source);
        const writable = asWritable(r);

        writable.type = changeTo;
        const newR = parse(expected);
        assert.deepEqual(writable, newR);
      });
    });

    test("removes whitespace when converting from a task to a heading", () => {
      const items: Fixtures = [
        { source: "    [ ] Task 1", changeTo: "heading", expected: "# Task 1" },
        { source: "  Note 1", changeTo: "heading", expected: "# Note 1" },
      ];

      items.forEach(({ source, changeTo, expected }) => {
        const r = parse(source);
        const writable = asWritable(r);

        writable.type = changeTo;
        const newR = parse(expected);
        assert.deepEqual(writable, newR);
      });
    });

    test("retains whitespace when converting to a task", () => {
      const r = parse("    Note 1");
      const writable = asWritable(r);

      writable.type = "task";
      const newR = parse("    [ ] Note 1");
      assert.deepEqual(writable, newR);
    });

    test("retains whitespace when converting to a note", () => {
      const r = parse("    [ ] Task 1");
      const writable = asWritable(r);

      writable.type = "note";
      const newR = parse("    Task 1");
      assert.deepEqual(writable, newR);
    });
  });

  describe("set due date", () => {
    test("updates an existing due date at the end", () => {
      const r = parse("[ ] Task 1 @2020-01-01");
      const writable = asWritable(r);

      assert(writable.dueDate?.equals(Temporal.PlainDate.from("2020-01-01")));

      writable.dueDate = Temporal.PlainDate.from("2021-01-02");
      const newR = parse("[ ] Task 1 @2021-01-02");
      assert.deepEqual(writable, newR);
    });

    test("updates an existing due date in between", () => {
      const r = parse("[ ] Task 1 @2020-01-01 some more text");
      const writable = asWritable(r);

      assert(writable.dueDate?.equals(Temporal.PlainDate.from("2020-01-01")));

      writable.dueDate = Temporal.PlainDate.from("2021-01-02");
      const newR = parse("[ ] Task 1 @2021-01-02 some more text");
      assert.deepEqual(writable, newR);
    });

    test("adds a new due date", () => {
      const r = parse("[ ] Task 1");
      const writable = asWritable(r);

      assert.equal(writable.dueDate, undefined);

      writable.dueDate = Temporal.PlainDate.from("2021-01-02");
      const newR = parse("[ ] Task 1 @2021-01-02");
      assert.deepEqual(writable, newR);
    });

    test("adds a new due date after a non-text token", () => {
      const r = parse("[ ] Task 1 #tag");
      const writable = asWritable(r);

      assert.equal(writable.dueDate, undefined);

      writable.dueDate = Temporal.PlainDate.from("2021-01-02");
      const newR = parse("[ ] Task 1 #tag @2021-01-02");
      assert.deepEqual(writable, newR);
    });

    test("doesn't add double whitespace when adding a due date", () => {
      const r = parse("[ ] Task 1 ");
      const writable = asWritable(r);

      assert.equal(writable.dueDate, undefined);

      writable.dueDate = Temporal.PlainDate.from("2021-01-02");
      const newR = parse("[ ] Task 1 @2021-01-02");
      assert.deepEqual(writable, newR);
    });

    test("removes an existing due date at the end", () => {
      const r = parse("[ ] Task 1 @2020-01-01");
      const writable = asWritable(r);

      assert(writable.dueDate?.equals(Temporal.PlainDate.from("2020-01-01")));

      writable.dueDate = undefined;
      const newR = parse("[ ] Task 1");
      assert.deepEqual(writable, newR);
    });

    test("removes an existing due date in between", () => {
      const r = parse("[ ] Task 1 @2020-01-01 some more text");
      const writable = asWritable(r);

      assert(writable.dueDate?.equals(Temporal.PlainDate.from("2020-01-01")));

      writable.dueDate = undefined;
      const newR = parse("[ ] Task 1 some more text");
      assert.deepEqual(writable, newR);
    });
  });

  describe("set status", () => {
    test("changes the status to completed", () => {
      const r = parse("[ ] Task 1");
      const writable = asWritable(r);

      assert.equal(writable.status, "incomplete");

      writable.status = "completed";
      const newR = parse("[x] Task 1");
      assert.deepEqual(writable, newR);
    });

    test("changes the status to in progress", () => {
      const r = parse("[ ] Task 1");
      const writable = asWritable(r);

      assert.equal(writable.status, "incomplete");

      writable.status = "inProgress";
      const newR = parse("[/] Task 1");
      assert.deepEqual(writable, newR);
    });

    test("changes the status to question", () => {
      const r = parse("[ ] Task 1");
      const writable = asWritable(r);

      assert.equal(writable.status, "incomplete");

      writable.status = "question";
      const newR = parse("[?] Task 1");
      assert.deepEqual(writable, newR);
    });

    test("changes the status to incomplete", () => {
      const r = parse("[x] Task 1");
      const writable = asWritable(r);

      assert.equal(writable.status, "completed");

      writable.status = "incomplete";
      const newR = parse("[ ] Task 1");
      assert.deepEqual(writable, newR);
    });

    test("retains spaces when changing the status", () => {
      const r = parse("    [ ] Task 1");
      const writable = asWritable(r);

      assert.equal(writable.status, "incomplete");

      writable.status = "completed";
      const newR = parse("    [x] Task 1");
      assert.deepEqual(writable, newR);
    });

    test("retains tabs then changing the status", () => {
      const r = parse("\t\t[ ] Task 1");
      const writable = asWritable(r);

      assert.equal(writable.status, "incomplete");

      writable.status = "completed";
      const newR = parse("\t\t[x] Task 1");
      assert.deepEqual(writable, newR);
    });

    test("doesn't change items that aren't tasks", () => {
      const r = parse("Not a task");
      const writable = asWritable(r);

      writable.status = "completed";
      const newR = parse("Not a task");
      assert.deepEqual(writable, newR);
    });
  });

  describe("mutating items", () => {
    test("mutates the type of the item", () => {
      let r = parse("[ ] Task 1");

      r = mutate(r, (item) => {
        item.type = "note";
      });

      assert.equal(r.type, "note");
    });

    test("mutates the due date of the item", () => {
      let r = parse("[ ] Task 1");

      r = mutate(r, (item) => {
        item.dueDate = Temporal.PlainDate.from("2021-01-01");
      });

      assert(r.dueDate?.equals(Temporal.PlainDate.from("2021-01-01")));
    });

    test("mutates the status of the item", () => {
      let r = parse("[ ] Task 1");

      r = mutate(r, (item) => {
        item.status = "completed";
      });

      assert.equal(r.status, "completed");
    });

    test("creates a deep copy of the original item", () => {
      const original = parse("[ ] Task");

      const mutated = mutate(original, (i) => {
        i.status = "completed";
      });

      // Only need to check array and object type contents because they're references
      assert.notEqual(original.tokens, mutated.tokens);
      assert.notEqual(original.tags, mutated.tags);
    });
  });

  describe("comparing items", () => {
    test("keeps the order of notes", () => {
      const a = parse("Note 1");
      const b = parse("Note 2");

      assert.equal(compare(a, b), 0);
      assert.equal(compare(b, a), 0);
    });

    test("keeps the order of sections", () => {
      const a = parse("# Section 1");
      const b = parse("# Section 2");

      assert.equal(compare(a, b), 0);
      assert.equal(compare(b, a), 0);
    });

    test("keeps the order of notes and sections", () => {
      const a = parse("Note 1");
      const b = parse("# Section 1");

      assert.equal(compare(a, b), 0);
      assert.equal(compare(b, a), 0);
    });

    test("keeps the order of notes and tasks", () => {
      const a = parse("Note 1");
      const b = parse("[ ] Task 1");

      assert.equal(compare(a, b), 0);
      assert.equal(compare(b, a), 0);
    });

    test("keeps the order of sections and tasks", () => {
      const a = parse("# Section 1");
      const b = parse("[ ] Task 1");

      assert.equal(compare(a, b), 0);
      assert.equal(compare(b, a), 0);
    });

    test("keeps the order of notes and blank lines", () => {
      const a = parse("Note 1");
      const b = parse("");

      assert.equal(compare(a, b), 0);
      assert.equal(compare(b, a), 0);
    });

    test("keeps the order of sections and blank lines", () => {
      const a = parse("# Section 1");
      const b = parse("");

      assert.equal(compare(a, b), 0);
      assert.equal(compare(b, a), 0);
    });

    test("keeps the order of tasks and blank lines", () => {
      const a = parse("[ ] Task 1");
      const b = parse("");

      assert.equal(compare(a, b), 0);
      assert.equal(compare(b, a), 0);
    });

    test("sorts by status before due date when both have due dates", () => {
      const a = parse("[x] Task 1 @2023-01-01");
      const b = parse("[ ] Task 2 @2024-01-01");

      assert.ok(compare(a, b) > 0);
      assert.ok(compare(b, a) < 0);
    });

    test("sorts by status before due date when only one has a due date", () => {
      const a = parse("[x] Task 1 @2023-01-01");
      const b = parse("[ ] Task 2");

      assert.ok(compare(a, b) > 0);
      assert.ok(compare(b, a) < 0);
    });

    test("sorts by due date when both have due dates", () => {
      const a = parse("[ ] Task 1 @2021-01-01");
      const b = parse("[ ] Task 2 @2022-01-01");

      assert.ok(compare(a, b) < 0);
      assert.ok(compare(b, a) > 0);
    });

    test("sorts by status when both have identical due dates", () => {
      const a = parse("[ ] Task 1 @2021-01-01");
      const b = parse("[x] Task 2 @2021-01-01");

      assert.ok(compare(a, b) < 0);
      assert.ok(compare(b, a) > 0);
    });

    test("sorts by due date when only one has a due date", () => {
      const a = parse("[ ] Task 1 @2021-01-01");
      const b = parse("[ ] Task 2");

      assert.ok(compare(a, b) < 0);
      assert.ok(compare(b, a) > 0);
    });

    test("keeps the order for equal due dates", () => {
      const a = parse("[ ] Task 1 @2021-01-01");
      const b = parse("[ ] Task 2 @2021-01-01");

      assert.equal(compare(a, b), 0);
      assert.equal(compare(b, a), 0);
    });

    test("keeps the order for equal due dates and status", () => {
      const a = parse("[ ] Task 1 @2021-01-01");
      const b = parse("[ ] Task 2 @2021-01-01");

      assert.equal(compare(a, b), 0);
      assert.equal(compare(b, a), 0);
    });

    test("sorts by status", () => {
      const incomplete = parse("[ ] Task 1");
      const completed = parse("[x] Task 2");
      const inProgress = parse("[/] Task 3");
      const question = parse("[?] Task 4");
      const important = parse("[*] Task 5");

      const expectedResults = [
        [
          [incomplete, completed],
          [incomplete, completed],
        ],
        [
          [incomplete, inProgress],
          [inProgress, incomplete],
        ],
        [
          [incomplete, question],
          [incomplete, question],
        ],
        [
          [incomplete, important],
          [important, incomplete],
        ],
        [
          [completed, inProgress],
          [inProgress, completed],
        ],
        [
          [completed, question],
          [question, completed],
        ],
        [
          [completed, important],
          [important, completed],
        ],
        [
          [inProgress, question],
          [inProgress, question],
        ],
        [
          [inProgress, important],
          [important, inProgress],
        ],
        [
          [question, important],
          [important, question],
        ],
      ];

      expectedResults.forEach(([items, result]) => {
        assert.deepEqual([...items].sort(compare), result);
      });
    });

    test("keeps the order for equal status", () => {
      const a = parse("[ ] Task 1");
      const b = parse("[ ] Task 2");
      assert.equal(compare(a, b), 0);
      assert.equal(compare(b, a), 0);

      const c = parse("[x] Task 1");
      const d = parse("[x] Task 2");
      assert.equal(compare(c, d), 0);
      assert.equal(compare(d, c), 0);

      const e = parse("[/] Task 1");
      const f = parse("[/] Task 2");
      assert.equal(compare(e, f), 0);
      assert.equal(compare(f, e), 0);

      const g = parse("[?] Task 1");
      const h = parse("[?] Task 2");
      assert.equal(compare(g, h), 0);
      assert.equal(compare(h, g), 0);

      const i = parse("[*] Task 1");
      const j = parse("[*] Task 2");
      assert.equal(compare(i, j), 0);
      assert.equal(compare(j, i), 0);
    });

    test("keeps the order when the leading whitespace is different", () => {
      const a = parse("\t[ ] Task 1");
      const b = parse("\t\t[*] Task 2");
      assert.equal(compare(a, b), 0);
      assert.equal(compare(b, a), 0);

      const c = parse("\t[ ] Task 1 @2021-01-01");
      const d = parse("\t\t[ ] Task 2 @2022-01-01");
      assert.equal(compare(c, d), 0);
      assert.equal(compare(d, c), 0);
    });

    test("does not change how items are grouped into paragraphs", () => {
      const items = [
        parse("Title"),
        parse(""),
        parse("[x] Task 1"),
        parse(""),
        parse("[ ] Task 2"),
      ];

      assert.deepEqual([...items].toSorted(compare), items);
    });
  });
});
