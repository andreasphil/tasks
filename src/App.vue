<script setup lang="ts">
import { useThemeColor } from "@/lib/themeColor";
import { RouterView } from "vue-router";

useThemeColor();
</script>

<template>
  <RouterView />
</template>
