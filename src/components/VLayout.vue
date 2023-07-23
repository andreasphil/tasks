<script setup lang="ts"></script>

<template>
  <div :class="[$style.layout, { [$style.layoutWithHeader]: $slots.header }]">
    <aside v-if="$slots.sidebar" :class="$style.sidebar">
      <slot name="sidebar" />
    </aside>

    <main :class="$style.content">
      <slot />
    </main>
  </div>
</template>

<style module>
.layout {
  display: flex;
  height: 100dvh;
  overflow: hidden;
}

.sidebar {
  background-color: var(--c-surface-bg);
  border-right: var(--border-width) solid var(--c-border-variant);
  flex: 0 0 auto;
  overflow: auto;
  padding: 2rem;
  width: 18rem;
}

.content {
  flex: 1 1 auto;
  padding: 2rem;
  overflow: auto;
}
</style>
