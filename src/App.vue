<script setup lang="ts">
import VBar from "@/components/VBar.vue";
import { useThemeColor } from "@andreasphil/design-system";
import { onMounted } from "vue";
import { RouterView } from "vue-router";

onMounted(() => {
  useThemeColor();
});
</script>

<template>
  <VBar>
    <RouterView />
  </VBar>
</template>
