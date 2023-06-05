<script setup></script>

<template>
  <div :class="$style.layout">
    <header>
      <nav>
        <slot name="header" />
      </nav>
    </header>

    <aside :class="$style.sidebar">
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
  flex: 0 0 auto;
  width: 18rem;
  padding: 2rem;
  border-right: var(--border-width) solid var(--c-border-variant);
  overflow: auto;
}

.content {
  flex: 1 1 auto;
  padding: 2rem;
  background: var(--c-surface-bg);
  overflow: auto;
}
</style>
