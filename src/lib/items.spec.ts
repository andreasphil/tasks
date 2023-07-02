import { parse } from "@/lib/parser";
import { describe, expect, it } from "vitest";
import { asWritable, mutate } from "./items";

describe("writable items", () => {
  describe("set due date", () => {
    it.todo("changes the due date");
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
