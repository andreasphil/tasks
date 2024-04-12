<script setup lang="ts">
import type { Item, TaskStatus } from "@/lib/parser";
import { computed } from "vue";

const props = defineProps<{
  item: Item;
  as?: Item["type"];
}>();

const emit = defineEmits<{
  (emit: "update:status", value: TaskStatus): void;
}>();

/* -------------------------------------------------- *
 * Rendering                                          *
 * -------------------------------------------------- */

const htmlTags: Record<Item["type"], string> = {
  heading: "h2",
  note: "p",
  task: "div",
};

const effectiveType = computed(() => props.as ?? props.item.type);

const htmlTag = computed(() => htmlTags[effectiveType.value] ?? "div");

/* -------------------------------------------------- *
 * Status                                             *
 * -------------------------------------------------- */

const status = computed(() =>
  props.item.type === "task" ? props.item.status : "incomplete"
);

function updateStatus() {
  emit(
    "update:status",
    props.item.status === "completed" ? "incomplete" : "completed"
  );
}

/* -------------------------------------------------- *
 * Due date                                           *
 * -------------------------------------------------- */

const todayOrOverdue = computed(() => {
  const today = new Date();
  today.setHours(23, 59, 59);
  return props.item.dueDate && new Date(props.item.dueDate as Date) <= today;
});
</script>

<template>
  <component
    :is="htmlTag"
    :class="[
      $style.item,
      $style[effectiveType],
      { [$style.completed]: status === 'completed' },
    ]"
  >
    <template v-for="token in item.tokens" :key="token.matchStart">
      <button
        v-if="token.type === 'status'"
        :class="[$style.token, $style.status, $style[status]]"
        @click.prevent.stop="updateStatus()"
        type="button"
      >
        {{ token.match }}
      </button>

      <span
        v-else-if="token.type === 'dueDate'"
        :class="[
          $style.token,
          $style.dueDate,
          { [$style.today]: todayOrOverdue && item.status !== 'completed' },
        ]"
        >{{ token.match }}</span
      >

      <span
        v-else-if="token.type === 'tag'"
        :class="[$style.token, $style.tag]"
        >{{ token.match }}</span
      >

      <a
        v-else-if="token.type === 'link'"
        :class="[$style.link]"
        :href="token.match"
        target="_blank"
        >{{ token.match }}</a
      >

      <template v-else>{{ token.match }}</template>
    </template>
  </component>
</template>

<style module>
/* -------------------------------------------------- *
 * Top level item types                               *
 * -------------------------------------------------- */

.item {
  --item-neutral-bg: hsl(var(--theme-tint) 15% 65% / 0.075);
  border-radius: var(--border-radius-small);
}

.heading {
  color: var(--c-fg);
  font: inherit;
  font-weight: var(--font-weight-bold);
  margin: 0;
  padding: 0;
}

.task {
  font: inherit;
}

.task.completed {
  color: var(--c-fg-variant);
}

.note {
  font: inherit;
  margin: 0;
  padding: 0;
}

/* -------------------------------------------------- *
 * Token types                                        *
 * -------------------------------------------------- */

.status {
  all: unset;
  border-radius: var(--border-radius-small);
  cursor: pointer;
  pointer-events: initial;
  transition: var(--transition);
  transition-property: background-color;
}

.status:hover {
  background: var(--c-surface-variant-bg);
}

.status.important {
  color: var(--red-500);
  font-weight: var(--font-weight-bold);
}

.status.important:hover {
  background: var(--red-50);
}

.status.inProgress,
.status.question {
  font-weight: var(--font-weight-bold);
}

.dueDate {
  border-radius: var(--border-radius-small);
  color: var(--c-fg-variant);
  position: relative;
  white-space: nowrap;
}

.dueDate::after {
  background-color: var(--item-neutral-bg);
  border-radius: inherit;
  bottom: 0px;
  content: "";
  left: -2px;
  position: absolute;
  right: -2px;
  top: 0px;
}

.dueDate.today {
  color: var(--red-500);
}

.dueDate.today::after {
  background-color: var(--red-50);
}

.tag {
  border-radius: var(--border-radius-small);
  color: var(--c-fg-variant);
  position: relative;
  white-space: nowrap;
}

.tag::after {
  background-color: var(--item-neutral-bg);
  border-radius: inherit;
  bottom: 0px;
  content: "";
  left: -2px;
  position: absolute;
  right: -2px;
  top: 0px;
}

.link {
  color: var(--primary);
  font-weight: var(--font-weight-normal);
  pointer-events: initial;
  text-decoration-color: var(--primary);
  text-decoration-thickness: var(--border-width);
  text-decoration: underline;
  text-underline-offset: 0.125rem;
}
</style>
