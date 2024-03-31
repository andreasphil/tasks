<script lang="ts" setup>
import VPageItem from "@/components/VPageItem.vue";
import { parseWithMemo as rowToTask } from "@/lib/parser";
import { useTagsPage } from "@/stores/tagsPage";
import VueTextarea2 from "@andreasphil/vue-textarea2";
import { BookmarkX } from "lucide-vue-next";

/* -------------------------------------------------- *
 * Current page                                       *
 * -------------------------------------------------- */

const { text } = useTagsPage();
</script>

<template>
  <div data-with-fallback>
    <div>
      <VueTextarea2
        v-if="text"
        :context-provider="rowToTask"
        :model-value="text"
        :spellcheck="false"
        class="text-mono"
        readonly
        ref="textareaEl"
      >
        <template #row="{ context, index }">
          <VPageItem
            :as="index === 0 ? 'heading' : undefined"
            :item="context"
          />
        </template>
      </VueTextarea2>
    </div>

    <div data-when="empty">
      <BookmarkX />
      <p>Looks like you haven't tagged any items.</p>
    </div>
  </div>
</template>
