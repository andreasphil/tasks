<script setup lang="ts">
import VEmpty from "@/components/VEmpty.vue";
import VLayout from "@/components/VLayout.vue";
import { Ghost } from "lucide-vue-next";
</script>

<template>
  <VLayout>
    <VEmpty :icon="Ghost" text="This page doesn't exist." />
  </VLayout>
</template>
