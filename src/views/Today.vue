<script lang="ts" setup>
import VPageItem from "@/components/VPageItem.vue";
import VTextarea2 from "@/components/VTextarea2.vue";
import { parseWithMemo as rowToTask } from "@/lib/parser";
import { useTodayPage } from "@/stores/todayPage";
import { TreePalm } from "lucide-vue-next";

/* -------------------------------------------------- *
 * Current page                                       *
 * -------------------------------------------------- */

const { text } = useTodayPage();
</script>

<template>
  <div data-with-fallback>
    <div>
      <VTextarea2
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
      </VTextarea2>
    </div>

    <div data-when="empty">
      <TreePalm />
      <p>Well done! You finished all of today's tasks.</p>
    </div>
  </div>
</template>
