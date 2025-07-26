import { defineComponent } from "vue";
import { html } from "../lib/html.ts";

export default defineComponent({
  name: "Layout",

  template: html`
    <div class="layout">
      <div v-if="$slots.sidebar" class="sidebar">
        <aside>
          <slot name="sidebar" />
        </aside>
      </div>

      <div class="content">
        <main>
          <slot />
        </main>
      </div>
    </div>
  `,
});
