<script setup lang="ts">
import { Sticker } from "lucide-static";
</script>

<template>
  <article data-with-fallback="empty">
    <div />
    <div data-when="empty">
      <span v-html="Sticker" />
      <p>Welcome!</p>
    </div>
  </article>
</template>
