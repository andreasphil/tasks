import { parse } from "@/lib/parser";
import { describe, expect, it } from "vitest";
import { asWritable, mutate } from "./items";

describe("writable items", () => {
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
    it("mutates the status of the original item", () => {
      const r = parse("[ ] Task 1");

      mutate(r, (item) => {
        item.status = "completed";
      });

      expect(r.status).toBe("completed");
    });
  });
});
