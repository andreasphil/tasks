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
    :ariaBusy="loading || undefined"
    :dataVariant="variant"
    :type="type"
  >
    <slot />
  </button>
</template>
