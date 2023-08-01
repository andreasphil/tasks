<script setup lang="ts">
import { VBarContext, type Command } from "@/components/VBar.vue";
import VDownloadDialog from "@/components/VDownloadDialog.vue";
import VDueDateDialog from "@/components/VDueDateDialog.vue";
import VEmpty from "@/components/VEmpty.vue";
import VPageItem from "@/components/VPageItem.vue";
import VTextarea2 from "@/components/VTextarea2.vue";
import { nextWeek, today, tomorrow } from "@/lib/date";
import { Item, TaskStatus, parse } from "@/lib/parser";
import { continueListRules, type ContinueListRule } from "@/lib/text";
import { usePage } from "@/stores/page";
import {
  Calendar,
  CalendarSearch,
  CalendarX2,
  Check,
  CircleDashed,
  Construction,
  Download,
  FileX2,
  Heading1,
  HelpCircle,
  Star,
  StickyNote,
} from "lucide-vue-next";
import memize from "memize";
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

watch(pageId, async () => {
  await nextTick();
  textareaEl.value?.focus(0);
});

onMounted(() => {
  textareaEl.value?.focus(0);
});

/* -------------------------------------------------- *
 * Editor hooks and customizations                    *
 * -------------------------------------------------- */

const parseWithMemo = memize(parse);

function rowToTask(row: string): Item {
  return parseWithMemo(row);
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

const dueDateDialog = ref(false);

const dueDateDialogValue = ref<string>();

function beginUpdateDueDate() {
  dueDateDialog.value = true;
}

function setDueDateFromDialog() {
  updateDueDate(
    currentItemIndex.value,
    dueDateDialogValue.value ? new Date(dueDateDialogValue.value) : undefined
  );
}

async function updateDueDate(
  index: number,
  dueDate: Date | "today" | "tomorrow" | "next-week" | undefined,
  keepSelection = true
) {
  let effectiveDueDate: Date | undefined;

  if (dueDate === "today") {
    effectiveDueDate = today();
  } else if (dueDate === "tomorrow") {
    effectiveDueDate = tomorrow();
  } else if (dueDate === "next-week") {
    effectiveDueDate = nextWeek();
  } else {
    effectiveDueDate = dueDate;
  }

  updateItem(index, (item) => {
    item.dueDate = effectiveDueDate;
  });

  if (keepSelection) {
    await nextTick();
    textareaEl.value?.focus(...currentSelection.value);
  }
}

async function updateStatus(
  index: number,
  status: TaskStatus,
  keepSelection = true
) {
  updateItem(index, (item) => {
    if (item.type !== "task") item.type = "task";
    item.status = status;
  });

  if (keepSelection) {
    await nextTick();
    textareaEl.value?.focus(...currentSelection.value);
  }
}

async function updateType(
  index: number,
  type: Item["type"],
  keepSelection = true
) {
  const lenBefore = text.value?.length ?? 0;

  updateItem(index, (item) => {
    item.type = type;
  });

  if (keepSelection) {
    await nextTick();
    const lenAfter = text.value?.length ?? 0;
    const newSelection = currentSelection.value[0] + lenAfter - lenBefore;
    textareaEl.value?.focus(newSelection);
  }
}

/* -------------------------------------------------- *
 * Downloads                                          *
 * -------------------------------------------------- */

const downloadDialog = ref(false);

function beginDownload() {
  downloadDialog.value = true;
}

/* -------------------------------------------------- *
 * Command bar integration                            *
 * -------------------------------------------------- */

const vbar = inject(VBarContext, null);

let cleanup: (() => void) | null = null;

const commands: Command[] = [
  // Due date
  {
    id: "item:dueDate:today",
    name: "Today",
    groupName: "Due",
    chord: "dut",
    icon: Calendar,
    action: () => updateDueDate(currentItemIndex.value, "today"),
  },
  {
    id: "item:dueDate:tomorrow",
    name: "Tomorrow",
    chord: "dum",
    groupName: "Due",
    icon: Calendar,
    action: () => updateDueDate(currentItemIndex.value, "tomorrow"),
  },
  {
    id: "item:dueDate:nextWeek",
    name: "Next week",
    alias: ["monday"],
    chord: "dun",
    groupName: "Due",
    icon: Calendar,
    action: () => updateDueDate(currentItemIndex.value, "next-week"),
  },
  {
    id: "item:dueDate:custom",
    name: "Custom",
    alias: ["pick"],
    chord: ">>",
    groupName: "Due",
    icon: CalendarSearch,
    action: () => beginUpdateDueDate(),
  },
  {
    id: "item:dueDate:clear",
    name: "Clear",
    groupName: "Due",
    icon: CalendarX2,
    action: () => updateDueDate(currentItemIndex.value, undefined),
  },

  // Status
  {
    id: "task:status:incomplete",
    name: "Incomplete",
    alias: ["todo"],
    chord: "oo",
    groupName: "Set status",
    icon: CircleDashed,
    action: () => updateStatus(currentItemIndex.value, "incomplete"),
  },
  {
    id: "task:status:complete",
    name: "Complete",
    alias: ["done"],
    chord: "xx",
    groupName: "Set status",
    icon: Check,
    action: () => updateStatus(currentItemIndex.value, "completed"),
  },
  {
    id: "task:status:inProgress",
    name: "In progress",
    alias: ["doing"],
    chord: "//",
    groupName: "Set status",
    icon: Construction,
    action: () => updateStatus(currentItemIndex.value, "inProgress"),
  },
  {
    id: "task:status:important",
    name: "Important",
    groupName: "Set status",
    chord: "!!",
    icon: Star,
    action: () => updateStatus(currentItemIndex.value, "important"),
  },
  {
    id: "task:status:question",
    name: "Question",
    alias: ["waiting"],
    chord: "??",
    groupName: "Set status",
    icon: HelpCircle,
    action: () => updateStatus(currentItemIndex.value, "question"),
  },

  // Type
  {
    id: "item:type:note",
    name: "Note",
    groupName: "Turn into",
    chord: "tun",
    icon: StickyNote,
    action: () => updateType(currentItemIndex.value, "note"),
  },
  {
    id: "item:type:heading",
    name: "Heading",
    groupName: "Turn into",
    alias: ["section"],
    chord: "tuh",
    icon: Heading1,
    action: () => updateType(currentItemIndex.value, "heading"),
  },
  {
    id: "item:type:task",
    name: "Task",
    groupName: "Turn into",
    chord: "tut",
    icon: Check,
    action: () => updateType(currentItemIndex.value, "task"),
  },

  // Page
  {
    id: "page:download",
    name: "Download copy",
    alias: ["save", "export"],
    groupName: "Page",
    icon: Download,
    action: () => beginDownload(),
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
    :spellcheck="false"
    @update:current-line-index="currentItemIndex = $event"
    @update:current-selection-range="currentSelection = $event"
    ref="textareaEl"
    v-model="text"
  >
    <template #row="{ context, index }">
      <VPageItem
        :as="index === 0 ? 'heading' : undefined"
        :item="context"
        @update:status="updateStatus(index, $event, false)"
      />
    </template>
  </VTextarea2>

  <VDownloadDialog v-if="exists" v-model="downloadDialog" :pageId="pageId" />

  <VDueDateDialog
    @confirmed="setDueDateFromDialog()"
    v-model:selected-date="dueDateDialogValue"
    v-model="dueDateDialog"
  />
</template>

<style module>
.editor {
  caret-color: var(--c-fg);
  font-family: var(--font-mono);
  margin: auto;
  max-width: 50rem;
  min-height: 100%;
}
</style>
