<script setup lang="ts">
import { computed } from "vue";
import { getDateHint } from "../lib/date.ts";
import type { Item } from "../lib/parser.ts";

const props = defineProps<{
  item: Item;
  as?: Item["type"];
}>();

const emit = defineEmits<{
  "update:status": [];
}>();

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
  emit("update:status");
}

// Due date -----------------------------------------------

const todayOrOverdue = computed(() => {
  const today = Temporal.Now.plainDateISO();
  return (
    props.item.dueDate &&
    Temporal.PlainDate.compare(props.item.dueDate, today) <= 0
  );
});

const dueDateHint = computed(() => {
  if (!props.item.dueDate) return undefined;
  return getDateHint(props.item.dueDate);
});
</script>

<template>
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
</template>
