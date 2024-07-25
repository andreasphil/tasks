<script setup lang="ts">
import { default as PageItem } from "@/components/Item.vue";
import { type Item } from "@/lib/parser";
import { StatusPageItem } from "@/stores/statusPage";
import { computed } from "vue";
import { RouterLink } from "vue-router";

const props = defineProps<{
  item: StatusPageItem;
}>();

defineEmits<{
  isDragging: [value: boolean];
}>();

const cardRepresentation = computed<Item>(() => {
  const tokens = props.item.tokens.filter((token) => token.type !== "status");
  return { ...props.item, tokens };
});
</script>

<template>
  <li
    :class="$style.card"
    @dragend="$emit('isDragging', false)"
    @dragstart="$emit('isDragging', true)"
    draggable="true"
  >
    <PageItem :item="cardRepresentation" />

    <RouterLink
      v-if="item.pageName"
      :class="$style.pageName"
      :to="{ name: 'Page', params: { id: item.pageId } }"
    >
      {{ item.pageName }}
    </RouterLink>
  </li>
</template>

<style module>
.card {
  background: var(--c-surface-bg);
  border-radius: var(--border-radius);
  border: var(--border-width-large) solid transparent;
  box-shadow: var(--shadow-elevation-medium);
  list-style-type: none;
  margin: 0;
  padding: 0.75rem 1rem;
  transition-property: background-color, border-color;
  transition: var(--transition);

  &:hover {
    border-color: var(--primary);
    cursor: grab;
  }
}

.pageName {
  all: unset;
  color: var(--c-fg-variant);
  cursor: pointer;
  display: inline-block;
  font-size: var(--font-size-small);
  margin-top: 0.5rem;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}
</style>
