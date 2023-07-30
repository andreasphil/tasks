import { Item, parse } from "@/lib/parser";
import { describe, expect, it } from "vitest";
import { asWritable, mutate } from "./items";

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
});
