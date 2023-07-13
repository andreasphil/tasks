<script setup lang="ts">
import TPageItem from "@/components/TPageItem.vue";
import VTextarea2 from "@/components/controls/VTextarea2.vue";
import { Item, TaskStatus, parse } from "@/lib/parser";
import { ContinueListRule, continueListRules } from "@/lib/text";
import { usePage } from "@/stores/page";
import { ref } from "vue";

const props = defineProps<{
  pageId: string;
}>();

// @ts-expect-error Vue types seem to be buggy here
const textareaEl = ref<InstanceType<typeof VTextarea2> | null>(null);

const { exists, text, updateItem } = usePage(() => props.pageId);

/* -------------------------------------------------- *
 * Editor hooks and customizations                    *
 * -------------------------------------------------- */

function rowToTask(row: string): Item {
  return parse(row);
}

const continueLists: ContinueListRule[] = [
  { pattern: /\t*\[-] /, next: "same" },
  { pattern: /\t*\[.\] /, next: (match) => match.replace(/\[.\]/, "[ ]") },
  ...Object.values(continueListRules),
];

/* -------------------------------------------------- *
 * Interacting with items                             *
 * -------------------------------------------------- */

function updateStatus(index: number, status: TaskStatus) {
  updateItem(index, (item) => {
    item.status = status;
  });
}

/* -------------------------------------------------- *
 * DOM interactions                                   *
 * -------------------------------------------------- */

function focus(): void {
  textareaEl.value?.focus(0);
}

/* -------------------------------------------------- *
 * Public interface                                   *
 * -------------------------------------------------- */

defineExpose({ focus });
</script>

<template>
  <p v-if="!exists">This page doesn't exist!</p>

  <VTextarea2
    v-else-if="text !== undefined"
    :class="$style.editor"
    :context-provider="rowToTask"
    :continue-lists="continueLists"
    ref="textareaEl"
    v-model="text"
  >
    <template #row="{ context, index }">
      <TPageItem
        :as="index === 0 ? 'heading' : undefined"
        :item="context"
        @update:status="updateStatus(index, $event)"
      />
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
