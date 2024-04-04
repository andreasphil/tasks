import { Item, parse } from "@/lib/parser";
import { describe, expect, it } from "vitest";
import { asWritable, compare, mutate } from "./items";

describe("writable items", () => {
  describe("set type", () => {
    type Fixtures = Array<{
      source: string;
      changeTo: Item["type"];
      expected: string;
    }>;

    it("changes the type of the item", () => {
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
      ];

      items.forEach(({ source, changeTo, expected }) => {
        const r = parse(source);
        const writable = asWritable(r);

        writable.type = changeTo;
        const newR = parse(expected);
        expect(writable).toStrictEqual(newR);
      });
    });

    it("removes whitespace when converting from a task to a heading", () => {
      const items: Fixtures = [
        { source: "    [ ] Task 1", changeTo: "heading", expected: "# Task 1" },
        { source: "  Note 1", changeTo: "heading", expected: "# Note 1" },
      ];

      items.forEach(({ source, changeTo, expected }) => {
        const r = parse(source);
        const writable = asWritable(r);

        writable.type = changeTo;
        const newR = parse(expected);
        expect(writable).toStrictEqual(newR);
      });
    });

    it("retains whitespace when converting to a task", () => {
      const r = parse("    Note 1");
      const writable = asWritable(r);

      writable.type = "task";
      const newR = parse("    [ ] Note 1");
      expect(writable).toStrictEqual(newR);
    });

    it("retains whitespace when converting to a note", () => {
      const r = parse("    [ ] Task 1");
      const writable = asWritable(r);

      writable.type = "note";
      const newR = parse("    Task 1");
      expect(writable).toStrictEqual(newR);
    });
  });

  describe("set due date", () => {
    it("updates an existing due date at the end", () => {
      const r = parse("[ ] Task 1 ->2020-01-01");
      const writable = asWritable(r);

      expect(writable.dueDate).toEqual(new Date("2020-01-01"));

      writable.dueDate = new Date("2021-01-02");
      const newR = parse("[ ] Task 1 ->2021-01-02");
      expect(writable).toStrictEqual(newR);
    });

    it("updates an existing due date in between", () => {
      const r = parse("[ ] Task 1 ->2020-01-01 some more text");
      const writable = asWritable(r);

      expect(writable.dueDate).toEqual(new Date("2020-01-01"));

      writable.dueDate = new Date("2021-01-02");
      const newR = parse("[ ] Task 1 ->2021-01-02 some more text");
      expect(writable).toStrictEqual(newR);
    });

    it("adds a new due date", () => {
      const r = parse("[ ] Task 1");
      const writable = asWritable(r);

      expect(writable.dueDate).toBeUndefined();

      writable.dueDate = new Date("2021-01-02");
      const newR = parse("[ ] Task 1 ->2021-01-02");
      expect(writable).toStrictEqual(newR);
    });

    it("adds a new due date after a non-text token", () => {
      const r = parse("[ ] Task 1 #tag");
      const writable = asWritable(r);

      expect(writable.dueDate).toBeUndefined();

      writable.dueDate = new Date("2021-01-02");
      const newR = parse("[ ] Task 1 #tag ->2021-01-02");
      expect(writable).toStrictEqual(newR);
    });

    it("doesn't add double whitespace when adding a due date", () => {
      const r = parse("[ ] Task 1 ");
      const writable = asWritable(r);

      expect(writable.dueDate).toBeUndefined();

      writable.dueDate = new Date("2021-01-02");
      const newR = parse("[ ] Task 1 ->2021-01-02");
      expect(writable).toStrictEqual(newR);
    });

    it("removes an existing due date at the end", () => {
      const r = parse("[ ] Task 1 ->2020-01-01");
      const writable = asWritable(r);

      expect(writable.dueDate).toEqual(new Date("2020-01-01"));

      writable.dueDate = undefined;
      const newR = parse("[ ] Task 1");
      expect(writable).toStrictEqual(newR);
    });

    it("removes an existing due date in between", () => {
      const r = parse("[ ] Task 1 ->2020-01-01 some more text");
      const writable = asWritable(r);

      expect(writable.dueDate).toEqual(new Date("2020-01-01"));

      writable.dueDate = undefined;
      const newR = parse("[ ] Task 1 some more text");
      expect(writable).toStrictEqual(newR);
    });
  });

  describe("set status", () => {
    it("changes the status to completed", () => {
      const r = parse("[ ] Task 1");
      const writable = asWritable(r);

      expect(writable.status).toBe("incomplete");

      writable.status = "completed";
      const newR = parse("[x] Task 1");
      expect(writable).toStrictEqual(newR);
    });

    it("changes the status to in progress", () => {
      const r = parse("[ ] Task 1");
      const writable = asWritable(r);

      expect(writable.status).toBe("incomplete");

      writable.status = "inProgress";
      const newR = parse("[/] Task 1");
      expect(writable).toStrictEqual(newR);
    });

    it("changes the status to question", () => {
      const r = parse("[ ] Task 1");
      const writable = asWritable(r);

      expect(writable.status).toBe("incomplete");

      writable.status = "question";
      const newR = parse("[?] Task 1");
      expect(writable).toStrictEqual(newR);
    });

    it("changes the status to incomplete", () => {
      const r = parse("[x] Task 1");
      const writable = asWritable(r);

      expect(writable.status).toBe("completed");

      writable.status = "incomplete";
      const newR = parse("[ ] Task 1");
      expect(writable).toStrictEqual(newR);
    });

    it("retains spaces when changing the status", () => {
      const r = parse("    [ ] Task 1");
      const writable = asWritable(r);

      expect(writable.status).toBe("incomplete");

      writable.status = "completed";
      const newR = parse("    [x] Task 1");
      expect(writable).toStrictEqual(newR);
    });

    it("retains tabs then changing the status", () => {
      const r = parse("\t\t[ ] Task 1");
      const writable = asWritable(r);

      expect(writable.status).toBe("incomplete");

      writable.status = "completed";
      const newR = parse("\t\t[x] Task 1");
      expect(writable).toStrictEqual(newR);
    });

    it("doesn't change items that aren't tasks", () => {
      const r = parse("Not a task");
      const writable = asWritable(r);

      writable.status = "completed";
      const newR = parse("Not a task");
      expect(writable).toStrictEqual(newR);
    });
  });

  describe("mutating items", () => {
    it("mutates the type of the original item", () => {
      const r = parse("[ ] Task 1");

      mutate(r, (item) => {
        item.type = "note";
      });

      expect(r.type).toBe("note");
    });

    it("mutates the due date of the original item", () => {
      const r = parse("[ ] Task 1");

      mutate(r, (item) => {
        item.dueDate = new Date("2021-01-01");
      });

      expect(r.dueDate).toEqual(new Date("2021-01-01"));
    });

    it("mutates the status of the original item", () => {
      const r = parse("[ ] Task 1");

      mutate(r, (item) => {
        item.status = "completed";
      });

      expect(r.status).toBe("completed");
    });
  });

  describe("comparing items", () => {
    it("keeps the order of notes", () => {
      const a = parse("Note 1");
      const b = parse("Note 2");

      expect(compare(a, b)).toBe(0);
      expect(compare(b, a)).toBe(0);
    });

    it("keeps the order of sections", () => {
      const a = parse("# Section 1");
      const b = parse("# Section 2");

      expect(compare(a, b)).toBe(0);
      expect(compare(b, a)).toBe(0);
    });

    it("keeps the order of notes and sections", () => {
      const a = parse("Note 1");
      const b = parse("# Section 1");

      expect(compare(a, b)).toBe(0);
      expect(compare(b, a)).toBe(0);
    });

    it("keeps the order of notes and tasks", () => {
      const a = parse("Note 1");
      const b = parse("[ ] Task 1");

      expect(compare(a, b)).toBe(0);
      expect(compare(b, a)).toBe(0);
    });

    it("keeps the order of sections and tasks", () => {
      const a = parse("# Section 1");
      const b = parse("[ ] Task 1");

      expect(compare(a, b)).toBe(0);
      expect(compare(b, a)).toBe(0);
    });

    it("keeps the order of notes and blank lines", () => {
      const a = parse("Note 1");
      const b = parse("");

      expect(compare(a, b)).toBe(0);
      expect(compare(b, a)).toBe(0);
    });

    it("keeps the order of sections and blank lines", () => {
      const a = parse("# Section 1");
      const b = parse("");

      expect(compare(a, b)).toBe(0);
      expect(compare(b, a)).toBe(0);
    });

    it("keeps the order of tasks and blank lines", () => {
      const a = parse("[ ] Task 1");
      const b = parse("");

      expect(compare(a, b)).toBe(0);
      expect(compare(b, a)).toBe(0);
    });

    it("sorts by status before due date when both have due dates", () => {
      const a = parse("[x] Task 1 ->2023-01-01");
      const b = parse("[ ] Task 2 ->2024-01-01");

      expect(compare(a, b)).toBeGreaterThan(0);
      expect(compare(b, a)).toBeLessThan(0);
    });

    it("sorts by status before due date when only one has a due date", () => {
      const a = parse("[x] Task 1 ->2023-01-01");
      const b = parse("[ ] Task 2");

      expect(compare(a, b)).toBeGreaterThan(0);
      expect(compare(b, a)).toBeLessThan(0);
    });

    it("sorts by due date when both have due dates", () => {
      const a = parse("[ ] Task 1 ->2021-01-01");
      const b = parse("[ ] Task 2 ->2022-01-01");

      expect(compare(a, b)).toBeLessThan(0);
      expect(compare(b, a)).toBeGreaterThan(0);
    });

    it("sorts by status when both have identical due dates", () => {
      const a = parse("[ ] Task 1 ->2021-01-01");
      const b = parse("[x] Task 2 ->2021-01-01");

      expect(compare(a, b)).toBeLessThan(0);
      expect(compare(b, a)).toBeGreaterThan(0);
    });

    it("sorts by due date when only one has a due date", () => {
      const a = parse("[ ] Task 1 ->2021-01-01");
      const b = parse("[ ] Task 2");

      expect(compare(a, b)).toBeLessThan(0);
      expect(compare(b, a)).toBeGreaterThan(0);
    });

    it("keeps the order for equal due dates", () => {
      const a = parse("[ ] Task 1 ->2021-01-01");
      const b = parse("[ ] Task 2 ->2021-01-01");

      expect(compare(a, b)).toBe(0);
      expect(compare(b, a)).toBe(0);
    });

    it("keeps the order for equal due dates and status", () => {
      const a = parse("[ ] Task 1 ->2021-01-01");
      const b = parse("[ ] Task 2 ->2021-01-01");

      expect(compare(a, b)).toBe(0);
      expect(compare(b, a)).toBe(0);
    });

    it("sorts by status", () => {
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
        expect([...items].sort(compare)).toStrictEqual(result);
      });
    });

    it("keeps the order for equal status", () => {
      const a = parse("[ ] Task 1");
      const b = parse("[ ] Task 2");
      expect(compare(a, b)).toBe(0);
      expect(compare(b, a)).toBe(0);

      const c = parse("[x] Task 1");
      const d = parse("[x] Task 2");
      expect(compare(c, d)).toBe(0);
      expect(compare(d, c)).toBe(0);

      const e = parse("[/] Task 1");
      const f = parse("[/] Task 2");
      expect(compare(e, f)).toBe(0);
      expect(compare(f, e)).toBe(0);

      const g = parse("[?] Task 1");
      const h = parse("[?] Task 2");
      expect(compare(g, h)).toBe(0);
      expect(compare(h, g)).toBe(0);

      const i = parse("[*] Task 1");
      const j = parse("[*] Task 2");
      expect(compare(i, j)).toBe(0);
      expect(compare(j, i)).toBe(0);
    });

    it("keeps the order when the leading whitespace is different", () => {
      const a = parse("\t[ ] Task 1");
      const b = parse("\t\t[*] Task 2");
      expect(compare(a, b)).toBe(0);
      expect(compare(b, a)).toBe(0);

      const c = parse("\t[ ] Task 1 ->2021-01-01");
      const d = parse("\t\t[ ] Task 2 ->2022-01-01");
      expect(compare(c, d)).toBe(0);
      expect(compare(d, c)).toBe(0);
    });

    it("does not change how items are grouped into paragraphs", () => {
      const items = [
        parse("Title"),
        parse(""),
        parse("[x] Task 1"),
        parse(""),
        parse("[ ] Task 2"),
      ];

      console.log(
        [...items].sort((a, b) => {
          const result = compare(a, b);
          console.log({ a: a.raw, b: b.raw, result });
          return result;
        })
      );

      expect([...items].sort(compare)).toStrictEqual(items);
    });
  });
});
