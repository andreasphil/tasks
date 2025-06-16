import { TreePalm } from "lucide-static";
import { computed, defineComponent } from "vue";
import Item from "../components/item.ts";
import { html } from "../lib/html.ts";
import { parse } from "../stores/appParser.ts";
import { useTodayPage } from "../stores/todayPage.ts";

export default defineComponent({
  name: "Today",

  components: { Item },

  setup() {
    const { text, updateOnPage } = useTodayPage();

    function toggleCompleted(index: number) {
      updateOnPage(index, (item) => {
        if (item.type !== "task") item.type = "task";
        item.status = item.status === "completed" ? "incomplete" : "completed";
      });
    }

    const items = computed(() =>
      text.value?.split("\n").map((line) => parse.withMemo(line))
    );

    return {
      TreePalm,
      items,
      text,
      toggleCompleted,
    };
  },

  template: html`
    <article data-with-fallback>
      <div>
        <textarea-2 v-if="text" overscroll class="editor">
          <textarea spellcheck="false" v-model="text" readonly></textarea>
          <div class="t2-output" custom>
            <Item
              v-for="(item, index) in items"
              :as="index === 0 ? 'heading' : undefined"
              :item="item"
              @update:status="toggleCompleted(index)"
            />
          </div>
        </textarea-2>
      </div>

      <div data-when="empty">
        <span v-html="TreePalm" />
        <p>Well done! You finished all of today's tasks.</p>
      </div>
    </article>
  `,
});
