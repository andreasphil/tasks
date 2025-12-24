<script setup lang="ts">
import { Sticker } from "../lib/icons.ts";
</script>

<template>
  <article has-fallback="empty">
    <div />
    <div fallback-for="empty">
      <span v-html="Sticker" />
      <p>Welcome!</p>
    </div>
  </article>
</template>
