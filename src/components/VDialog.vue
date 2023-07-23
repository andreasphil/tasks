<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";

const props = defineProps<{
  modelValue?: boolean;
  title?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const dialogEl = ref<HTMLDialogElement | null>(null);

watch(
  () => props.modelValue,
  (is, was) => {
    if (is === was) return;
    else if (is) dialogEl.value?.showModal();
    else dialogEl.value?.close();
  }
);

onMounted(() => {
  if (props.modelValue) dialogEl.value?.showModal();
});

const localOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});
</script>

<template>
  <dialog
    :class="$style.dialog"
    @close="localOpen = false"
    @keydown.esc.stop.prevent="localOpen = false"
    ref="dialogEl"
  >
    <header v-if="title" :class="$style.header">
      <strong>{{ title }}</strong>
    </header>

    <div :class="$style.body" data-trim="both">
      <slot />
    </div>

    <footer :class="$style.footer">
      <slot name="footer">
        <button @click="localOpen = false">Confirm</button>
      </slot>
    </footer>
  </dialog>
</template>

<style module>
.dialog {
  max-width: min(90dvw, 30rem);
  width: 100%;
}

.header {
  font-size: var(--font-size-h5);
  margin-bottom: 1rem;
  text-transform: capitalize;
}

.footer {
  border-top: var(--border-width) solid var(--c-border-variant);
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 1rem;
  padding-top: 1rem;
}
</style>
