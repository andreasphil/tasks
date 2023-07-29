<script setup lang="ts">
import VBackupDialog from "@/components/VBackupDialog.vue";
import { Command, VBarContext } from "@/components/VBar.vue";
import VEmpty from "@/components/VEmpty.vue";
import VPageItem from "@/components/VPageItem.vue";
import VTextarea2 from "@/components/VTextarea2.vue";
import { nextWeek, today, tomorrow } from "@/lib/date";
import { Item, TaskStatus, parse } from "@/lib/parser";
import { continueListRules, type ContinueListRule } from "@/lib/text";
import { usePage } from "@/stores/page";
import { Download } from "lucide-vue-next";
import {
  Calendar,
  CalendarX2,
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

async function updateStatus(
  index: number,
  status: TaskStatus,
  keepSelection = true
) {
  updateItem(index, (item) => {
    item.status = status;
  });

  if (keepSelection) {
    await nextTick();
    textareaEl.value?.focus(...currentSelection.value);
  }
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

/* -------------------------------------------------- *
 * Backups                                            *
 * -------------------------------------------------- */

const backupDialog = ref(false);

function beginBackup() {
  backupDialog.value = true;
}

/* -------------------------------------------------- *
 * Command bar integration                            *
 * -------------------------------------------------- */

const vbar = inject(VBarContext, null);

let cleanup: (() => void) | null = null;

const commands: Command[] = [
  // Task status
  {
    id: "task:status:incomplete",
    name: "Incomplete",
    alias: ["todo", "open", "oo"],
    groupName: "Set status",
    icon: CircleDashed,
    action: () => updateStatus(currentItemIndex.value, "incomplete"),
  },
  {
    id: "task:status:complete",
    name: "Complete",
    alias: ["done", "dd"],
    groupName: "Set status",
    icon: Check,
    action: () => updateStatus(currentItemIndex.value, "completed"),
  },
  {
    id: "task:status:inProgress",
    name: "In progress",
    alias: ["doing", "//"],
    groupName: "Set status",
    icon: Construction,
    action: () => updateStatus(currentItemIndex.value, "inProgress"),
  },
  {
    id: "task:status:important",
    name: "Important",
    alias: ["starred", "!!", "**"],
    groupName: "Set status",
    icon: Star,
    action: () => updateStatus(currentItemIndex.value, "important"),
  },
  {
    id: "task:status:question",
    name: "Question",
    alias: ["blocked", "waiting", "??"],
    groupName: "Set status",
    icon: HelpCircle,
    action: () => updateStatus(currentItemIndex.value, "question"),
  },

  // Due date
  {
    id: "task:dueDate:today",
    name: "Today",
    groupName: "Set due date",
    icon: Calendar,
    action: () => updateDueDate(currentItemIndex.value, "today"),
  },
  {
    id: "task:dueDate:tomorrow",
    name: "Tomorrow",
    groupName: "Set due date",
    icon: Calendar,
    action: () => updateDueDate(currentItemIndex.value, "tomorrow"),
  },
  {
    id: "task:dueDate:nextWeek",
    name: "Next week",
    groupName: "Set due date",
    icon: Calendar,
    action: () => updateDueDate(currentItemIndex.value, "next-week"),
  },
  {
    id: "task:dueDate:clear",
    name: "Clear",
    groupName: "Set due date",
    icon: CalendarX2,
    action: () => updateDueDate(currentItemIndex.value, undefined),
  },

  // Backups
  {
    id: "page:backup",
    name: "Download copy",
    alias: ["backup", "save", "export"],
    groupName: "Page",
    icon: Download,
    action: () => beginBackup(),
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

  <VBackupDialog v-if="exists" v-model="backupDialog" :pageId="pageId" />
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
