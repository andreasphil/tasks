import { computed, defineComponent, type PropType } from "vue";
import { getDateHint } from "../lib/date.ts";
import { html } from "../lib/html.ts";
import type { Item } from "../lib/parser.ts";
import "./item.css";

export default defineComponent({
  name: "Item",

  props: {
    item: { type: Object as PropType<Item>, required: true },
    as: { type: String as PropType<Item["type"]> },
  },

  emits: ["update:status"],

  setup(props, { emit }) {
    // Rendering ----------------------------------------------

    const htmlTags: Record<Item["type"], string> = {
      heading: "h2",
      note: "p",
      task: "div",
    };

    const effectiveType = computed(() => props.as ?? props.item.type);

    const htmlTag = computed(() => htmlTags[effectiveType.value] ?? "div");

    // Status -------------------------------------------------

    const status = computed(() =>
      props.item.type === "task" ? props.item.status : "incomplete"
    );

    function updateStatus() {
      emit(
        "update:status",
        props.item.status === "completed" ? "incomplete" : "completed"
      );
    }

    // Due date -----------------------------------------------

    const todayOrOverdue = computed(() => {
      const today = new Date();
      today.setHours(23, 59, 59);
      return (
        props.item.dueDate && new Date(props.item.dueDate as Date) <= today
      );
    });

    const dueDateHint = computed(() => {
      if (!props.item.dueDate) return undefined;
      return getDateHint(props.item.dueDate as Date);
    });

    return {
      dueDateHint,
      effectiveType,
      htmlTag,
      status,
      todayOrOverdue,
      updateStatus,
    };
  },

  template: html`
    <component :is="htmlTag" :class="['item', effectiveType]">
      <template v-for="token in item.tokens" :key="token.matchStart">
        <button
          v-if="token.type === 'status'"
          :class="status"
          @click.prevent.stop="updateStatus()"
          class="token status"
          type="button"
        >
          {{ token.raw }}
        </button>

        <span
          v-else-if="token.type === 'dueDate'"
          :class="{ today: todayOrOverdue && item.status !== 'completed' }"
          :data-tooltip="dueDateHint"
          class="token dueDate"
          >{{ token.raw }}</span
        >

        <span v-else-if="token.type === 'tag'" class="token tag"
          >{{ token.raw }}</span
        >

        <a
          v-else-if="token.type === 'link'"
          :href="token.value"
          class="link"
          target="_blank"
          >{{ token.raw }}</a
        >

        <template v-else>{{ token.raw }}</template>
      </template>
    </component>
  `,
});
