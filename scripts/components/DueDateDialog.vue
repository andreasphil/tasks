<script setup lang="ts">
import { computed, watch } from "vue";
import { getDateHint } from "../lib/date.ts";
import { CalendarCheck2, CalendarX2 } from "../lib/icons.ts";
import BaseDialog from "./BaseDialog.vue";

const props = defineProps<{
  selectedDate?: string;
}>();

const visible = defineModel<boolean>();

const emit = defineEmits<{
  confirmed: [];
  cancelled: [];
  "update:modelValue": [value: boolean];
  "update:selectedDate": [value: string | undefined];
}>();

// Model value handling -----------------------------------

const selectedDate = computed({
  get() {
    return props.selectedDate;
  },
  set(val) {
    emit("update:selectedDate", val);
  },
});

watch(visible, (is, was) => {
  if (is && !was) selectedDate.value = undefined;
});

const dueDateHint = computed(() => {
  if (!selectedDate.value) {
    return "No date selected";
  }

  return getDateHint(selectedDate.value);
});

// Visibility ---------------------------------------------

function onClear() {
  selectedDate.value = undefined;
  visible.value = false;
  emit("confirmed");
}

function onConfirm() {
  visible.value = false;
  emit("confirmed");
}

function onCancel() {
  visible.value = false;
  emit("cancelled");
}
</script>

<template>
  <BaseDialog v-model="visible" title="Set due date">
    <label>
      Finish this task by...
      <input
        type="date"
        v-model="selectedDate"
        @keydown.enter.stop.prevent="onConfirm()"
      />
      <small>{{ dueDateHint }}</small>
    </label>

    <template #footer>
      <button @click="onClear()" variant="muted">
        <span v-html="CalendarX2" />Clear
      </button>
      <div></div>
      <button variant="secondary" @click="onCancel()">Cancel</button>
      <button @click="onConfirm()"><span v-html="CalendarCheck2" />Done</button>
    </template>
  </BaseDialog>
</template>
