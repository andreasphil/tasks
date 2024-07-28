<script setup lang="ts">
import DownloadDialog from "@/components/DownloadDialog.vue";
import DueDateDialog from "@/components/DueDateDialog.vue";
import { default as PageItem } from "@/components/Item.vue";
import {
  parseWithMemo as rowToTask,
  type Item,
  type TaskStatus,
} from "@/lib/parser";
import { usePage } from "@/stores/page";
import { useCommandBar, type Command } from "@andreasphil/vue-command-bar";
import Textarea2, {
  type AutoComplete,
  type EditingContext,
} from "@andreasphil/vue-textarea2";
import {
  continueListRules,
  type ContinueListRule,
} from "@andreasphil/vue-textarea2/text";
import dayjs from "dayjs";
import {
  Calendar,
  CalendarSearch,
  CalendarX2,
  Check,
  CircleDashed,
  Construction,
  Download,
  Ghost,
  Heading1,
  HelpCircle,
  Hourglass,
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

const { pageExists, pageText, updateOnPage } = usePage(() => pageId.value);

// @ts-expect-error Vue types seem to be buggy here
const textareaEl = ref<InstanceType<typeof Textarea2> | null>(null);

watch(pageId, async () => {
  await nextTick();
  textareaEl.value?.withContext(({ focus }: EditingContext) => {
    focus({ to: "absolute", start: 0 });
  });
});

onMounted(() => {
  textareaEl.value?.withContext(({ focus }: EditingContext) => {
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

function updateDueDate(
  dueDate: Date | "today" | "tomorrow" | "next-week" | "end-of-week" | undefined
) {
  textareaEl.value?.withContext((ctx: EditingContext) => {
    let effectiveDueDate: Date | undefined;

    if (dueDate === "today") {
      effectiveDueDate = dayjs().endOf("day").toDate();
    } else if (dueDate === "tomorrow") {
      effectiveDueDate = dayjs().add(1, "day").endOf("day").toDate();
    } else if (dueDate === "next-week") {
      effectiveDueDate = dayjs().add(1, "week").startOf("week").toDate();
    } else if (dueDate === "end-of-week") {
      effectiveDueDate = dayjs().weekday(4).toDate();
    } else {
      effectiveDueDate = dueDate;
    }

    updateOnPage(ctx.selectedLines[0], (item) => {
      item.dueDate = effectiveDueDate;
    });

    ctx.adjustSelection({ to: "absolute", start: ctx.selectionStart });
  });
}

function postpone(time: "1d" | "1w") {
  textareaEl.value?.withContext((ctx: EditingContext) => {
    updateOnPage(ctx.selectedLines[0], (item) => {
      const base = (item.dueDate as Date) ?? new Date();
      let effectiveDueDate: Date | undefined;

      if (time === "1d") {
        effectiveDueDate = dayjs(base).add(1, "day").toDate();
      } else if (time === "1w") {
        effectiveDueDate = dayjs(base).add(1, "week").toDate();
      }

      item.dueDate = effectiveDueDate;
    });

    ctx.adjustSelection({ to: "absolute", start: ctx.selectionStart });
  });
}

function updateStatus(
  status: TaskStatus,
  index?: number,
  keepSelection = true
) {
  textareaEl.value?.withContext((ctx: EditingContext) => {
    let effectiveIndex = index ?? ctx.selectedLines[0];

    updateOnPage(effectiveIndex, (item) => {
      if (item.type !== "task") item.type = "task";
      item.status = status;
    });

    if (keepSelection) {
      ctx.adjustSelection({ to: "absolute", start: ctx.selectionStart });
    }
  });
}

function updateType(type: Item["type"]) {
  textareaEl.value?.withContext((ctx: EditingContext) => {
    const lenBefore = pageText.value?.length ?? 0;

    updateOnPage(ctx.selectedLines[0], (item) => {
      item.type = type;
    });

    const lenAfter = pageText.value?.length ?? 0;
    ctx.adjustSelection({ to: "relative", delta: lenAfter - lenBefore });
  });
}

/* -------------------------------------------------- *
 * Autocomplete                                       *
 * -------------------------------------------------- */

const completions: AutoComplete[] = [
  {
    id: "dueDate",
    trigger: "@",
    commands: [
      {
        id: "today",
        name: "Today",
        icon: Calendar,
        initial: true,
        value: () => dayjs().format("@YYYY-MM-DD"),
      },
      {
        id: "tomorrow",
        name: "Tomorrow",
        icon: Calendar,
        initial: true,
        value: () => dayjs().add(1, "day").format("@YYYY-MM-DD"),
      },
      {
        id: "next-week",
        name: "Next week",
        icon: Calendar,
        initial: true,
        value: () =>
          dayjs().add(1, "week").startOf("week").format("@YYYY-MM-DD"),
      },
      {
        id: "end-of-week",
        name: "End of week",
        icon: Calendar,
        initial: true,
        value: () => dayjs().weekday(4).format("@YYYY-MM-DD"),
      },
      {
        id: "custom",
        name: "Custom",
        icon: CalendarSearch,
        initial: true,
        value: () => {
          beginUpdateDueDate();
          return undefined;
        },
      },
    ],
  },
];

/* -------------------------------------------------- *
 * Downloads                                          *
 * -------------------------------------------------- */

const downloadDialog = ref(false);

function beginDownload() {
  downloadDialog.value = true;
}

/* -------------------------------------------------- *@
 * Command bar integration                            *
 * -------------------------------------------------- */

const cmdBar = useCommandBar();

let cleanup: (() => void) | null = null;

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
    id: "item:dueDate:endOfWeek",
    name: "End of week",
    alias: ["@", "eow", "friday"],
    chord: "@e",
    groupName: "Due",
    icon: Calendar,
    action: () => updateDueDate("end-of-week"),
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

  // Postponing
  {
    id: "item:postpone:1d",
    name: "1 day",
    alias: ["due", "+"],
    chord: "+d",
    groupName: "Postpone",
    icon: Hourglass,
    action: () => postpone("1d"),
  },
  {
    id: "item:postpone:1w",
    name: "1 week",
    alias: ["due", "+"],
    chord: "+w",
    groupName: "Postpone",
    icon: Hourglass,
    action: () => postpone("1w"),
  },

  // Status
  {
    id: "task:status:incomplete",
    name: "To do",
    alias: ["incomplete", "open", "todo"],
    chord: "o",
    groupName: "Set status",
    icon: CircleDashed,
    action: () => updateStatus("incomplete"),
  },
  {
    id: "task:status:complete",
    name: "Done",
    alias: ["complete"],
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
    name: "Waiting",
    alias: ["question"],
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
      <Textarea2
        v-if="pageText !== undefined"
        :autocomplete="completions"
        :class="[$style.editor, 'text-mono']"
        :context-provider="rowToTask"
        :continue-lists="continueLists"
        :spellcheck="false"
        ref="textareaEl"
        v-model="pageText"
      >
        <template #row="{ context, index }">
          <PageItem
            :as="index === 0 ? 'heading' : undefined"
            :item="context"
            @update:status="updateStatus($event, index, false)"
          />
        </template>
      </Textarea2>
    </div>

    <div data-when="empty">
      <Ghost />
      <p>This page doesn't exist.</p>
    </div>
  </article>

  <DownloadDialog v-if="pageExists" v-model="downloadDialog" :pageId="pageId" />

  <DueDateDialog
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

  menu {
    margin: 0.25rem 0 0 0;
    font-family: var(--font-family);
    font-size: var(--font-size);
  }
}
</style>
