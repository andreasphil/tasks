import { AutoLinkRule } from "@/lib/parser";
import { reactive, watch, watchEffect } from "vue";
import { parse } from "./appParser";

type Settings = {
  autoLinkRules: AutoLinkRule[];
};

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

  watchEffect(() => {
    if (settings.autoLinkRules) {
      parse.setOpts({ autoLinkRules: settings.autoLinkRules });
    }
  });

  return () => ({
    settings,
  });
}

export const useSettings = createSettingsStore();
