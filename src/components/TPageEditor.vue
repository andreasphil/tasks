<script setup lang="ts">
import TPageItem from "@/components/TPageItem.vue";
import VTextarea2 from "@/components/controls/VTextarea2.vue";
import { Item, parse } from "@/lib/parser";
import { ContinueListRule, continueListRules } from "@/lib/text";

defineProps<{
  modelValue: string;
}>();

defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

function rowToTask(row: string): Item {
  return parse(row);
}

const continueLists: ContinueListRule[] = [
  { pattern: /\t*\[-] /, next: "same" },
  { pattern: /\t*\[.\] /, next: (match) => match.replace(/\[.\]/, "[ ]") },
  ...Object.values(continueListRules),
];
</script>

<template>
  <VTextarea2
    :class="$style.editor"
    :contextProvider="rowToTask"
    :continueLists="continueLists"
    :modelValue="modelValue"
    @update:modelValue="$emit('update:modelValue', $event)"
  >
    <template #row="{ context, index }">
      <TPageItem :item="context" :as="index === 0 ? 'heading' : undefined" />
    </template>
  </VTextarea2>
</template>

<style module>
.editor {
  caret-color: var(--c-fg);
  font-family: var(--font-mono);
  margin: auto;
  max-width: 50rem;
  min-height: 100%;
  padding-top: 0.25rem;
}
</style>
