<template>
  <div :class="[$style.layout, { [$style.layoutWithHeader]: $slots.header }]">
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
  background-color: var(--c-surface-bg);
  flex: 0 0 auto;
  overflow: auto;
  padding: 1rem 1.5rem;
  width: 18rem;
  margin: 1rem;
  border-radius: var(--border-radius-large);
  box-shadow: var(--shadow-elevation-medium);
}

.content {
  flex: 1 1 auto;
  padding: 2rem;
  overflow: auto;
}

.main {
  margin: auto;
  max-width: 50rem;
  min-height: 100%;
}
</style>
