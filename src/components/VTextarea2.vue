<script setup lang="ts" generic="RowContext extends Record<string, any>">
import {
  continueList,
  continueListRules,
  getCursorInLine,
  getRangeFromSelectedLines,
  getSelectedLines,
  indent,
  splitLines,
  joinLines,
  type ContinueListRule,
  type IndentMode,
} from "@/lib/text";
import { computed, nextTick, ref, watch, watchEffect } from "vue";

type ContextProvider = (row: string) => RowContext;

const props = withDefaults(
  defineProps<{
    contextProvider?: ContextProvider;
    continueLists?: false | ContinueListRule[];
    dock?: boolean;
    insertTabs?: boolean;
    modelValue: string;
    scrollBeyondLastLine?: boolean | number;
    tabSize?: number;
  }>(),
  {
    contextProvider: (_: string) => ({} as RowContext),
    continueLists: () => Object.values(continueListRules),
    dock: false,
    insertTabs: true,
    scrollBeyondLastLine: true,
    tabSize: 4,
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "update:currentLineIndex", value: number): void;
  (e: "update:currentSelectionRange", value: [number, number]): void;
}>();

defineSlots<{
  row(props: { row: string; context: RowContext; index: number }): any;
}>();

const textareaEl = ref<null | HTMLTextAreaElement>(null);

/* -------------------------------------------------- *
 * Model value handling                               *
 * -------------------------------------------------- */

// Note that this needs to be somewhat convoluted because we need a local copy
// of the model that is updated immediately without waiting for Vue to go
// through the entire reactivity cycle. This allows us to to string manipulation
// on the value without losing caret position etc. The source of truth is still
// the modelValue prop though, so we need to keep them in sync.

const localModelValue = ref(props.modelValue);

// Import changes to the modelValue = replace local value with the new value
watch(
  () => props.modelValue,
  (next, previous) => {
    if (next !== previous) localModelValue.value = next;
  }
);

// Export changes to the modelValue = set local copy immediately and emit
// event to parent
function setLocalModelValue(value: string): void {
  localModelValue.value = value;
  emit("update:modelValue", value);
}

function onInput(event: Event): void {
  if (!(event.target instanceof HTMLTextAreaElement)) return;
  setLocalModelValue(event.target.value);
}

const rows = computed(() => splitLines(localModelValue.value));

const rowsWithContext = computed(() =>
  rows.value.map((r, i) => ({
    row: r,
    key: `${i}#${r}`,
    context: props.contextProvider(r),
  }))
);

/* -------------------------------------------------- *
 * Autosizing                                         *
 * -------------------------------------------------- */

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

const overscroll = computed<string | undefined>(() => {
  if (props.scrollBeyondLastLine === true) return "18rem";
  else if (typeof props.scrollBeyondLastLine === "number") {
    return `${props.scrollBeyondLastLine}rem`;
  } else return undefined;
});

/* -------------------------------------------------- *
 * Tab handling                                       *
 * -------------------------------------------------- */

async function onInsertTab(event: KeyboardEvent): Promise<void> {
  if (!textareaEl.value) return;

  event.preventDefault();

  const newRows = [...rows.value];
  const { selectionStart, selectionEnd } = textareaEl.value;
  const [from, to] = getSelectedLines(newRows, selectionStart, selectionEnd);
  const mode: IndentMode = event.shiftKey ? "outdent" : "indent";

  const indented = indent(newRows.slice(from, to + 1), mode);
  newRows.splice(from, to - from + 1, ...indented);
  setLocalModelValue(joinLines(newRows));

  await nextTick();

  if (from === to && mode === "indent") {
    const start = selectionStart + 1;
    textareaEl.value?.setSelectionRange(start, start);
  } else if (from === to && mode === "outdent") {
    const [minStart] = getRangeFromSelectedLines(newRows, from, to);
    const start = Math.max(minStart, selectionStart - 1);
    textareaEl.value?.setSelectionRange(start, start);
  } else {
    const [start, end] = getRangeFromSelectedLines(newRows, from, to);
    textareaEl.value?.setSelectionRange(start, end);
  }
}

/* -------------------------------------------------- *
 * List continuation                                  *
 * -------------------------------------------------- */

async function onContinueList(event: KeyboardEvent): Promise<void> {
  if (!textareaEl.value) return;

  event.preventDefault();

  const newRows = [...rows.value];
  const { selectionStart } = textareaEl.value;
  const [lineNr] = getSelectedLines(newRows, selectionStart);
  const rules = Array.isArray(props.continueLists) ? props.continueLists : [];
  const cursorInLine = getCursorInLine(props.modelValue, selectionStart);

  const continued = continueList(newRows[lineNr], rules, cursorInLine);
  newRows.splice(lineNr, 1, continued.current, continued.next);
  setLocalModelValue(joinLines(newRows));

  await nextTick();

  let start = selectionStart + 1;
  if ("didContinue" in continued && continued.didContinue) {
    start += continued.match.length;
  } else if ("didEnd" in continued && continued.didEnd) {
    start = selectionStart - continued.match.length + 1;
  }
  textareaEl.value?.setSelectionRange(start, start);
}

/* -------------------------------------------------- *
 * DOM interactions                                   *
 * -------------------------------------------------- */

function emitCurrentPosition(): void {
  if (!textareaEl.value) return;

  const { selectionStart, selectionEnd } = textareaEl.value;
  emit("update:currentSelectionRange", [selectionStart, selectionEnd]);

  const [lineNr] = getSelectedLines(rows.value, selectionStart);
  emit("update:currentLineIndex", lineNr);
}

async function focus(from?: number, to?: number): Promise<void> {
  textareaEl.value?.focus();

  if (typeof from === "number") {
    await nextTick();
    textareaEl.value?.setSelectionRange(from, to ?? from);
    emitCurrentPosition();
  } else {
    emitCurrentPosition();
  }
}

/* -------------------------------------------------- *
 * Public interface                                   *
 * -------------------------------------------------- */

defineExpose({ focus });
</script>

<template>
  <div :class="[$style.wrapper, { [$style.dock]: dock }]" @click="focus()">
    <textarea
      :class="$style.textarea"
      :value="localModelValue"
      @input="onInput($event)"
      @keydown.enter="continueLists ? onContinueList($event) : undefined"
      @keydown.tab="insertTabs ? onInsertTab($event) : undefined"
      @keyup="emitCurrentPosition()"
      @mouseup="emitCurrentPosition()"
      ref="textareaEl"
    />
    <div :class="$style.output">
      <div
        v-for="({ row, key, context }, i) in rowsWithContext"
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
  tab-size: v-bind(tabSize);
}

:where(.textarea) {
  all: unset;
  box-sizing: border-box;
}

.textarea,
.output {
  background: inherit;
  font: inherit;
  white-space: pre-wrap;
}

.textarea {
  caret-color: inherit;
  color: transparent;
  display: block;
  height: v-bind(editorHeight);
  left: 0;
  position: absolute;
  resize: none;
  right: 0;
}

.output {
  height: v-bind(editorHeight);
  pointer-events: none;
  position: relative;
}

.output::selection {
  background: transparent;
}

.row {
  min-height: 1lh;
}

.dock {
  height: 100%;
  width: 100%;
}
</style>
