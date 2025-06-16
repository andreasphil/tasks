import assert from "node:assert/strict";
import { afterEach, before, describe, mock, test } from "node:test";
import { nextTick } from "vue";
import type { useSettings as useSettingsFn } from "./settings.ts";

describe("settings", () => {
  let mocks = { parse: mock.fn() };
  let useSettings: typeof useSettingsFn;

  before(async () => {
    const mockStorage = new Map();
    globalThis.localStorage = {
      getItem: (key: string) => mockStorage.get(key),
      setItem: (key: string, value: unknown) => mockStorage.set(key, value),
      removeItem: (key: string) => mockStorage.delete(key),
      key: (i: number) => Array.from(mockStorage.keys())[i] ?? null,
      clear: () => mockStorage.clear(),
      get length() {
        return mockStorage.size;
      },
    };

    // @ts-expect-error Not a property of the mock but of the mocked function
    mocks.parse.setOpts = mock.fn();

    mock.module("./appParser.ts", {
      namedExports: {
        parse: mocks.parse,
      },
    });

    useSettings = (await import("./settings.ts")).useSettings;
  });

  afterEach(() => {
    // Reset settings to defaults
    const { settings } = useSettings();
    settings.autoLinkRules = [];

    // Clear localStorage
    localStorage.clear();
  });

  test("updates the parser when the rules change", () => {
    const { settings } = useSettings();
    settings.autoLinkRules = [{ pattern: "foo", target: "bar" }];
    // @ts-expect-error Not a property of the mock but of the mocked function
    assert.equal(mocks.parse.setOpts.mock.callCount(), 1);
  });

  test("persists modifications in local storage", async () => {
    const setItem = mock.method(globalThis.localStorage, "setItem");

    const { settings } = useSettings();
    settings.autoLinkRules = [{ pattern: "foo", target: "bar" }];
    await nextTick();
    assert.equal(setItem.mock.callCount(), 1);
  });

  test("notifies subscribers when settings change", async () => {
    const cb = mock.fn();
    const { settings, onSettingsChange } = useSettings();

    onSettingsChange(cb);
    settings.autoLinkRules = [{ pattern: "foo", target: "bar" }];
    await nextTick();

    assert.equal(cb.mock.callCount(), 1);
  });
});
