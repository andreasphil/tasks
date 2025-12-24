<script setup lang="ts">
import { onMounted, useTemplateRef, watch } from "vue";

const props = defineProps<{
  title?: string;
}>();

const visible = defineModel<boolean>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const dialogEl = useTemplateRef<HTMLDialogElement | null>("dialogEl");

watch(visible, (is, was) => {
  if (is === was) return;
  else if (is) dialogEl.value?.showModal();
  else dialogEl.value?.close();
});

onMounted(() => {
  if (visible.value) dialogEl.value?.showModal();
});

function hide() {
  visible.value = false;
}
</script>

<template>
  <dialog @close="hide()" @keydown.esc.stop.prevent="hide()" ref="dialogEl">
    <header v-if="title">
      <strong>{{ title }}</strong>
    </header>

    <div class="trim">
      <slot />
    </div>

    <footer>
      <slot name="footer">
        <button @click="hide()">Close</button>
      </slot>
    </footer>
  </dialog>
</template>
