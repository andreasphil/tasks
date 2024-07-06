<script setup lang="ts">
import { default as PageItem } from "@/components/Item.vue";
import { type Item } from "@/lib/parser";
import { computed } from "vue";

const props = defineProps<{
  item: Item;
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
</style>
