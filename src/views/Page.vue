<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { usePage } from "../stores/page";
import TPageEditor from "../components/TPageEditor.vue";

const route = useRoute();
const pageId = computed(() => route.params.id?.toString());

const { text, exists } = usePage(pageId);
</script>

<template>
  <p v-if="!exists">Page {{ pageId }} doesn't exist!</p>

  <template v-else>
    <TPageEditor v-model="text" />
  </template>
</template>
