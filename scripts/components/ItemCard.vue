<script setup lang="ts">
import { computed } from "vue";
import { type RouterLinkProps, RouterLink } from "vue-router";
import PageItem from "../components/Item.vue";
import type { Item } from "../lib/parser.ts";
import { StatusPageItem } from "../stores/statusPage.ts";

const props = defineProps<{
  item: StatusPageItem;
}>();

defineEmits<{
  isDragging: [value: boolean];
}>();

const cardRepresentation = computed<Item>(() => {
  const item = props.item;
  const tokens = item.tokens.filter((token) => token.type !== "status");
  return { ...item, tokens };
});

const source = computed<RouterLinkProps["to"]>(() => ({
  name: "Page",
  params: { id: props.item.pageId },
  query: { line: props.item.lineNr },
}));
</script>

<template>
  <li
    class="itemCard"
    @dragend="$emit('isDragging', false)"
    @dragstart="$emit('isDragging', true)"
    draggable="true"
  >
    <PageItem :item="cardRepresentation" />

    <RouterLink v-if="item.pageName" class="pageName" :to="source">
      {{ item.pageName }}
    </RouterLink>
  </li>
</template>
