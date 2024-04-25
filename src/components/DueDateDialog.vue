<script setup lang="ts">
import Dialog from "@/components/Dialog.vue";
import { CalendarCheck, CalendarX2 } from "lucide-vue-next";
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
    </label>

    <template #footer>
      <button class="mr-auto" @click="onClear()" data-variant="muted">
        <CalendarX2 />Clear
      </button>

      <button data-variant="ghost" @click="onCancel()">Cancel</button>
      <button @click="onConfirm()"><CalendarCheck />Done</button>
    </template>
  </Dialog>
</template>
