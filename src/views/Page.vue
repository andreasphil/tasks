<script setup lang="ts">
import VDownloadDialog from "@/components/VDownloadDialog.vue";
import VDueDateDialog from "@/components/VDueDateDialog.vue";
import VPageItem from "@/components/VPageItem.vue";
import { nextWeek, today, tomorrow } from "@/lib/date";
import { Item, parseWithMemo as rowToTask, TaskStatus } from "@/lib/parser";
import { usePage } from "@/stores/page";
import { useCommandBar, type Command } from "@andreasphil/vue-command-bar";
import VueTextarea2, {
  type EditingContext as TextareaContext,
} from "@andreasphil/vue-textarea2";
import {
  continueListRules,
  type ContinueListRule,
} from "@andreasphil/vue-textarea2/text";
import {
  Calendar,
  CalendarSearch,
  CalendarX2,
  Check,
  CircleDashed,
  Construction,
  Download,
  Frown,
  Heading1,
  HelpCircle,
  Star,
  StickyNote,
} from "lucide-vue-next";
import {
  computed,
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
const textareaEl = ref<InstanceType<typeof VueTextarea2> | null>(null);

watch(pageId, async () => {
  await nextTick();
  textareaEl.value?.withContext(({ focus }: TextareaContext) => {
    focus({ to: "absolute", start: 0 });
  });
});

onMounted(() => {
  textareaEl.value?.withContext(({ focus }: TextareaContext) => {
    focus({ to: "absolute", start: 0 });
  });
});

/* -------------------------------------------------- *
 * Editor hooks and customizations                    *
 * -------------------------------------------------- */

const continueLists: ContinueListRule[] = [
  { pattern: /^\t*\[-] /, next: "same" },
  { pattern: /^\t*\[.\] /, next: (match) => match.replace(/\[.\]/, "[ ]") },
  ...Object.values(continueListRules),
];

/* -------------------------------------------------- *
 * Interacting with items                             *
 * -------------------------------------------------- */

const dueDateDialog = ref(false);

const dueDateDialogValue = ref<string>();

function beginUpdateDueDate() {
  dueDateDialog.value = true;
}

function setDueDateFromDialog() {
  const date = dueDateDialogValue.value
    ? new Date(dueDateDialogValue.value)
    : undefined;

  updateDueDate(date);
}

async function updateDueDate(
  dueDate: Date | "today" | "tomorrow" | "next-week" | undefined
) {
  textareaEl.value?.withContext((ctx: TextareaContext) => {
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

    updateItem(ctx.selectedLines[0], (item) => {
      item.dueDate = effectiveDueDate;
    });

    ctx.adjustSelection({ to: "absolute", start: ctx.selectionStart });
  });
}

async function updateStatus(
  status: TaskStatus,
  index?: number,
  keepSelection = true
) {
  textareaEl.value?.withContext((ctx: TextareaContext) => {
    let effectiveIndex = index ?? ctx.selectedLines[0];

    updateItem(effectiveIndex, (item) => {
      if (item.type !== "task") item.type = "task";
      item.status = status;
    });

    if (keepSelection) {
      ctx.adjustSelection({ to: "absolute", start: ctx.selectionStart });
    }
  });
}

async function updateType(type: Item["type"]) {
  textareaEl.value?.withContext((ctx: TextareaContext) => {
    const lenBefore = text.value?.length ?? 0;

    updateItem(ctx.selectedLines[0], (item) => {
      item.type = type;
    });

    const lenAfter = text.value?.length ?? 0;
    ctx.adjustSelection({ to: "relative", delta: lenAfter - lenBefore });
  });
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

const cmdBar = useCommandBar();

let cleanup: (() => void) | null = null;

function pickDueDate() {
  cmdBar.open("@");
}

const commands: Command[] = [
  // Due date
  {
    id: "item:dueDate:today",
    name: "Today",
    alias: ["@"],
    groupName: "Due",
    chord: "@t",
    icon: Calendar,
    action: () => updateDueDate("today"),
  },
  {
    id: "item:dueDate:tomorrow",
    name: "Tomorrow",
    alias: ["@"],
    chord: "@m",
    groupName: "Due",
    icon: Calendar,
    action: () => updateDueDate("tomorrow"),
  },
  {
    id: "item:dueDate:nextWeek",
    name: "Next week",
    alias: ["@", "monday"],
    chord: "@n",
    groupName: "Due",
    icon: Calendar,
    action: () => updateDueDate("next-week"),
  },
  {
    id: "item:dueDate:custom",
    name: "Custom",
    alias: ["@"],
    chord: "@@",
    groupName: "Due",
    icon: CalendarSearch,
    action: () => beginUpdateDueDate(),
  },
  {
    id: "item:dueDate:clear",
    name: "Clear",
    alias: ["@"],
    groupName: "Due",
    icon: CalendarX2,
    action: () => updateDueDate(undefined),
  },

  // Status
  {
    id: "task:status:incomplete",
    name: "Incomplete",
    alias: ["todo"],
    chord: "o",
    groupName: "Set status",
    icon: CircleDashed,
    action: () => updateStatus("incomplete"),
  },
  {
    id: "task:status:complete",
    name: "Complete",
    alias: ["done"],
    chord: "x",
    groupName: "Set status",
    icon: Check,
    action: () => updateStatus("completed"),
  },
  {
    id: "task:status:inProgress",
    name: "In progress",
    alias: ["doing"],
    chord: "/",
    groupName: "Set status",
    icon: Construction,
    action: () => updateStatus("inProgress"),
  },
  {
    id: "task:status:important",
    name: "Important",
    groupName: "Set status",
    chord: "*",
    icon: Star,
    action: () => updateStatus("important"),
  },
  {
    id: "task:status:question",
    name: "Question",
    alias: ["waiting"],
    chord: "?",
    groupName: "Set status",
    icon: HelpCircle,
    action: () => updateStatus("question"),
  },

  // Type
  {
    id: "item:type:note",
    name: "Note",
    groupName: "Turn into",
    chord: "tun",
    icon: StickyNote,
    action: () => updateType("note"),
  },
  {
    id: "item:type:heading",
    name: "Heading",
    groupName: "Turn into",
    alias: ["section"],
    chord: "tuh",
    icon: Heading1,
    action: () => updateType("heading"),
  },
  {
    id: "item:type:task",
    name: "Task",
    groupName: "Turn into",
    chord: "tut",
    icon: Check,
    action: () => updateType("task"),
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
  cleanup = cmdBar?.registerCommand(...commands) ?? null;
});

onBeforeUnmount(() => {
  cleanup?.();
});
</script>

<template>
  <article data-with-fallback>
    <div>
      <VueTextarea2
        v-if="text !== undefined"
        :class="[$style.editor, 'text-mono']"
        :context-provider="rowToTask"
        :continue-lists="continueLists"
        :spellcheck="false"
        @keydown.@.stop.prevent="pickDueDate()"
        ref="textareaEl"
        v-model="text"
      >
        <template #row="{ context, index }">
          <VPageItem
            :as="index === 0 ? 'heading' : undefined"
            :item="context"
            @update:status="updateStatus($event, index, false)"
          />
        </template>
      </VueTextarea2>
    </div>

    <div data-when="empty">
      <Frown />
      <p>This page doesn't exist.</p>
    </div>
  </article>

  <VDownloadDialog v-if="exists" v-model="downloadDialog" :pageId="pageId" />

  <VDueDateDialog
    @confirmed="setDueDateFromDialog()"
    v-model:selected-date="dueDateDialogValue"
    v-model="dueDateDialog"
  />
</template>

<style module>
.editor {
  caret-color: var(--primary);
  margin: auto;
  max-width: 50rem;
}
</style>
