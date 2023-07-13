<script setup lang="ts">
import TPageEditor from "@/components/TPageEditor.vue";
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";

/* -------------------------------------------------- *
 * Current page                                       *
 * -------------------------------------------------- */

const route = useRoute();

const pageId = computed(() => route.params.id?.toString());

const editorEl = ref<InstanceType<typeof TPageEditor> | null>(null);

watch(pageId, () => {
  editorEl.value?.focus();
});
</script>

<template>
  <TPageEditor :page-id="pageId" ref="editorEl" />
</template>
