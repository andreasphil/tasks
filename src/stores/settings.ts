import { reactive, watch, watchEffect } from "vue";
import type { AutoLinkRule } from "../lib/parser.ts";
import { parse } from "./appParser.ts";

type Settings = {
  autoLinkRules: AutoLinkRule[];
};

type OnSettingsChangeCallback = () => void;

function createSettingsStore() {
  const settings = reactive<Settings>({
    autoLinkRules: [],
  });

  // Persisting ---------------------------------------------

  function loadFromStorage() {
    const saved = localStorage.getItem("settings");
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      Object.assign(settings, parsed);
    } catch (e) {
      console.error("Failed to restore settings:", e);
    }
  }

  function saveToStorage() {
    localStorage.setItem("settings", JSON.stringify(settings));
  }

  watch(settings, () => saveToStorage(), { deep: true });

  loadFromStorage();

  // Side effects of settings -------------------------------

  const subscribers = new Set<OnSettingsChangeCallback>();

  function subscribe(cb: OnSettingsChangeCallback) {
    subscribers.add(cb);
  }

  function notify() {
    subscribers.forEach((s) => s());
  }

  watchEffect(() => {
    if (settings.autoLinkRules) {
      parse.setOpts({ autoLinkRules: settings.autoLinkRules });
      notify();
    }
  });

  return () => ({
    onSettingsChange: subscribe,
    settings,
  });
}

export const useSettings = createSettingsStore();
