<script setup lang="ts">
import { Item } from "@/lib/parser";
import { computed } from "vue";

const props = defineProps<{
  item: Item;
  as?: Item["type"];
}>();

const tags: Record<Item["type"], string> = {
  heading: "h2",
  note: "p",
  task: "div",
};

const tag = computed(() => tags[effectiveType.value] ?? "div");

const status = computed(() =>
  props.item.type === "task" ? props.item.status : "incomplete"
);

const todayOrOverdue = computed(() => {
  const today = new Date();
  const dueLatest = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    23,
    59,
    59
  );

  return (
    props.item.dueDate && new Date(props.item.dueDate as Date) <= dueLatest
  );
});

const effectiveType = computed(() => props.as ?? props.item.type);
</script>

<template>
  <component
    :is="tag"
    :class="[
      $style.item,
      $style[effectiveType],
      { [$style.completed]: status === 'completed' },
    ]"
  >
    <template v-for="token in item.tokens" :key="token.matchStart">
      <span
        v-if="token.type === 'status'"
        :class="[$style.token, $style.status, $style[status]]"
        >{{ token.match }}</span
      >

      <span
        v-else-if="token.type === 'dueDate'"
        :class="[
          $style.token,
          $style.dueDate,
          { [$style.today]: todayOrOverdue },
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

.token {
  border-radius: var(--border-radius-small);
}

.status.important {
  color: var(--red);
  font-weight: var(--font-weight-bold);
}

.status.inProgress,
.status.question {
  font-weight: var(--font-weight-bold);
}

.dueDate {
  color: var(--primary);
  position: relative;
}

.dueDate::after {
  background-color: var(--primary-50);
  border-radius: inherit;
  bottom: 0px;
  content: "";
  left: -2px;
  position: absolute;
  right: -2px;
  top: 0px;
}

.dueDate.today {
  color: var(--red);
}

.dueDate.today::after {
  background-color: var(--red-50);
}

.tag {
  color: var(--c-fg-variant);
  position: relative;
}

.tag::after {
  background-color: hsl(var(--theme-tint) 15% 4% / 0.03);
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
  pointer-events: initial;
  text-decoration: underline;
  text-underline-offset: 0.125rem;
}
</style>
