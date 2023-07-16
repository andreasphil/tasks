<script setup lang="ts">
import { Command, VBarContext } from "@/components/VBar.vue";
import VEmpty from "@/components/VEmpty.vue";
import VPageItem from "@/components/VPageItem.vue";
import VTextarea2 from "@/components/VTextarea2.vue";
import { Item, TaskStatus, parse } from "@/lib/parser";
import { continueListRules, type ContinueListRule } from "@/lib/text";
import { usePage } from "@/stores/page";
import {
  Check,
  CircleDashed,
  Construction,
  FileX2,
  HelpCircle,
  Star,
} from "lucide-vue-next";
import {
  computed,
  inject,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import { useRoute } from "vue-router";

/* -------------------------------------------------- *
 * Current page                                       *
 * -------------------------------------------------- */

const route = useRoute();

const pageId = computed(() => route.params.id?.toString());

const { exists, text, updateItem } = usePage(() => pageId.value);

// @ts-expect-error Vue types seem to be buggy here
const textareaEl = ref<InstanceType<typeof VTextarea2> | null>(null);

watch(pageId, () => {
  textareaEl.value?.focus(0);
});

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

const currentItemIndex = ref(0);

const currentSelection = ref<[number, number]>([0, 0]);

async function updateStatus(index: number, status: TaskStatus) {
  updateItem(index, (item) => {
    item.status = status;
  });

  await nextTick();
  textareaEl.value?.focus(...currentSelection.value);
}

/* -------------------------------------------------- *
 * Command bar integration                            *
 * -------------------------------------------------- */

const vbar = inject(VBarContext, null);

let cleanup: (() => void) | null = null;

const commands: Command[] = [
  {
    id: "task:incomplete",
    name: "Incomplete",
    alias: ["todo", "open", "oo"],
    groupName: "Set status",
    icon: CircleDashed,
    action: () => updateStatus(currentItemIndex.value, "incomplete"),
  },
  {
    id: "task:complete",
    name: "Complete",
    alias: ["done", "dd"],
    groupName: "Set status",
    icon: Check,
    action: () => updateStatus(currentItemIndex.value, "completed"),
  },
  {
    id: "task:inProgress",
    name: "In progress",
    alias: ["doing", "//"],
    groupName: "Set status",
    icon: Construction,
    action: () => updateStatus(currentItemIndex.value, "inProgress"),
  },
  {
    id: "task:important",
    name: "Important",
    alias: ["starred", "!!", "**"],
    groupName: "Set status",
    icon: Star,
    action: () => updateStatus(currentItemIndex.value, "important"),
  },
  {
    id: "task:question",
    name: "Question",
    alias: ["blocked", "waiting", "??"],
    groupName: "Set status",
    icon: HelpCircle,
    action: () => updateStatus(currentItemIndex.value, "question"),
  },
];

onMounted(() => {
  cleanup = vbar?.registerCommand(...commands) ?? null;
});

onBeforeUnmount(() => {
  cleanup?.();
});
</script>

<template>
  <VEmpty v-if="!exists" :icon="FileX2" text="This page doesn't exist." />

  <VTextarea2
    v-else-if="text !== undefined"
    :class="$style.editor"
    :context-provider="rowToTask"
    :continue-lists="continueLists"
    @update:current-line-index="currentItemIndex = $event"
    @update:current-selection-range="currentSelection = $event"
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
