import { CalendarCheck, CalendarX2 } from "lucide-static";
import { computed, defineComponent, watch } from "vue";
import BaseDialog from "./dialog.ts";
import { getDateHint } from "../lib/date.ts";
import { html } from "../lib/html.ts";

export default defineComponent({
  name: "DueDateDialog",

  components: { BaseDialog },

  props: {
    modelValue: { type: Boolean, default: false },
    selectedDate: { type: String, default: undefined },
  },

  emits: ["confirmed", "cancelled", "update:modelValue", "update:selectedDate"],

  setup(props, { emit }) {
    // Model value handling -----------------------------------

    const visible = computed({
      get() {
        return props.modelValue;
      },
      set(val) {
        emit("update:modelValue", val);
      },
    });

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

    return {
      CalendarCheck,
      CalendarX2,
      dueDateHint,
      onCancel,
      onClear,
      onConfirm,
      selectedDate,
      visible,
    };
  },

  template: html`
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
        <button variant="ghost" @click="onCancel()">Cancel</button>
        <button @click="onConfirm()">
          <span v-html="CalendarCheck" />Done
        </button>
      </template>
    </BaseDialog>
  `,
});
