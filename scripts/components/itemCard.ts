import { computed, defineComponent, PropType } from "vue";
import { type RouterLinkProps, RouterLink } from "vue-router";
import { default as PageItem } from "../components/item.ts";
import { html } from "../lib/html.ts";
import type { Item } from "../lib/parser.ts";
import { StatusPageItem } from "../stores/statusPage.ts";

export default defineComponent({
  name: "ItemCard",

  components: { PageItem, RouterLink },

  props: {
    item: { type: Object as PropType<StatusPageItem>, required: true },
  },

  emits: ["isDragging"],

  setup(props) {
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

    return {
      cardRepresentation,
      source,
    };
  },

  template: html`
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
  `,
});
