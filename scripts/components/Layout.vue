<script setup lang="ts">
import { useSlots } from "vue";

const slots = useSlots();
</script>

<template>
  <div class="layout">
    <div v-if="slots.sidebar" class="sidebar">
      <aside>
        <slot name="sidebar" />
      </aside>
    </div>

    <div class="content">
      <main>
        <slot />
      </main>
    </div>
  </div>
</template>
