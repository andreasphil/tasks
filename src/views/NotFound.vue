<script setup lang="ts">
import VEmpty from "@/components/controls/VEmpty.vue";
import VOffcanvas from "@/components/controls/VOffcanvas.vue";
import { Ghost } from "lucide-vue-next";
</script>

<template>
  <VOffcanvas>
    <VEmpty :icon="Ghost" text="This page doesn't exist." />
  </VOffcanvas>
</template>
