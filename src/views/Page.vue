<script setup lang="ts">
import VPage from "@/components/VPage.vue";
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";

/* -------------------------------------------------- *
 * Current page                                       *
 * -------------------------------------------------- */

const route = useRoute();

const pageId = computed(() => route.params.id?.toString());

const editorEl = ref<InstanceType<typeof VPage> | null>(null);

watch(pageId, () => {
  editorEl.value?.focus();
});
</script>

<template>
  <VPage :page-id="pageId" ref="editorEl" />
</template>
