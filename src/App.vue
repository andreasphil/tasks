<script setup lang="ts">
import { useThemeColor } from "@andreasphil/design-system";
import CommandBar from "@andreasphil/vue-command-bar";
import { Frown } from "lucide-vue-next";
import { onMounted } from "vue";
import { RouterView } from "vue-router";

onMounted(() => {
  useThemeColor();
});
</script>

<template>
  <CommandBar>
    <RouterView />

    <template #empty>
      <Frown />
      <p>Sorry, couldn't find anything.</p>
    </template>
  </CommandBar>
</template>
