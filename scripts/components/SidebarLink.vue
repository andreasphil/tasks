<script setup lang="ts">
import { type RouteLocationRaw, RouterLink } from "vue-router";

defineProps<{
  to: RouteLocationRaw;
}>();
</script>

<template>
  <RouterLink :to custom v-slot="{ isExactActive, href, navigate }">
    <a :aria-current="isExactActive" :href="href" @click="navigate">
      <slot />
    </a>
  </RouterLink>
</template>
