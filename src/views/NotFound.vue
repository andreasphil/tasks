<script setup lang="ts">
import VLayout from "@/components/VLayout.vue";
import { Ghost } from "lucide-vue-next";
</script>

<template>
  <VLayout>
    <div data-with-fallback="emtpy">
      <div />
      <div data-when="empty">
        <Ghost />
        <p>This URL doesn't exist.</p>
        <RouterLink :to="{ name: 'Home' }">Take me back</RouterLink>
      </div>
    </div>
  </VLayout>
</template>
