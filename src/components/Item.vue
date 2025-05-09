<script setup lang="ts">
import { getDateHint } from "@/lib/date";
import type { Item, TaskStatus } from "@/lib/parser";
import { computed } from "vue";

const { item, as } = defineProps<{
  item: Item;
  as?: Item["type"];
}>();

const emit = defineEmits<{
  (emit: "update:status", value: TaskStatus): void;
}>();

// Rendering ----------------------------------------------

const htmlTags: Record<Item["type"], string> = {
  heading: "h2",
  note: "p",
  task: "div",
};

const effectiveType = computed(() => as ?? item.type);

const htmlTag = computed(() => htmlTags[effectiveType.value] ?? "div");

// Status -------------------------------------------------

const status = computed(() =>
  item.type === "task" ? item.status : "incomplete"
);

function updateStatus() {
  emit(
    "update:status",
    item.status === "completed" ? "incomplete" : "completed"
  );
}

// Due date -----------------------------------------------

const todayOrOverdue = computed(() => {
  const today = new Date();
  today.setHours(23, 59, 59);
  return item.dueDate && new Date(item.dueDate as Date) <= today;
});

const dueDateHint = computed(() => {
  if (!item.dueDate) return undefined;
  return getDateHint(item.dueDate as Date);
});
</script>

<template>
  <component :is="htmlTag" :class="[$style.item, $style[effectiveType]]">
    <template v-for="token in item.tokens" :key="token.matchStart">
      <button
        v-if="token.type === 'status'"
        :class="[$style.token, $style.status, $style[status]]"
        @click.prevent.stop="updateStatus()"
        type="button"
      >
        {{ token.raw }}
      </button>

      <span
        v-else-if="token.type === 'dueDate'"
        :class="[
          $style.token,
          $style.dueDate,
          { [$style.today]: todayOrOverdue && item.status !== 'completed' },
        ]"
        :data-tooltip="dueDateHint"
        >{{ token.raw }}</span
      >

      <span
        v-else-if="token.type === 'tag'"
        :class="[$style.token, $style.tag]"
        >{{ token.raw }}</span
      >

      <a
        v-else-if="token.type === 'link'"
        :class="[$style.link]"
        :href="token.value"
        target="_blank"
        >{{ token.raw }}</a
      >

      <template v-else>{{ token.raw }}</template>
    </template>
  </component>
</template>

<style module>
/* Top level item types -------------------------------- */

.item {
  --item-bg: color-mix(in oklch, currentColor, transparent 93%);
  --red: hsl(350 90% 65%);

  font: inherit;
  margin: 0;
  padding: 0;
}

.heading {
  color: var(--c-fg);
  font-weight: var(--font-weight-bold);
}

.task:has(.status.completed) {
  color: var(--c-fg-variant);
}

/* Token types ----------------------------------------- */

.status {
  all: unset;
  border-radius: var(--border-radius-small);
  cursor: pointer;
  pointer-events: initial;
  transition: var(--transition);
  transition-property: background-color;

  &:hover {
    background-color: var(--item-bg);
  }

  &.important {
    color: var(--red);
  }

  &.important,
  &.inProgress,
  &.question {
    font-weight: var(--font-weight-bold);
  }
}

.dueDate {
  background-color: var(--item-bg);
  border-radius: var(--border-radius-small);
  color: var(--c-fg-variant);
  cursor: help;
  pointer-events: initial;
  position: relative;
  white-space: nowrap;

  &.today {
    color: var(--red);
  }
}

.tag {
  background-color: var(--item-bg);
  border-radius: var(--border-radius-small);
  color: var(--c-fg-variant);
  position: relative;
  white-space: nowrap;
}

.link {
  color: var(--primary);
  font-weight: var(--font-weight-normal);
  pointer-events: initial;
  text-decoration-color: var(--primary);
  text-decoration-thickness: var(--border-width);
  text-underline-offset: 0.125rem;
}
</style>
