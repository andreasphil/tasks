import { html } from "@/lib/html";
import { defineComponent } from "vue";
import "./layout.css";

export default defineComponent({
  name: "Layout",

  template: html`
    <div class="layout">
      <aside v-if="$slots.sidebar" class="sidebar">
        <slot name="sidebar" />
      </aside>

      <div class="content">
        <main>
          <slot />
        </main>
      </div>
    </div>
  `,
});
