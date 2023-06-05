<script setup>
import VTextarea2 from "./controls/VTextarea2.vue";
</script>

<template>
  <VTextarea2 :class="$style.editor" />
</template>

<style module>
.editor {
  background: transparent;
  border: transparent;
  caret-color: var(--primary);
  line-height: var(--line-height);
  margin: auto;
  max-width: 50rem;
  min-height: 100%;
  padding: 0.25rem 0;
}
</style>
