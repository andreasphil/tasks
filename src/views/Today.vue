<script lang="ts" setup>
import Item from "@/components/Item.vue";
import { parse } from "@/stores/appParser";
import { useTodayPage } from "@/stores/todayPage";
import { TreePalm } from "lucide-static";
import { computed } from "vue";

/* -------------------------------------------------- *
 * Current page                                       *
 * -------------------------------------------------- */

const { text, updateOnPage } = useTodayPage();

/* -------------------------------------------------- *
 * Interacting with items                             *
 * -------------------------------------------------- */

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
  <article data-with-fallback>
    <div>
      <textarea-2 v-if="text" overscroll class="editor text-mono">
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
</template>
