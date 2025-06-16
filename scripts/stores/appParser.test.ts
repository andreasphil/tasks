import assert from "node:assert/strict";
import test, { afterEach, before, describe, mock } from "node:test";
import type { parse as parseFn } from "./appParser.ts";

describe("appParser", () => {
  let mocks = { parse: mock.fn((_: string) => ({})) };
  let parse: typeof parseFn;

  before(async () => {
    mock.module("../lib/parser.ts", {
      namedExports: {
        parse: mocks.parse,
      },
    });

    parse = (await import("./appParser.ts")).parse;
  });

  afterEach(() => {
    mocks.parse.mock.resetCalls();
    parse.setOpts({});
  });

  test("calls the base parser without options by default", () => {
    parse("test");

    assert.deepEqual(mocks.parse.mock.calls[0].arguments, ["test", {}]);
  });

  test("calls the base parser with custom options", () => {
    parse.setOpts({ autoLinkRules: [{ pattern: "foo", target: "bar" }] });
    parse("test");

    assert.deepEqual(mocks.parse.mock.calls[0].arguments, [
      "test",
      {
        autoLinkRules: [{ pattern: "foo", target: "bar" }],
      },
    ]);
  });

  test("memoizes the parsing function", () => {
    parse.withMemo("test");
    assert.equal(mocks.parse.mock.callCount(), 1);

    parse.withMemo("test");
    assert.equal(mocks.parse.mock.callCount(), 1);
  });

  test("correctly parses with memo after changing options", () => {
    parse.withMemo("test");
    assert.equal(mocks.parse.mock.callCount(), 1);
    assert.deepEqual(mocks.parse.mock.calls[0].arguments, ["test", {}]);

    parse.setOpts({ autoLinkRules: [{ pattern: "foo", target: "bar" }] });
    parse.withMemo("test");
    assert.equal(mocks.parse.mock.callCount(), 2);
    assert.deepEqual(mocks.parse.mock.calls[1].arguments, [
      "test",
      { autoLinkRules: [{ pattern: "foo", target: "bar" }] },
    ]);
  });
});
