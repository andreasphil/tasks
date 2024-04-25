<script setup lang="ts">
import { RouterLink, type RouteLocationRaw } from "vue-router";

defineProps<{ to: RouteLocationRaw }>();
</script>

<template>
  <RouterLink :to custom v-slot="{ isExactActive, href, navigate }">
    <a :data-active="isExactActive" :href="href" @click="navigate">
      <slot />
    </a>
  </RouterLink>
</template>
