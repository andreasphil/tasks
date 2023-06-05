<script setup lang="ts">
import VTextarea2 from "@/components/controls/VTextarea2.vue";

defineProps<{
  modelValue: string;
}>();

defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();
</script>

<template>
  <VTextarea2
    :class="$style.editor"
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
  />
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
  padding-top: 0.25rem;
}
</style>
