import {
  CommandBar,
  renderSvgFromString,
  type Command,
} from "@andreasphil/command-bar";
import { Textarea2 } from "@andreasphil/textarea2";
import * as Plugins from "@andreasphil/textarea2/plugins";
import dayjs from "dayjs";
import {
  computed,
  defineComponent,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useTemplateRef,
  watch,
} from "vue";
import { useRoute } from "vue-router";
import DownloadDialog from "../components/downloadDialog.ts";
import DueDateDialog from "../components/dueDateDialog.ts";
import { default as PageItem } from "../components/item.ts";
import { html } from "../lib/html.ts";
import {
  Bookmark,
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
} from "../lib/icons.ts";
import type { Item, TaskStatus } from "../lib/parser.ts";
import { parse } from "../stores/appParser.ts";
import { usePage } from "../stores/page.ts";
import { useTags } from "../stores/tags.ts";

export default defineComponent({
  name: "Page",

  components: { DownloadDialog, DueDateDialog, PageItem },

  setup() {
    // Current page -------------------------------------------

    const route = useRoute();

    const pageId = computed(() => route.params.id?.toString());

    const { pageExists, pageText, updateOnPage } = usePage(() => pageId.value);

    watch(pageId, async () => {
      await nextTick();
      textareaEl.value?.act(({ focus }) => {
        focus({ to: "absolute", start: 0 });
      });
    });

    onMounted(() => {
      textareaEl.value?.act(({ focus }) => {
        const maybeLine = Number(route.query.line);
        if (Number.isFinite(maybeLine)) {
          focus({ to: "endOfLine", endOf: maybeLine });
        } else {
          focus({ to: "absolute", start: 0 });
        }
      });
    });

    // Interacting with items ---------------------------------

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
      dueDate:
        | Date
        | "today"
        | "tomorrow"
        | "next-week"
        | "end-of-week"
        | undefined,
    ) {
      textareaEl.value?.act(
        async ({ selectedLines, selectionStart, select }) => {
          let effectiveDueDate: Date | undefined;
          let oldSelection = selectionStart();

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

          updateOnPage(selectedLines()[0], (item) => {
            item.dueDate = effectiveDueDate;
          });

          await nextTick();
          select({ to: "absolute", start: oldSelection });
        },
      );
    }

    function postpone(time: "1d" | "1w") {
      textareaEl.value?.act(
        async ({ selectedLines, selectionStart, select }) => {
          let oldSelection = selectionStart();

          updateOnPage(selectedLines()[0], (item) => {
            const base = (item.dueDate as Date) ?? new Date();
            let effectiveDueDate: Date | undefined;

            if (time === "1d") {
              effectiveDueDate = dayjs(base).add(1, "day").toDate();
            } else if (time === "1w") {
              effectiveDueDate = dayjs(base).add(1, "week").toDate();
            }

            item.dueDate = effectiveDueDate;
          });

          await nextTick();
          select({ to: "absolute", start: oldSelection });
        },
      );
    }

    function updateStatus(status: TaskStatus) {
      textareaEl.value?.act(
        async ({ selectedLines, selectionStart, select }) => {
          let oldSelection = selectionStart();

          let effectiveIndex = selectedLines()[0];

          updateOnPage(effectiveIndex, (item) => {
            if (item.type !== "task") item.type = "task";
            item.status = status;
          });

          await nextTick();
          select({ to: "absolute", start: oldSelection });
        },
      );
    }

    function toggleCompleted(index: number) {
      textareaEl.value?.act(async ({ selectionStart, select }) => {
        let oldSelection = selectionStart();

        updateOnPage(index, (item) => {
          if (item.type !== "task") item.type = "task";
          item.status =
            item.status === "completed" ? "incomplete" : "completed";
        });

        await nextTick();
        select({ to: "absolute", start: oldSelection });
      });
    }

    function updateType(type: Item["type"]) {
      textareaEl.value?.act(
        async ({ selectedLines, select, selectionStart }) => {
          const lenBefore = pageText.value?.length ?? 0;
          const selectionBefore = selectionStart();

          updateOnPage(selectedLines()[0], (item) => {
            item.type = type;
          });

          const lenAfter = pageText.value?.length ?? 0;
          await nextTick();
          select({
            to: "absolute",
            start: selectionBefore + lenAfter - lenBefore,
          });
        },
      );
    }

    // Editor hooks and customizations ------------------------

    const dueDateCompletions: Plugins.AutoComplete = {
      id: "dueDate",
      trigger: "@",
      commands: [
        {
          id: "today",
          name: "Today",
          icon: renderSvgFromString(Calendar),
          initial: true,
          value: () => dayjs().format("@YYYY-MM-DD"),
        },
        {
          id: "tomorrow",
          name: "Tomorrow",
          icon: renderSvgFromString(Calendar),
          initial: true,
          value: () => dayjs().add(1, "day").format("@YYYY-MM-DD"),
        },
        {
          id: "next-week",
          name: "Next week",
          icon: renderSvgFromString(Calendar),
          initial: true,
          value: () =>
            dayjs().add(1, "week").startOf("week").format("@YYYY-MM-DD"),
        },
        {
          id: "end-of-week",
          name: "End of week",
          icon: renderSvgFromString(Calendar),
          initial: true,
          value: () => dayjs().weekday(4).format("@YYYY-MM-DD"),
        },
        {
          id: "custom",
          name: "Custom",
          icon: renderSvgFromString(CalendarSearch),
          initial: true,
          value: () => {
            beginUpdateDueDate();
            return undefined;
          },
        },
      ],
    };

    const tags = useTags();

    const tagCompletions: Plugins.AutoComplete = {
      id: "tags",
      trigger: "#",
      commands: () =>
        tags.value.map((t, i) => ({
          id: t,
          name: t,
          value: `#${t}`,
          initial: i < 5,
          icon: renderSvgFromString(Bookmark),
        })),
    };

    const taskCompletions: Plugins.AutoComplete = {
      id: "tasks",
      trigger: "[",
      commands: [
        {
          id: "incomplete",
          name: "To do",
          value: "[ ] ",
          initial: true,
          icon: renderSvgFromString(CircleDashed),
        },
        {
          id: "important",
          name: "Important",
          value: "[*] ",
          initial: true,
          icon: renderSvgFromString(Star),
        },
        {
          id: "inProgress",
          name: "In progress",
          value: "[/] ",
          initial: true,
          icon: renderSvgFromString(Construction),
        },
        {
          id: "question",
          name: "Waiting",
          value: "[?] ",
          initial: true,
          icon: renderSvgFromString(HelpCircle),
        },
        {
          id: "complete",
          name: "Done",
          value: "[x] ",
          initial: true,
          icon: renderSvgFromString(Check),
        },
      ],
    };

    const textareaEl = useTemplateRef<Textarea2 | null>("textareaEl");

    const lists: Plugins.ContinueListRule[] = [
      { pattern: /^\t*\[-] /, next: "same" },
      { pattern: /^\t*\[.\] /, next: (match) => match.replace(/\[.\]/, "[ ]") },
      ...Object.values(Plugins.defaultContinueListRules),
    ];

    onMounted(() => {
      textareaEl.value?.use(
        new Plugins.AutocompletePlugin([
          dueDateCompletions,
          tagCompletions,
          taskCompletions,
        ]),
        new Plugins.FlipLinesPlugin(),
        new Plugins.FullLineEditsPlugin(),
        new Plugins.ListsPlugin(lists),
        new Plugins.TabsPlugin(),
      );
    });

    const items = computed(() =>
      pageText.value?.split("\n").map((line) => parse.withMemo(line)),
    );

    // Downloads ----------------------------------------------

    const downloadDialog = ref(false);

    function beginDownload() {
      downloadDialog.value = true;
    }

    // Command bar integration --------------------------------

    let cleanup: (() => void) | null = null;

    const commands: Command[] = [
      // Due date
      {
        id: "item:dueDate:today",
        name: "Today",
        alias: ["@"],
        groupName: "Due",
        chord: "@t",
        icon: renderSvgFromString(Calendar),
        action: () => updateDueDate("today"),
      },
      {
        id: "item:dueDate:tomorrow",
        name: "Tomorrow",
        alias: ["@"],
        chord: "@m",
        groupName: "Due",
        icon: renderSvgFromString(Calendar),
        action: () => updateDueDate("tomorrow"),
      },
      {
        id: "item:dueDate:nextWeek",
        name: "Next week",
        alias: ["@", "monday"],
        chord: "@n",
        groupName: "Due",
        icon: renderSvgFromString(Calendar),
        action: () => updateDueDate("next-week"),
      },
      {
        id: "item:dueDate:endOfWeek",
        name: "End of week",
        alias: ["@", "eow", "friday"],
        chord: "@e",
        groupName: "Due",
        icon: renderSvgFromString(Calendar),
        action: () => updateDueDate("end-of-week"),
      },
      {
        id: "item:dueDate:custom",
        name: "Custom",
        alias: ["@"],
        chord: "@@",
        groupName: "Due",
        icon: renderSvgFromString(CalendarSearch),
        action: () => beginUpdateDueDate(),
      },
      {
        id: "item:dueDate:clear",
        name: "Clear",
        alias: ["@"],
        groupName: "Due",
        icon: renderSvgFromString(CalendarX2),
        action: () => updateDueDate(undefined),
      },

      // Postponing
      {
        id: "item:postpone:1d",
        name: "1 day",
        alias: ["due", "+"],
        chord: "+d",
        groupName: "Postpone",
        icon: renderSvgFromString(Hourglass),
        action: () => postpone("1d"),
      },
      {
        id: "item:postpone:1w",
        name: "1 week",
        alias: ["due", "+"],
        chord: "+w",
        groupName: "Postpone",
        icon: renderSvgFromString(Hourglass),
        action: () => postpone("1w"),
      },

      // Status
      {
        id: "task:status:incomplete",
        name: "To do",
        alias: ["incomplete", "open", "todo"],
        chord: "o",
        groupName: "Set status",
        icon: renderSvgFromString(CircleDashed),
        action: () => updateStatus("incomplete"),
      },
      {
        id: "task:status:complete",
        name: "Done",
        alias: ["complete"],
        chord: "x",
        groupName: "Set status",
        icon: renderSvgFromString(Check),
        action: () => updateStatus("completed"),
      },
      {
        id: "task:status:inProgress",
        name: "In progress",
        alias: ["doing"],
        chord: "/",
        groupName: "Set status",
        icon: renderSvgFromString(Construction),
        action: () => updateStatus("inProgress"),
      },
      {
        id: "task:status:important",
        name: "Important",
        groupName: "Set status",
        chord: "*",
        icon: renderSvgFromString(Star),
        action: () => updateStatus("important"),
      },
      {
        id: "task:status:question",
        name: "Waiting",
        alias: ["question"],
        chord: "?",
        groupName: "Set status",
        icon: renderSvgFromString(HelpCircle),
        action: () => updateStatus("question"),
      },

      // Type
      {
        id: "item:type:note",
        name: "Note",
        groupName: "Turn into",
        chord: "tun",
        icon: renderSvgFromString(StickyNote),
        action: () => updateType("note"),
      },
      {
        id: "item:type:heading",
        name: "Heading",
        groupName: "Turn into",
        alias: ["section"],
        chord: "tuh",
        icon: renderSvgFromString(Heading1),
        action: () => updateType("heading"),
      },
      {
        id: "item:type:task",
        name: "Task",
        groupName: "Turn into",
        chord: "tut",
        icon: renderSvgFromString(Check),
        action: () => updateType("task"),
      },

      // Page
      {
        id: "page:download",
        name: "Download copy",
        alias: ["save", "export"],
        groupName: "Page",
        icon: renderSvgFromString(Download),
        action: () => beginDownload(),
      },
    ];

    onMounted(() => {
      cleanup = CommandBar.instance?.registerCommand(...commands) ?? null;
    });

    onBeforeUnmount(() => {
      cleanup?.();
    });

    return {
      pageExists,
      pageText,
      textareaEl,
      items,
      toggleCompleted,
      downloadDialog,
      pageId,
      dueDateDialog,
      dueDateDialogValue,
      setDueDateFromDialog,
      Ghost,
    };
  },

  template: html`
    <article has-fallback>
      <div>
        <textarea-2
          v-if="pageText !== undefined"
          class="editor"
          overscroll
          ref="textareaEl"
        >
          <textarea spellcheck="false" v-model="pageText"></textarea>
          <div class="t2-output" custom>
            <PageItem
              v-for="(item, index) in items"
              :as="index === 0 ? 'heading' : undefined"
              :item="item"
              @update:status="toggleCompleted(index)"
            />
          </div>
        </textarea-2>
      </div>

      <div fallback-for="empty">
        <span v-html="Ghost" />
        <p>This page doesn't exist.</p>
      </div>
    </article>

    <DownloadDialog
      v-if="pageExists"
      v-model="downloadDialog"
      :pageId="pageId"
    />

    <DueDateDialog
      @confirmed="setDueDateFromDialog()"
      v-model:selected-date="dueDateDialogValue"
      v-model="dueDateDialog"
    />
  `,
});
