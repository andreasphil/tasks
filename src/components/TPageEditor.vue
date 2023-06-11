<script setup lang="ts">
import VTextarea2 from "@/components/controls/VTextarea2.vue";
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
    <template #row="{ row, context, index }">
      <h1 v-if="index === 0" :class="$style.heading">
        {{ row }}
      </h1>

      <h2 v-else-if="context.type === 'heading'" :class="$style.heading">
        {{ row }}
      </h2>

      <p v-else-if="context.type === 'note'" :class="$style.note">
        {{ row }}
      </p>

      <template v-else>{{ row }}</template>
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

.heading {
  font: inherit;
  font-weight: var(--font-weight-bold);
  margin: 0;
  padding: 0;
}

.note {
  color: var(--neutral-700);
  font: inherit;
  margin: 0;
  padding: 0;
}
@media (prefers-color-scheme: dark) {
  .note {
    color: var(--neutral-300);
  }
}
</style>
