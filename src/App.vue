<script setup>
import { useThemeColor } from "finecss";
import { onMounted } from "vue";
import { RouterView } from "vue-router";

onMounted(() => {
  useThemeColor();
});
</script>

<template>
  <RouterView />
</template>
