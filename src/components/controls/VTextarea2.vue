<script setup lang="ts">
import { computed, nextTick, ref, watch, watchEffect } from "vue";

const props = withDefaults(
  defineProps<{
    modelValue: string;
    dock?: boolean;
    scrollBeyondLastLine?: boolean | number;
  }>(),
  {
    dock: false,
    scrollBeyondLastLine: true,
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const localModelValue = computed<string>({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const overscroll = computed<string | undefined>(() => {
  if (props.scrollBeyondLastLine === true) return "18rem";
  else if (typeof props.scrollBeyondLastLine === "number") {
    return `${props.scrollBeyondLastLine}rem`;
  } else return undefined;
});

/* -------------------------------------------------- *
 * DOM interaction                                    *
 * -------------------------------------------------- */

const textareaEl = ref<null | HTMLTextAreaElement>(null);

const editorHeight = ref<string>("auto");

async function determineEditorHeight() {
  editorHeight.value = "auto";
  await nextTick();

  editorHeight.value = textareaEl.value?.scrollHeight
    ? `${textareaEl.value?.scrollHeight}px`
    : "auto";
}

watchEffect(() => {
  if (textareaEl.value) determineEditorHeight();
});

watch(localModelValue, () => {
  if (textareaEl.value) determineEditorHeight();
});

function focus(): void {
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
  height: v-bind(editorHeight);
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
