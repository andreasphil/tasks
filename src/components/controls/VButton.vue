<script setup lang="ts">
withDefaults(
  defineProps<{
    type?: "button" | "submit" | "reset";
    variant?: "outline" | "ghost";
    loading?: boolean;
  }>(),
  { type: "button" }
);
</script>

<template>
  <button
    :aria-busy="loading || undefined"
    :data-variant="variant"
    :type="type"
  >
    <slot />
  </button>
</template>
