import { defineComponent, onMounted, useTemplateRef, watch } from "vue";
import { html } from "../lib/html.ts";

export default defineComponent({
  name: "BaseDialog",

  props: {
    title: { type: String, default: undefined },
    modelValue: { type: Boolean, default: false },
  },

  emits: ["update:modelValue"],

  setup(props, { emit }) {
    const dialogEl = useTemplateRef<HTMLDialogElement | null>("dialogEl");

    watch(
      () => props.modelValue,
      (is, was) => {
        if (is === was) return;
        else if (is) dialogEl.value?.showModal();
        else dialogEl.value?.close();
      },
    );

    onMounted(() => {
      if (props.modelValue) dialogEl.value?.showModal();
    });

    function hide() {
      emit("update:modelValue", false);
    }

    return { dialogEl, hide };
  },

  template: html`
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
  `,
});
