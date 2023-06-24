<script setup lang="ts" generic="RowContext extends Record<string, any>">
import { computed, nextTick, ref, watch, watchEffect } from "vue";

const props = withDefaults(
  defineProps<{
    modelValue: string;
    dock?: boolean;
    scrollBeyondLastLine?: boolean | number;
    lineHeight?: string;
    contextProvider?: (row: string) => RowContext;
    insertTabs?: boolean;
    tabSize?: number;
  }>(),
  {
    dock: false,
    scrollBeyondLastLine: true,
    lineHeight: "1.5",
    contextProvider: (_: string) => ({} as RowContext),
    insertTabs: true,
    tabSize: 4,
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

defineSlots<{
  row(props: { row: string; context: RowContext; index: number }): any;
}>();

const textareaEl = ref<null | HTMLTextAreaElement>(null);

/* -------------------------------------------------- *
 * Utilities                                          *
 * -------------------------------------------------- */

function splitLines(text: string): string[] {
  return text.split("\n");
}

/**
 * For a selection beginning at `from` and ending at `to`, returns the line
 * numbers of the first and last selected line.
 *
 * TODO: See what happens with nonsensical start/end values
 *
 * @param from The start of the selection
 * @param to The end of the selection
 * @param value The value containing the selection
 */
function getSelectedLines(
  from: number,
  to: number,
  value: string | string[]
): [number, number] {
  const lines = Array.isArray(value) ? [...value] : splitLines(value);
  let cursor = 0;
  let startLine = -1;
  let endLine = -1;

  for (let i = 0; i < lines.length && (startLine < 0 || endLine < 0); i++) {
    const line = lines[i];
    const lineStart = cursor;
    const lineEnd = lineStart + line.length;

    if (from >= lineStart && from <= lineEnd) startLine = i;
    if (to >= lineStart && to <= lineEnd) endLine = i;

    cursor += line.length + 1;
  }

  return [Math.max(startLine, 0), Math.max(endLine, 0)];
}

/**
 * For a selection beginning at `from` and ending at `to`, extends the selection
 * to include the entire lines of the first and last selected line.
 *
 * TODO: See what happens with nonsensical start/end values
 *
 * @param from The start of the selection
 * @param to The end of the selection
 * @param value The value containing the selection
 */
function getRangeFromSelectedLines(
  from: number,
  to: number,
  value: string | string[]
): [number, number] {
  const lines = Array.isArray(value) ? [...value] : splitLines(value);
  const lengths = lines.map((i) => i.length);

  // Starting at the sum of the lengths of all lines before the first selected
  // line, adjusting for the line breaks which we lost when splitting
  let start = lengths.slice(0, from).reduce((sum, i) => sum + i, 0);
  start += from;

  // Ending at the sum of the lengths of all lines before the last selected
  // line, again adjusting for the line breaks. Since we already calculated this
  // for the start, we can continue from there.
  let end = lengths.slice(from, to + 1).reduce((sum, i) => sum + i, start);
  end += to - from;

  return [start, end];
}

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
 * FIXME: Unfortunately this breaks undo/redo         *
 * -------------------------------------------------- */

async function onInsertTab(event: KeyboardEvent): Promise<void> {
  if (!textareaEl.value) return;

  event.preventDefault();

  const { selectionStart, selectionEnd } = textareaEl.value;
  const [from, to] = getSelectedLines(selectionStart, selectionEnd, rows.value);
  const mode: "indent" | "outdent" = event.shiftKey ? "outdent" : "indent";

  // TODO: Refactor to have this in utilities
  if (mode === "indent") {
    // Insert tab at the beginning of each selected line (unless it's empty)
    for (let i = from; i <= to; i++) rows.value[i] = `\t${rows.value[i]}`;
  } else {
    // Remove tab from the beginning of each selected line
    for (let i = from; i <= to; i++) {
      if (rows.value[i].startsWith("\t")) {
        rows.value[i] = rows.value[i].slice(1);
      }
    }
  }

  setLocalModelValue(rows.value.join("\n"));

  await nextTick();

  if (from === to && mode === "indent") {
    const start = selectionStart + 1;
    textareaEl.value?.setSelectionRange(start, start);
  } else if (from === to && mode === "outdent") {
    const [minStart] = getRangeFromSelectedLines(from, to, rows.value);
    const start = Math.max(minStart, selectionStart - 1);
    textareaEl.value?.setSelectionRange(start, start);
  } else {
    const [start, end] = getRangeFromSelectedLines(from, to, rows.value);
    textareaEl.value?.setSelectionRange(start, end);
  }
}

/* -------------------------------------------------- *
 * Output parsing and rendering                       *
 * -------------------------------------------------- */

const rows = computed(() => splitLines(localModelValue.value));

const rowsWithContext = computed(() =>
  rows.value.map((r, i) => ({
    row: r,
    key: `${i}#${r}`,
    context: props.contextProvider(r),
  }))
);

/* -------------------------------------------------- *
 * DOM interactions                                   *
 * -------------------------------------------------- */

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
      :class="$style.textarea"
      :value="localModelValue"
      @input="onInput($event)"
      @keydown.tab="insertTabs ? onInsertTab($event) : undefined"
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
  line-height: v-bind(lineHeight);
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

.row {
  min-height: 1lh;
}

.dock {
  height: 100%;
  width: 100%;
}
</style>
