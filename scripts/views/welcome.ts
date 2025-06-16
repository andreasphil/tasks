import { Sticker } from "lucide-static";
import { defineComponent } from "vue";
import { html } from "../lib/html.ts";

export default defineComponent({
  setup() {
    return {
      Sticker,
    };
  },

  template: html`
    <article data-with-fallback="empty">
      <div />
      <div data-when="empty">
        <span v-html="Sticker" />
        <p>Welcome!</p>
      </div>
    </article>
  `,
});
