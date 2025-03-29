<script setup lang="ts">
import Dialog from "@/components/Dialog.vue";
import { getDateHint } from "@/lib/date";
import { CalendarCheck, CalendarX2 } from "lucide-static";
import { computed, watch } from "vue";

const emit = defineEmits<{
  confirmed: [];
  cancelled: [];
}>();

const selectedDate = defineModel<string | undefined>("selectedDate", {
  default: undefined,
});

const visible = defineModel({ default: false });

// Model value handling -----------------------------------

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
  <Dialog v-model="visible" title="Set due date">
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
      <button @click="onClear()" data-variant="muted">
        <span v-html="CalendarX2" />Clear
      </button>
      <div></div>
      <button data-variant="ghost" @click="onCancel()">Cancel</button>
      <button @click="onConfirm()"><span v-html="CalendarCheck" />Done</button>
    </template>
  </Dialog>
</template>
