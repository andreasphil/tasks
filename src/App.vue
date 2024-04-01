<script setup lang="ts">
import { useThemeColor } from "@andreasphil/design-system";
import VueCommandBar from "@andreasphil/vue-command-bar";
import { Frown } from "lucide-vue-next";
import { onMounted } from "vue";
import { RouterView } from "vue-router";

onMounted(() => {
  useThemeColor();
});
</script>

<template>
  <VueCommandBar>
    <RouterView />

    <template #empty>
      <Frown />
      <p>Sorry, couldn't find anything.</p>
    </template>
  </VueCommandBar>
</template>
