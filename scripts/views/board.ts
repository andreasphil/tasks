import {
  Check,
  CircleDashed,
  Construction,
  HelpCircle,
  Star,
} from "lucide-static";
import { computed, defineComponent, reactive } from "vue";
import ItemCard from "../components/itemCard.ts";
import { html } from "../lib/html.ts";
import type { TaskStatus } from "../lib/parser.ts";
import { useStatusPage, type StatusPageItem } from "../stores/statusPage.ts";

export default defineComponent({
  name: "Board",

  components: { ItemCard },

  setup() {
    const { items, updateOnPage } = useStatusPage();

    // Columns ------------------------------------------------

    const columns = computed<
      Array<{
        name: string;
        icon: string;
        status: TaskStatus;
        items: StatusPageItem[];
      }>
    >(() => [
      {
        name: "To do",
        icon: CircleDashed,
        status: "incomplete",
        items: items.value.get("incomplete") ?? [],
      },
      {
        name: "Important",
        icon: Star,
        status: "important",
        items: items.value.get("important") ?? [],
      },
      {
        name: "In progress",
        icon: Construction,
        status: "inProgress",
        items: items.value.get("inProgress") ?? [],
      },
      {
        name: "Waiting",
        icon: HelpCircle,
        status: "question",
        items: items.value.get("question") ?? [],
      },
      {
        name: "Done",
        icon: Check,
        status: "completed",
        items: items.value.get("completed") ?? [],
      },
    ]);

    // Drag & drop handling -----------------------------------

    const drag = reactive<{
      active: boolean;
      item: number | null;
      from: TaskStatus | null;
      to: TaskStatus | null;
    }>({ active: false, item: null, from: null, to: null });

    function setDragFrom(
      value: boolean,
      item: number | null = null,
      from: TaskStatus | null = null
    ) {
      drag.active = value;

      if (value) {
        drag.item = item;
        drag.from = from;
      } else {
        drag.item = null;
        drag.from = null;
        drag.to = null;
      }
    }

    function setDragTo(to: TaskStatus) {
      drag.to = to;
    }

    function updateStatus() {
      if (drag.item === null || !drag.from || !drag.to) return;
      updateOnPage(drag.item, drag.from, drag.to);
      setDragFrom(false);
    }

    return {
      columns,
      drag,
      setDragFrom,
      setDragTo,
      updateStatus,
    };
  },

  template: html`
    <div class="board">
      <h2 v-for="column in columns" class="column-heading" :key="column.status">
        <span v-html="column.icon" />
        {{ column.name }}
      </h2>

      <div v-for="column in columns" class="column" :key="column.status">
        <div data-with-fallback class="column-content">
          <ul class="cards">
            <ItemCard
              v-for="(item, i) in column.items"
              @is-dragging="setDragFrom($event, i, column.status)"
              :item
            />
          </ul>

          <div data-when="empty">
            <span v-html="column.icon" />
          </div>
        </div>

        <div
          v-if="drag.active && drag.from !== column.status"
          @dragenter.prevent="setDragTo(column.status)"
          @dragover.prevent
          @drop="updateStatus()"
          :class="[
            'column-droptarget',
            { dragover: drag.to === column.status },
          ]"
        >
          <span v-html="column.icon" />
          Change to "{{ column.name }}"
        </div>
      </div>
    </div>
  `,
});
