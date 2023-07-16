<script setup lang="ts"></script>

<template>
  <div :class="[$style.layout, { [$style.layoutWithHeader]: $slots.header }]">
    <header>
      <nav data-variant="fixed" :class="$style.headerNav">
        <strong>Textflow</strong>
        <section>
          <slot name="header" />
        </section>
      </nav>
    </header>

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

.layoutWithHeader {
  height: calc(100dvh - var(--nav-height));
}

.headerNav {
  padding: 0.25rem 2rem;
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
  overflow: auto;
}
</style>
