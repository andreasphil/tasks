<script setup>
import { computed, nextTick, ref, watch, watchEffect } from "vue";

const props = defineProps({
  modelValue: { type: String, required: true },
  dock: { type: Boolean, default: false },
  scrollBeyondLastLine: { type: [Boolean, Number], default: true },
});

const emit = defineEmits(["update:modelValue"]);

const localModelValue = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const overscroll = computed(() => {
  if (props.scrollBeyondLastLine === true) return "18rem";
  else if (typeof props.scrollBeyondLastLine === "number") {
    return `${props.scrollBeyondLastLine}rem`;
  } else return undefined;
});

/* -------------------------------------------------- *
 * DOM interaction                                    *
 * -------------------------------------------------- */

/** @type {import("vue").Ref<null | HTMLTextAreaElement} */
const textareaEl = ref(null);

const editorHeight = ref(0);

async function determineEditorHeight() {
  editorHeight.value = 0;
  await nextTick().then(() => {
    editorHeight.value = textareaEl.value?.scrollHeight;
  });
}

watchEffect(() => {
  if (textareaEl.value) determineEditorHeight();
});

watch(localModelValue, () => {
  if (textareaEl.value) determineEditorHeight();
});

function focus() {
  textareaEl.value?.focus();
}

/* -------------------------------------------------- *
 * Public interface                                   *
 * -------------------------------------------------- */

defineExpose({ focus });
</script>

<template>
  <div :class="[$style.wrapper, { [$style.dock]: dock }]" @click="focus()">
    <textarea
      :class="[$style.textarea]"
      ref="textareaEl"
      v-model="localModelValue"
    />
    <div :class="$style.output">{{ localModelValue }}</div>
  </div>
</template>

<style module>
.wrapper {
  cursor: text;
  padding-bottom: v-bind(overscroll);
  position: relative;
}

:where(.textarea) {
  all: unset;
  box-sizing: border-box;
}

.textarea,
.output {
  font: inherit;
  height: max(calc(1px * v-bind(editorHeight)), 2em);
  white-space: pre-wrap;
}

.textarea {
  caret-color: inherit;
  color: transparent;
  display: block;
  left: 0;
  position: absolute;
  resize: none;
  right: 0;
}

.output {
  pointer-events: none;
  position: relative;
}

.dock {
  height: 100%;
  width: 100%;
}
</style>
