<script setup lang="ts">
import { computed, h, type Component } from "vue";

const props = withDefaults(
  defineProps<{
    icon?: Component | string;
    text?: string;
  }>(),
  {
    icon: "😵‍💫",
    text: "Sorry, couldn't find anything.",
  }
);

const iconComponent = computed(() =>
  typeof props.icon === "string" ? h("span", props.icon) : props.icon
);
</script>

<template>
  <div :class="$style.empty">
    <h3 :class="$style.heading">
      <component :is="iconComponent" />
    </h3>
    <p>{{ text }}</p>
  </div>
</template>

<style module>
.empty {
  align-items: center;
  border-radius: var(--border-radius);
  border: var(--border-width) dashed var(--c-border);
  color: var(--c-fg-variant);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  justify-content: center;
  padding: 2rem 1rem;
}

.empty * {
  margin: 0;
  padding: 0;
}

.heading {
  font-size: var(--font-size-h5);
}
</style>
