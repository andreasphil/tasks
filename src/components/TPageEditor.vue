<script setup lang="ts">
import VTextarea2 from "@/components/controls/VTextarea2.vue";
import TPageItem from "@/components/TPageItem.vue";
import { Item, parse } from "@/lib/parser";

defineProps<{
  modelValue: string;
}>();

defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

function rowToTask(row: string): Item {
  return parse(row);
}
</script>

<template>
  <VTextarea2
    :class="$style.editor"
    :contextProvider="rowToTask"
    :modelValue="modelValue"
    @update:modelValue="$emit('update:modelValue', $event)"
    lineHeight="calc(var(--line-height) * 1em)"
  >
    <template #row="{ context, index }">
      <TPageItem :item="context" :as="index === 0 ? 'heading' : undefined" />
    </template>
  </VTextarea2>
</template>

<style module>
.editor {
  caret-color: var(--primary);
  margin: auto;
  max-width: 50rem;
  min-height: 100%;
  padding-top: 0.25rem;
  font-family: var(--font-mono);
}
</style>
