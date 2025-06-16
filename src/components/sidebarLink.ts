import { defineComponent, PropType } from "vue";
import { RouteLocationRaw, RouterLink } from "vue-router";
import { html } from "../lib/html.ts";

export default defineComponent({
  name: "SidebarLink",

  components: { RouterLink },

  props: {
    to: { type: Object as PropType<RouteLocationRaw>, required: true },
  },

  template: html`
    <RouterLink :to custom v-slot="{ isExactActive, href, navigate }">
      <a :data-active="isExactActive" :href="href" @click="navigate">
        <slot />
      </a>
    </RouterLink>
  `,
});
