import { computed, defineComponent } from "vue";
import Item from "../components/item.ts";
import { html } from "../lib/html.ts";
import { TreePalm } from "../lib/icons.ts";
import type { TaskStatus } from "../lib/parser.ts";
import { parse } from "../stores/appParser.ts";
import { useTodayPage } from "../stores/todayPage.ts";

export default defineComponent({
  name: "Today",

  components: { Item },

  setup() {
    const { text, updateOnPage } = useTodayPage();

    function setStatus(index: number, status: TaskStatus) {
      updateOnPage(index, (item) => {
        if (item.type !== "task") item.type = "task";
        item.status = status;
      });
    }

    const items = computed(() => text.value?.split("\n").map((line) => parse.withMemo(line)));

    return {
      TreePalm,
      items,
      text,
      setStatus,
    };
  },

  template: html`
    <article has-fallback>
      <div>
        <textarea-2 v-if="text" overscroll class="editor">
          <textarea spellcheck="false" v-model="text" readonly></textarea>
          <div class="t2-output" custom>
            <Item
              v-for="(item, index) in items"
              :as="index === 0 ? 'heading' : undefined"
              :item="item"
              @update:status="setStatus(index, $event)"
            />
          </div>
        </textarea-2>
      </div>

      <div fallback-for="empty">
        <span v-html="TreePalm" />
        <p>Well done! You finished all of today's tasks.</p>
      </div>
    </article>
  `,
});
