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

const effectiveType = computed(() => props.as ?? props.item.type);
</script>

<template>
  <component :is="tag" :class="[$style.item, $style[effectiveType]]">
    <template v-for="token in item.tokens" :key="token.matchStart">
      <span
        v-if="token.type === 'status'"
        :class="[$style.token, $style.status, $style[status]]"
        >{{ token.match }}</span
      >

      <span
        v-else-if="token.type === 'dueDate'"
        :class="[$style.token, $style.dueDate]"
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
.task:has(.status.completed) {
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

.status {
}
.status.incomplete {
}
.status.completed {
}
.status.inProgress {
  color: orchid;
}
.status.important {
  color: orangered;
}
.status.question {
  color: gold;
}

.dueDate {
  color: deepskyblue;
}

.link {
  color: var(--primary);
  pointer-events: initial;
  text-decoration: underline;
  text-underline-offset: 0.125rem;
}
</style>
