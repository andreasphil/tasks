<script setup lang="ts" generic="RowContext extends Record<string, any>">
import { computed, nextTick, ref, watch, watchEffect } from "vue";

const props = withDefaults(
  defineProps<{
    modelValue: string;
    dock?: boolean;
    scrollBeyondLastLine?: boolean | number;
    lineHeight?: string;
    contextProvider?: (row: string) => RowContext;
  }>(),
  {
    dock: false,
    scrollBeyondLastLine: true,
    lineHeight: "1.5em",
    contextProvider: (_: string) => ({} as RowContext),
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

defineSlots<{
  row(props: { row: string; context: RowContext; index: number }): any;
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
 * Output parsing and rendering                       *
 * -------------------------------------------------- */

function splitLines(text: string): string[] {
  return text.split("\n");
}

const rows = computed(() =>
  splitLines(localModelValue.value).map((r, i) => ({
    row: r,
    key: `${i}#${r}`,
    context: props.contextProvider(r),
  }))
);

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
    <div :class="$style.output">
      <div
        v-for="({ row, key, context }, i) in rows"
        :class="$style.row"
        :key="key"
      >
        <slot :row="row" :context="context" :index="i" name="row">
          {{ row }}
        </slot>
      </div>
    </div>
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

.textarea {
  caret-color: inherit;
  color: transparent;
  display: block;
  font: inherit;
  height: v-bind(editorHeight);
  left: 0;
  line-height: v-bind(lineHeight);
  position: absolute;
  resize: none;
  right: 0;
  white-space: pre-wrap;
  background: inherit;
}

.output {
  font: inherit;
  height: v-bind(editorHeight);
  line-height: v-bind(lineHeight);
  pointer-events: none;
  position: relative;
  white-space: pre-wrap;
  background: inherit;
}

.row {
  min-height: v-bind(lineHeight);
}

.dock {
  height: 100%;
  width: 100%;
}
</style>
