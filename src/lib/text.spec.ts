import { describe, expect, it } from "vitest";
import {
  continueList,
  continueListRules,
  flip,
  getCursorInLine,
  getRangeFromSelectedLines,
  getSelectedLines,
  indent,
  joinLines,
  mergeList,
  splitAt,
  splitLines,
  type ContinueListResult,
  type ContinueListRule,
} from "./text";

describe("text", () => {
  describe("split lines", () => {
    it("splits a string into a list of lines", () => {
      expect(splitLines("foo\nbar\nbaz")).toEqual(["foo", "bar", "baz"]);
    });

    it("splits a string with a single line", () => {
      expect(splitLines("foo")).toEqual(["foo"]);
    });

    it("splits empty string", () => {
      expect(splitLines("")).toEqual([""]);
    });
  });

  describe("join lines", () => {
    it("joins a list of lines into a single string", () => {
      expect(joinLines(["foo", "bar", "baz"])).toBe("foo\nbar\nbaz");
    });

    it("joins a list of lines with a single line", () => {
      expect(joinLines(["foo"])).toBe("foo");
    });

    it("joins a list of lines with an empty line", () => {
      expect(joinLines([""])).toBe("");
    });
  });

  describe("split at", () => {
    it("splits a string in two at the specified index", () => {
      expect(splitAt("foobarbaz", 3)).toEqual(["foo", "barbaz"]);
    });

    it("splits a string at the start", () => {
      expect(splitAt("foobarbaz", 0)).toEqual(["", "foobarbaz"]);
    });

    it("splits a string at the end", () => {
      expect(splitAt("foobarbaz", 9)).toEqual(["foobarbaz", ""]);
    });

    it("splits a string with an index out of bounds", () => {
      expect(splitAt("foobarbaz", 100)).toEqual(["foobarbaz", ""]);
    });
  });

  describe("get selected lines", () => {
    const example = "foo\nbar\nbaz\n\nqux";

    it("returns the line numbers of the first and last selected line", () => {
      expect(getSelectedLines(example, 1, 9)).toEqual([0, 2]);
    });

    it("returns the line numbers when the selection is reversed", () => {
      expect(getSelectedLines(example, 9, 1)).toEqual([0, 2]);
    });

    it("returns the line numbers when the selection is a single line", () => {
      expect(getSelectedLines(example, 1, 3)).toEqual([0, 0]);
    });

    it("returns the line numbers when the selection is empty", () => {
      expect(getSelectedLines(example, 1)).toEqual([0, 0]);
    });

    it("returns the line numbers when start is out of bounds", () => {
      expect(getSelectedLines(example, -5, 10)).toEqual([0, 2]);
    });

    it("returns the line numbers when end is out of bounds", () => {
      expect(getSelectedLines(example, 1, 100)).toEqual([0, 4]);
    });

    it("returns the line numbers when start and end are out of bounds", () => {
      expect(getSelectedLines(example, -100, 100)).toEqual([0, 4]);
    });

    it("returns the line numbers when start exactly matches the start of a line", () => {
      expect(getSelectedLines(example, 4, 10)).toEqual([1, 2]);
    });

    it("returns the line numbers when end exactly matches the end of a line", () => {
      expect(getSelectedLines(example, 1, 7)).toEqual([0, 1]);
    });

    it("returns the line numbers when start and end exactly match the bounds of a line", () => {
      expect(getSelectedLines(example, 4, 7)).toEqual([1, 1]);
    });

    it("returns the line number if there is only one line", () => {
      expect(getSelectedLines("foo", 0, 3)).toEqual([0, 0]);
    });
  });

  describe("get range from selected lines", () => {
    const example = "foo\nbar\nbaz\n\nqux";

    it("returns the range of the first and last selected line", () => {
      expect(getRangeFromSelectedLines(example, 1, 2)).toEqual([4, 11]);
    });

    it("returns the range when the selection is reversed", () => {
      expect(getRangeFromSelectedLines(example, 2, 1)).toEqual([4, 11]);
    });

    it("returns the range when the selection is a single line", () => {
      expect(getRangeFromSelectedLines(example, 2, 2)).toEqual([8, 11]);
    });

    it("returns the range when the selection is empty", () => {
      expect(getRangeFromSelectedLines(example, 2)).toEqual([8, 11]);
    });

    it("returns the range when start is out of bounds", () => {
      expect(getRangeFromSelectedLines(example, -1, 2)).toEqual([0, 11]);
    });

    it("returns the range when end is out of bounds", () => {
      expect(getRangeFromSelectedLines(example, 2, 100)).toEqual([8, 16]);
    });

    it("returns the range when start and end are out of bounds", () => {
      expect(getRangeFromSelectedLines(example, -100, 100)).toEqual([0, 16]);
    });

    it("returns the range if there is only one line", () => {
      expect(getRangeFromSelectedLines("foo", 0)).toEqual([0, 3]);
    });
  });

  describe("get cursor in line", () => {
    const example = "foo\nbar\nbaz\n\nqux";

    it("returns the position in a line", () => {
      expect(getCursorInLine(example, 6)).toBe(2);
    });

    it("returns the position in a line when the cursor is negative", () => {
      expect(getCursorInLine(example, -100)).toBeUndefined();
    });

    it("returns the position in a line when the cursor is out of bounds", () => {
      expect(getCursorInLine(example, 100)).toBeUndefined();
    });

    it("returns the position in a line when the cursor is at the start of the line", () => {
      expect(getCursorInLine(example, 4)).toBe(0);
    });

    it("returns the position in a line when the cursor is at the end of the line", () => {
      expect(getCursorInLine(example, 7)).toBe(3);
    });

    it("returns the position in a line when the line is empty", () => {
      expect(getCursorInLine(example, 12)).toBe(0);
    });

    it("returns the position in a line if there is only one line", () => {
      expect(getCursorInLine("foo", 2)).toBe(2);
    });

    it("returns the position in the first line", () => {
      expect(getCursorInLine(example, 1)).toBe(1);
    });
  });

  describe("continue list", () => {
    const rules = Object.values(continueListRules);

    it("continues a list with the same marker", () => {
      const continued = continueList("- foo", rules);
      expect(continued).toStrictEqual<ContinueListResult>({
        didContinue: true,
        match: "- ",
        current: "- foo",
        next: "- ",
      });
    });

    it("continues a list with a custom marker", () => {
      const continued = continueList("1. foo", rules);
      expect(continued).toStrictEqual<ContinueListResult>({
        didContinue: true,
        match: "2. ",
        current: "1. foo",
        next: "2. ",
      });
    });

    it("adds an empty line if there is no list", () => {
      const continued = continueList("foo", rules);
      expect(continued).toStrictEqual<ContinueListResult>({
        didContinue: false,
        didEnd: false,
        current: "foo",
        next: "",
      });
    });

    it("splits a line when continuing a list", () => {
      const continued = continueList("- foo bar", rules, 6);
      expect(continued).toStrictEqual<ContinueListResult>({
        didContinue: true,
        match: "- ",
        current: "- foo ",
        next: "- bar",
      });
    });

    it("splits a line when there is no list", () => {
      const continued = continueList("foo bar", rules, 4);
      expect(continued).toStrictEqual<ContinueListResult>({
        didContinue: false,
        didEnd: false,
        current: "foo ",
        next: "bar",
      });
    });

    it("ends a list when continuing an empty item", () => {
      const continued = continueList("- ", rules);
      expect(continued).toStrictEqual<ContinueListResult>({
        didEnd: true,
        match: "- ",
        current: "",
        next: null,
      });
    });

    it("continues an unordered list with *", () => {
      const continued = continueList("* foo", [continueListRules.unordered]);
      expect(continued).toStrictEqual<ContinueListResult>({
        didContinue: true,
        match: "* ",
        current: "* foo",
        next: "* ",
      });
    });

    it("continues an unordered list with -", () => {
      const continued = continueList("- foo", [continueListRules.unordered]);
      expect(continued).toStrictEqual<ContinueListResult>({
        didContinue: true,
        match: "- ",
        current: "- foo",
        next: "- ",
      });
    });

    it("continues an numbered list", () => {
      const continued = continueList("1. foo", [continueListRules.numbered]);
      expect(continued).toStrictEqual<ContinueListResult>({
        didContinue: true,
        match: "2. ",
        current: "1. foo",
        next: "2. ",
      });
    });

    it("continues indentation", () => {
      const continued = continueList("\tfoo", [continueListRules.indent]);
      expect(continued).toStrictEqual<ContinueListResult>({
        didContinue: true,
        match: "\t",
        current: "\tfoo",
        next: "\t",
      });
    });

    it("inserts a blank line when continuing with the cursor at the start of the line", () => {
      const continued = continueList("- Foo", rules, 0);
      expect(continued).toStrictEqual<ContinueListResult>({
        didContinue: false,
        didEnd: false,
        current: "",
        next: "- Foo",
      });
    });
  });

  describe("merge list", () => {
    const rules = Object.values(continueListRules);

    it("merges the inserted text with the current line", () => {
      expect(mergeList("- ", "- foo", rules)).toStrictEqual({
        current: "- foo",
        match: "- ",
      });
    });

    it("doesn't merge when the current line has content other than the list marker", () => {
      expect(mergeList("- foo", "- bar", rules)).toBeNull();
    });

    it("doesn't merge when the current line has no list marker", () => {
      expect(mergeList("foo", "- bar", rules)).toBeNull();
    });

    it("doesn't merge when the inserted line has no list marker", () => {
      expect(mergeList("- foo", "bar", rules)).toBeNull();
    });

    it("doesn't merge when the inserted line has a different type of list marker", () => {
      expect(mergeList("- foo", "1. bar", rules)).toBeNull();
    });

    it("merges two different list markers if they're of the same type", () => {
      const rule: ContinueListRule = {
        pattern: /\t*\[.\] /,
        next: (match) => match.replace(/\[.\]/, "[ ]"),
      };

      expect(mergeList("\t[ ] ", "\t[x] bar", [rule])).toEqual({
        current: "\t[x] bar",
        match: "\t[x] ",
      });
    });
  });

  describe("indent", () => {
    it("indents a line", () => {
      expect(indent(["foo"])).toEqual(["\tfoo"]);
    });

    it("indents multiple lines", () => {
      expect(indent(["foo", "bar"])).toEqual(["\tfoo", "\tbar"]);
    });

    it("outdents a line", () => {
      expect(indent(["\tfoo"], "outdent")).toEqual(["foo"]);
    });

    it("outdents multiple lines", () => {
      expect(indent(["\tfoo", "\tbar"], "outdent")).toEqual(["foo", "bar"]);
    });

    it("outdents a line when the line is not indented", () => {
      expect(indent(["foo"], "outdent")).toEqual(["foo"]);
    });

    it("outdents multiple lines when the lines are not indented", () => {
      expect(indent(["foo", "bar"], "outdent")).toEqual(["foo", "bar"]);
    });

    it("indents a line when the line is already indented", () => {
      expect(indent(["\tfoo"])).toEqual(["\t\tfoo"]);
    });

    it("indents multiple lines when the lines are already indented", () => {
      expect(indent(["\tfoo", "\tbar"])).toEqual(["\t\tfoo", "\t\tbar"]);
    });
  });

  describe("flip", () => {
    it("flips two lines", () => {
      expect(flip("foo", "bar")).toEqual(["bar", "foo"]);
    });
  });
});
