import { afterEach, describe, expect, test, vi } from "vitest";
import { parse } from "./appParser";
import { parse as baseParse } from "@/lib/parser";

vi.mock("@/lib/parser", () => ({
  parse: vi.fn().mockReturnValue({}),
}));

describe("appParser", () => {
  afterEach(() => {
    vi.resetAllMocks();
    parse.setOpts({});
  });

  test("calls the base parser without options by default", () => {
    parse("test");

    expect(baseParse).toHaveBeenCalledWith("test", {});
  });

  test("calls the base parser with custom options", () => {
    parse.setOpts({ autoLinkRules: [{ pattern: "foo", target: "bar" }] });
    parse("test");

    expect(baseParse).toHaveBeenCalledWith("test", {
      autoLinkRules: [{ pattern: "foo", target: "bar" }],
    });
  });

  test("memoizes the parsing function", () => {
    parse.withMemo("test");
    expect(baseParse).toHaveBeenCalledOnce();

    parse.withMemo("test");
    expect(baseParse).toHaveBeenCalledOnce();
  });

  test("correctly parses with memo after changing options", () => {
    parse.withMemo("test");
    expect(baseParse).toHaveBeenCalledOnce();
    expect(baseParse).toHaveBeenCalledWith("test", {});

    parse.setOpts({ autoLinkRules: [{ pattern: "foo", target: "bar" }] });
    parse.withMemo("test");
    expect(baseParse).toHaveBeenCalledTimes(2);
    expect(baseParse).toHaveBeenCalledWith("test", {
      autoLinkRules: [{ pattern: "foo", target: "bar" }],
    });
  });
});
