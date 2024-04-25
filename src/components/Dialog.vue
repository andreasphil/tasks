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
    @close="localOpen = false"
    @keydown.esc.stop.prevent="localOpen = false"
    ref="dialogEl"
  >
    <header v-if="title">
      <strong>{{ title }}</strong>
    </header>

    <div data-trim="both">
      <slot />
    </div>

    <footer>
      <slot name="footer">
        <button @click="localOpen = false">Confirm</button>
      </slot>
    </footer>
  </dialog>
</template>
