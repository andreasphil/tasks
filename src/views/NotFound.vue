<script setup lang="ts">
import Layout from "@/components/Layout.vue";
import { Ghost } from "lucide-vue-next";
</script>

<template>
  <Layout>
    <div data-with-fallback="emtpy" :class="$style.notFound">
      <div />
      <div data-when="empty">
        <Ghost />
        <p>This URL doesn't exist.</p>
        <RouterLink :to="{ name: 'Home' }">Take me back</RouterLink>
      </div>
    </div>
  </Layout>
</template>

<style module>
.notFound {
  margin: 2rem 0;
}
</style>
