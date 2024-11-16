<script setup lang="ts">
import Dialog from "@/components/Dialog.vue";
import { getDateHint } from "@/lib/date";
import { CalendarCheck, CalendarX2 } from "lucide-static";
import { computed, watch } from "vue";

const props = defineProps<{
  modelValue: boolean;
  selectedDate: string | undefined;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  "update:selectedDate": [value: string | undefined];
  confirmed: [];
  cancelled: [];
}>();

/* -------------------------------------------------- *
 * Model value handling                               *
 * -------------------------------------------------- */

const localSelectedDate = computed<string | undefined>({
  get: () => props.selectedDate,
  set: (val) => emit("update:selectedDate", val),
});

watch(
  () => props.modelValue,
  (is, was) => {
    if (is && !was) localSelectedDate.value = undefined;
  }
);

const dueDateHint = computed(() => {
  if (!props.selectedDate) {
    return "No date selected";
  }

  return getDateHint(props.selectedDate);
});

/* -------------------------------------------------- *
 * Visibility                                         *
 * -------------------------------------------------- */

function onClear() {
  localSelectedDate.value = undefined;
  emit("update:modelValue", false);
  emit("confirmed");
}

function onConfirm() {
  emit("update:modelValue", false);
  emit("confirmed");
}

function onCancel() {
  emit("update:modelValue", false);
  emit("cancelled");
}
</script>

<template>
  <Dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="Set due date"
  >
    <label>
      Finish this task by...
      <input
        type="date"
        v-model="localSelectedDate"
        @keydown.enter.stop.prevent="onConfirm()"
      />
      <small>{{ dueDateHint }}</small>
    </label>

    <template #footer>
      <button @click="onClear()" data-variant="muted">
        <span v-html="CalendarX2" />Clear
      </button>
      <div></div>
      <button data-variant="ghost" @click="onCancel()">Cancel</button>
      <button @click="onConfirm()"><span v-html="CalendarCheck" />Done</button>
    </template>
  </Dialog>
</template>
