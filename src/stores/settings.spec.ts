import { afterEach, describe, expect, test, vi } from "vitest";
import { parse } from "@/stores/appParser";
import { useSettings } from "./settings";
import { nextTick } from "vue";

vi.hoisted(() => {
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
});

vi.mock("@/stores/appParser", () => {
  const parse = vi.fn();
  // @ts-expect-error Not a property of the mock but of the mocked function
  parse.setOpts = vi.fn();
  return { parse };
});

describe("settings", () => {
  afterEach(() => {
    // Reset settings to defaults
    const { settings } = useSettings();
    settings.autoLinkRules = [];

    vi.unstubAllGlobals();
  });

  test("updates the parser when the rules change", () => {
    const { settings } = useSettings();
    settings.autoLinkRules = [{ pattern: "foo", target: "bar" }];
    expect(parse.setOpts).toHaveBeenCalled();
  });

  test("persists modifications in local storage", async () => {
    const setItem = vi.fn();
    vi.stubGlobal("localStorage", { ...localStorage, setItem });

    const { settings } = useSettings();
    settings.autoLinkRules = [{ pattern: "foo", target: "bar" }];
    await nextTick();
    expect(setItem).toHaveBeenCalled();
  });

  test("notifies subscribers when settings change", async () => {
    const cb = vi.fn();
    const { settings, onSettingsChange } = useSettings();

    onSettingsChange(cb);
    settings.autoLinkRules = [{ pattern: "foo", target: "bar" }];
    await nextTick();

    expect(cb).toHaveBeenCalled();
  });
});
