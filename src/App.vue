<script setup lang="ts">
import AutoLinkRulesDialog from "@/components/AutoLinkRulesDialog.vue";
import { useThemeColor } from "@andreasphil/design-system";
import { onMounted, ref } from "vue";
import { RouterView } from "vue-router";
import { CommandBar, renderSvgFromString } from "@andreasphil/command-bar";
import { ExternalLink } from "lucide-static";

onMounted(() => {
  useThemeColor();
});

/* -------------------------------------------------- *
 * Settings                                           *
 * -------------------------------------------------- */

const autoLinkSettings = ref(false);

/* -------------------------------------------------- *
 * Command bar                                        *
 * -------------------------------------------------- */

onMounted(() => {
  CommandBar.instance?.registerCommand({
    id: "settings:auto-link-rules",
    name: "Automatic links",
    groupName: "Settings",
    icon: renderSvgFromString(ExternalLink),
    action: () => (autoLinkSettings.value = true),
  });
});
</script>

<template>
  <command-bar></command-bar>
  <RouterView />

  <!-- Settings -->
  <AutoLinkRulesDialog v-model="autoLinkSettings" />
</template>
