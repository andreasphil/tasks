<template>
  <div :class="$style.layout">
    <aside v-if="$slots.sidebar" :class="$style.sidebar">
      <slot name="sidebar" />
    </aside>

    <div :class="$style.content">
      <main>
        <slot />
      </main>
    </div>
  </div>
</template>

<style module>
.layout {
  display: flex;
  height: 100dvh;
  overflow: hidden;
}

.sidebar {
  flex: 0 0 auto;
  overflow: auto;
  padding: 4rem 1rem 4rem 2rem;
  width: 16rem;
}

.content {
  flex: 1 1 auto;
  padding: 0 2rem 0 1rem;
  overflow: auto;
}
</style>

<style scoped>
:deep(article) {
  min-height: calc(100dvh - calc(2 * var(--block-spacing-y)));
}
</style>
