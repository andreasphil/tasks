<script setup>
const props = defineProps({
  type: { type: String, default: "button" },
  variant: { type: String, default: "primary" },
  loading: { type: Boolean, default: false },
});
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
