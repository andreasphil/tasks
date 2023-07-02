<script setup lang="ts">
import TPageEditor from "@/components/TPageEditor.vue";
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const pageId = computed(() => route.params.id?.toString());
</script>

<template>
  <TPageEditor :page-id="pageId" />
</template>
