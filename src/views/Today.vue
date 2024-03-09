<script lang="ts" setup>
import VPageItem from "@/components/VPageItem.vue";
import VTextarea2 from "@/components/VTextarea2.vue";
import { parseWithMemo as rowToTask } from "@/lib/parser";
import { useTodayPage } from "@/stores/todayPage";

/* -------------------------------------------------- *
 * Current page                                       *
 * -------------------------------------------------- */

const { text } = useTodayPage();
</script>

<template>
  <VTextarea2
    :class="$style.editor"
    :context-provider="rowToTask"
    :model-value="text"
    :spellcheck="false"
    readonly
    ref="textareaEl"
  >
    <template #row="{ context, index }">
      <VPageItem :as="index === 0 ? 'heading' : undefined" :item="context" />
    </template>
  </VTextarea2>
</template>

<style module>
.editor {
  caret-color: var(--c-fg);
  font-family: var(--font-mono);
  margin: auto;
  max-width: 50rem;
  min-height: 100%;
}
</style>
