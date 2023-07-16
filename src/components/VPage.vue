<script setup lang="ts">
import VPageItem from "@/components/VPageItem.vue";
import VEmpty from "@/components/VEmpty.vue";
import VTextarea2 from "@/components/VTextarea2.vue";
import { Item, TaskStatus, parse } from "@/lib/parser";
import { continueListRules, type ContinueListRule } from "@/lib/text";
import { usePage } from "@/stores/page";
import { FileX2 } from "lucide-vue-next";
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
  <VEmpty v-if="!exists" :icon="FileX2" text="This page doesn't exist." />

  <VTextarea2
    v-else-if="text !== undefined"
    :class="$style.editor"
    :context-provider="rowToTask"
    :continue-lists="continueLists"
    ref="textareaEl"
    v-model="text"
  >
    <template #row="{ context, index }">
      <VPageItem
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
