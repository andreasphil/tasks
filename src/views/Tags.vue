<script lang="ts" setup>
import Item from "@/components/Item.vue";
import { parseWithMemo as rowToTask, type TaskStatus } from "@/lib/parser";
import { useTagsPage } from "@/stores/tagsPage";
import Textarea2 from "@andreasphil/vue-textarea2";
import { BookmarkX } from "lucide-vue-next";

/* -------------------------------------------------- *
 * Current page                                       *
 * -------------------------------------------------- */

const { text, updateOnPage } = useTagsPage();

/* -------------------------------------------------- *
 * Interacting with items                             *
 * -------------------------------------------------- */

function updateStatus(status: TaskStatus, index: number) {
  updateOnPage(index, (item) => {
    if (item.type !== "task") item.type = "task";
    item.status = status;
  });
}
</script>

<template>
  <article data-with-fallback>
    <div>
      <Textarea2
        v-if="text"
        :context-provider="rowToTask"
        :model-value="text"
        :spellcheck="false"
        class="editor text-mono"
        readonly
        ref="textareaEl"
      >
        <template #row="{ context, index }">
          <Item
            :as="index === 0 ? 'heading' : undefined"
            :item="context"
            @update:status="updateStatus($event, index)"
          />
        </template>
      </Textarea2>
    </div>

    <div data-when="empty">
      <BookmarkX />
      <p>Looks like you haven't tagged any items.</p>
    </div>
  </article>
</template>
