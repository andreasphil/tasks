<script setup lang="ts">
import { computed } from "vue";
import Item from "../components/Item.vue";
import { BookmarkX } from "../lib/icons.ts";
import { parse } from "../stores/appParser.ts";
import { useTagsPage } from "../stores/tagsPage.ts";

const { text, updateOnPage } = useTagsPage();

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
      <span v-html="BookmarkX" />
      <p>Looks like you haven't tagged any items.</p>
    </div>
  </article>
</template>
