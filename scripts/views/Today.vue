<script setup lang="ts">
import { computed } from "vue";
import Item from "../components/Item.vue";
import { TreePalm } from "../lib/icons.ts";
import { parse } from "../stores/appParser.ts";
import { useTodayPage } from "../stores/todayPage.ts";

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
</script>

<template>
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
      <span v-html="TreePalm" />
      <p>Well done! You finished all of today's tasks.</p>
    </div>
  </article>
</template>
