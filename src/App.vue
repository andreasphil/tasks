<script setup lang="ts">
import { useThemeColor } from "@andreasphil/design-system";
import { onMounted } from "vue";
import { RouterView } from "vue-router";

onMounted(() => {
  useThemeColor();
});
</script>

<template>
  <command-bar></command-bar>
  <RouterView />
</template>
