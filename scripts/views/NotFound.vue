<script setup lang="ts">
import { RouterLink } from "vue-router";
import Layout from "../components/Layout.vue";
import { Ghost } from "../lib/icons.ts";
</script>

<template>
  <Layout>
    <div has-fallback="empty" class="margin-y-outer-spacing">
      <div />
      <div fallback-for="empty">
        <span v-html="Ghost" />
        <p>This URL doesn't exist.</p>
        <RouterLink :to="{ name: 'Home' }">Take me back</RouterLink>
      </div>
    </div>
  </Layout>
</template>
