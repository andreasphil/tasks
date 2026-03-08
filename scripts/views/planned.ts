import { computed, defineComponent } from "vue";
import Item from "../components/item.ts";
import { html } from "../lib/html.ts";
import { Calendar } from "../lib/icons.ts";
import { parse } from "../stores/appParser.ts";
import { usePlannedPage } from "../stores/plannedPage.ts";

export default defineComponent({
  name: "Planned",

  components: { Item },

  setup() {
    const { text, updateOnPage } = usePlannedPage();

    function toggleCompleted(index: number) {
      updateOnPage(index, (item) => {
        if (item.type !== "task") item.type = "task";
        item.status = item.status === "completed" ? "incomplete" : "completed";
      });
    }

    const items = computed(() =>
      text.value?.split("\n").map((line) => parse.withMemo(line)),
    );

    return {
      Calendar,
      items,
      text,
      toggleCompleted,
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
              @update:status="toggleCompleted(index)"
            />
          </div>
        </textarea-2>
      </div>

      <div fallback-for="empty">
        <span v-html="Calendar" />
        <p>No upcoming tasks. Add a due date to a task to see it here.</p>
      </div>
    </article>
  `,
});
