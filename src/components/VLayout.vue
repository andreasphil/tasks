<template>
  <div :class="$style.layout">
    <aside v-if="$slots.sidebar" :class="$style.sidebar">
      <slot name="sidebar" />
    </aside>

    <div :class="$style.content">
      <main :class="$style.main">
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
  padding: 4rem 1rem 4rem 3rem;
  width: 18rem;
}

.content {
  background: var(--c-surface-bg);
  border-top-left-radius: var(--border-radius-large);
  border-top-right-radius: var(--border-radius-large);
  box-shadow: var(--shadow-elevation-high);
  flex: 1 1 auto;
  margin: 2rem 2rem 0;
  overflow: auto;
  padding: 2rem;
}

.main {
  margin: auto;
  max-width: 50rem;
  min-height: 100%;
}
</style>
