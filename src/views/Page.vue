<script setup lang="ts">
import TPageEditor from "@/components/TPageEditor.vue";
import { usePage } from "@/stores/page";
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const pageId = computed(() => route.params.id?.toString());

const { text, exists } = usePage(pageId);
</script>

<template>
  <p v-if="!exists">Page {{ pageId }} doesn't exist!</p>

  <template v-else-if="text !== undefined">
    <TPageEditor v-model="text" />
  </template>
</template>
