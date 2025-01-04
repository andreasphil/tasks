<script setup lang="ts">
import ItemCard from "@/components/ItemCard.vue";
import type { TaskStatus } from "@/lib/parser";
import { useStatusPage, type StatusPageItem } from "@/stores/statusPage";
import {
  Check,
  CircleDashed,
  Construction,
  HelpCircle,
  Star,
} from "lucide-static";
import { computed, reactive } from "vue";

const { items, updateOnPage } = useStatusPage();

/* -------------------------------------------------- *
 * Columns                                            *
 * -------------------------------------------------- */

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

/* -------------------------------------------------- *
 * Drag & drop handling                               *
 * -------------------------------------------------- */

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
</script>

<template>
  <div :class="$style.board">
    <h2
      v-for="column in columns"
      :class="$style.columnHeading"
      :key="column.status"
    >
      <span v-html="column.icon" />
      {{ column.name }}
    </h2>

    <div v-for="column in columns" :class="$style.column" :key="column.status">
      <div data-with-fallback :class="$style.columnContent">
        <ul :class="$style.cards">
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
          $style.columnDroptarget,
          { [$style.dragover]: drag.to === column.status },
        ]"
      >
        <span v-html="column.icon" />
        Change to "{{ column.name }}"
      </div>
    </div>
  </div>
</template>

<style module>
.board {
  display: grid;
  grid-template-columns: repeat(5, minmax(16rem, 1fr));
  grid-template-rows: min-content 1fr;
  height: 100dvh;
  margin: 0 -2rem 0 0;
  overflow: auto;
  padding: 4rem 0.75rem 0 0.5rem;
}

.column {
  overflow: hidden;
  position: relative;
}

.columnHeading {
  align-items: center;
  display: flex;
  font-size: var(--font-size);
  gap: 0.375rem;
  margin: 0;
  padding: 0 1.25rem 0.5rem 0.5rem;
  text-transform: capitalize;
}

.columnContent {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  height: 100%;
  overflow: auto;
  padding: 0.75rem 1rem 2rem 0.5rem;
  scrollbar-width: thin;
}

.cards {
  display: contents;
}

.columnDroptarget {
  -webkit-backdrop-filter: blur(4px);
  align-items: center;
  backdrop-filter: blur(4px);
  background: color-mix(in srgb, var(--c-surface-variant-bg), transparent 25%);
  border-radius: var(--border-radius-large);
  border: var(--border-width-large) dashed var(--c-border);
  color: var(--c-fg-variant);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  inset: 0 0.75rem 1.5rem 0;
  justify-content: center;
  padding: 1rem;
  position: absolute;
  transition: var(--transition);
  transition-property: background-color, border-color, color;

  &.dragover {
    background: color-mix(in srgb, var(--primary-100), transparent 25%);
    border-color: var(--primary);
    color: var(--primary);
  }
}
</style>
