<script setup lang="ts">
import { onMounted, ref, watch } from "vue";

defineProps<{
  title?: string;
}>();

const visible = defineModel({ default: false });

const dialogEl = ref<HTMLDialogElement | null>(null);

watch(visible, (is, was) => {
  if (is === was) return;
  else if (is) dialogEl.value?.showModal();
  else dialogEl.value?.close();
});

onMounted(() => {
  if (visible.value) dialogEl.value?.showModal();
});
</script>

<template>
  <dialog
    @close="visible = false"
    @keydown.esc.stop.prevent="visible = false"
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
        <button @click="visible = false">Confirm</button>
      </slot>
    </footer>
  </dialog>
</template>
