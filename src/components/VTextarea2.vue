<script setup lang="ts" generic="RowContext extends Record<string, any>">
import {
  continueList,
  continueListRules,
  flip,
  getCursorInLine,
  getRangeFromSelectedLines,
  getSelectedLines,
  indent,
  joinLines,
  mergeList,
  splitLines,
  type ContinueListRule,
  type IndentMode,
} from "@/lib/text";
import { computed, nextTick, ref, watch, watchEffect } from "vue";

type ContextProvider = (row: string) => RowContext;

const props = withDefaults(
  defineProps<{
    allowFlipLines?: boolean;
    contextProvider?: ContextProvider;
    continueLists?: false | ContinueListRule[];
    cutFullLine?: boolean;
    insertTabs?: boolean;
    mergeListsOnPaste?: boolean;
    modelValue: string;
    readonly?: boolean;
    scrollBeyondLastLine?: boolean | number;
    spellcheck?: boolean;
    tabSize?: number;
  }>(),
  {
    allowFlipLines: true,
    contextProvider: (_: string) => ({} as RowContext),
    continueLists: () => Object.values(continueListRules),
    cutFullLine: true,
    insertTabs: true,
    mergeListsOnPaste: true,
    readonly: false,
    scrollBeyondLastLine: true,
    spellcheck: true,
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
 * Model value handling                               *
 * -------------------------------------------------- */

function setLocalModelValue(value: string | string[]): void {
  const stringValue = Array.isArray(value) ? joinLines(value) : value;
  emit("update:modelValue", stringValue);
}

function onInput(event: Event): void {
  if (!(event.target instanceof HTMLTextAreaElement)) return;
  setLocalModelValue(event.target.value);
}

const rows = computed(() => splitLines(props.modelValue));

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

watch(
  () => props.modelValue,
  () => {
    if (textareaEl.value) determineEditorHeight();
  }
);

const overscroll = computed<string | undefined>(() => {
  if (props.scrollBeyondLastLine === true) return "18rem";
  else if (typeof props.scrollBeyondLastLine === "number") {
    return `${props.scrollBeyondLastLine}rem`;
  } else return undefined;
});

/* -------------------------------------------------- *
 * Selection management                               *
 * -------------------------------------------------- */

async function adjustSelection(
  opts: AdjustSelectionOpts,
  tick = true
): Promise<void> {
  if (!textareaEl.value) return;
  const { selectionStart, selectionEnd } = textareaEl.value;
  if (tick) await nextTick();

  // Set the selection to a new range, ignoring the current selection
  if (opts.to === "absolute") {
    textareaEl.value.setSelectionRange(opts.start, opts.end ?? opts.start);
  }

  // Shift the current selection by a delta. If `collapse` is true, the end of
  // the selection will be moved to the start of the selection, even if a range
  // was selected before.
  else if (opts.to === "relative") {
    const start = selectionStart + opts.delta;
    const end = opts.collapse ? start : selectionEnd + opts.delta;
    textareaEl.value.setSelectionRange(start, end);
  }

  // Sets the selection to the start of the specified line
  else if (opts.to === "startOfLine") {
    const [start] = getRangeFromSelectedLines(rows.value, opts.startOf);
    textareaEl.value.setSelectionRange(start, start);
  }

  // Sets the selection to the end of the specified line
  else if (opts.to === "endOfLine") {
    const [, end] = getRangeFromSelectedLines(rows.value, opts.endOf);
    textareaEl.value.setSelectionRange(end, end);
  }

  // Sets the selection to a range spanning the specified lines
  else if (opts.to === "lines") {
    const [s, e] = getRangeFromSelectedLines(rows.value, opts.start, opts.end);
    textareaEl.value.setSelectionRange(s, e);
  }
}

/* -------------------------------------------------- *
 * Tab handling                                       *
 * -------------------------------------------------- */

function onInsertTab(event: KeyboardEvent): void {
  const newRows = [...rows.value];
  const mode: IndentMode = event.shiftKey ? "outdent" : "indent";

  withContext(({ adjustSelection, selectedLines }) => {
    const [from, to] = selectedLines;

    const toIndent = newRows.slice(from, to + 1);
    const indented = indent(toIndent, mode);

    // Nothing to do if nothing has changed
    if (toIndent.every((r, i) => r === indented[i])) return;

    newRows.splice(from, to - from + 1, ...indented);
    setLocalModelValue(newRows);

    if (from === to) {
      adjustSelection({ to: "relative", delta: mode === "indent" ? 1 : -1 });
    } else {
      adjustSelection({ to: "lines", start: from, end: to });
    }
  });
}

/* -------------------------------------------------- *
 * List continuation                                  *
 * -------------------------------------------------- */

function onContinueList(): void {
  const newRows = [...rows.value];
  const rules = props.continueLists ? props.continueLists : [];

  withContext(({ selectionStart, selectedLines, adjustSelection }) => {
    const [lineNr] = selectedLines;
    const cursorInLine = getCursorInLine(props.modelValue, selectionStart);

    const continued = continueList(newRows[lineNr], rules, cursorInLine);
    newRows.splice(lineNr, 1, continued.current);
    if (continued.next !== null) newRows.splice(lineNr + 1, 0, continued.next);
    setLocalModelValue(newRows);

    if ("didContinue" in continued && continued.didContinue) {
      adjustSelection({ to: "relative", delta: continued.match.length + 1 });
    } else if ("didEnd" in continued && continued.didEnd) {
      adjustSelection({ to: "startOfLine", startOf: lineNr });
    } else {
      adjustSelection({ to: "relative", delta: 1 });
    }
  });
}

/* -------------------------------------------------- *
 * Flipping lines                                     *
 * -------------------------------------------------- */

function onFlip(direction: "up" | "down"): void {
  const newRows = [...rows.value];

  withContext(({ selectedLines, adjustSelection }) => {
    const [lineNr, endLineNr] = selectedLines;
    const to = direction === "up" ? lineNr - 1 : lineNr + 1;

    if (lineNr !== endLineNr || to < 0 || to >= newRows.length) return;

    const [flippedFrom, flippedTo] = flip(newRows[lineNr], newRows[to]);
    newRows[lineNr] = flippedFrom;
    newRows[to] = flippedTo;
    setLocalModelValue(newRows);

    adjustSelection({ to: "endOfLine", endOf: to });
  });
}

/* -------------------------------------------------- *
 * Cutting and pasting                                *
 * -------------------------------------------------- */

function onCut(event: KeyboardEvent): void {
  const newRows = [...rows.value];

  withContext(async ({ selectedLines, adjustSelection }) => {
    const [lineNr, endLineNr] = selectedLines;
    if (lineNr !== endLineNr) return;

    event.preventDefault();

    await navigator.clipboard.writeText(newRows[lineNr]);
    newRows.splice(lineNr, 1);
    setLocalModelValue(newRows);

    const newLinNr = Math.min(lineNr, newRows.length - 1);
    adjustSelection({ to: "startOfLine", startOf: newLinNr });
  });
}

function onPaste(event: ClipboardEvent): void {
  const payload = event.clipboardData?.getData("text/plain");
  const newRows = [...rows.value];

  withContext(({ selectedLines, adjustSelection }) => {
    if (!payload || !props.continueLists) return;

    const [lineNr, endLineNr] = selectedLines;
    if (lineNr !== endLineNr) return;

    const merge = mergeList(newRows[lineNr], payload, props.continueLists);
    if (merge === null) return;

    event.preventDefault();

    newRows[lineNr] = merge.current;
    setLocalModelValue(newRows);

    adjustSelection({
      to: "relative",
      delta: merge.current.length - merge.match.length,
      collapse: true,
    });
  });
}

/* -------------------------------------------------- *
 * Public interface                                   *
 * -------------------------------------------------- */

function focus(selection?: AdjustSelectionOpts): void {
  textareaEl.value?.focus();
  if (selection) adjustSelection(selection);
}

async function withContext(
  callback: (ctx: EditingContext) => void | Promise<void>,
  options: { ignoreReadonly?: boolean } = { ignoreReadonly: false }
): Promise<void> {
  if (!textareaEl.value || (props.readonly && !options.ignoreReadonly)) return;

  const { selectionStart, selectionEnd } = textareaEl.value;

  await callback({
    adjustSelection,
    focus,
    selectedLines: getSelectedLines(rows.value, selectionStart, selectionEnd),
    selectionEnd,
    selectionStart,
  });
}

defineExpose({ withContext });
</script>

<script lang="ts">
export type AdjustSelectionOpts =
  | { to: "absolute"; start: number; end?: number }
  | { to: "relative"; delta: number; collapse?: boolean }
  | { to: "startOfLine"; startOf: number }
  | { to: "endOfLine"; endOf: number }
  | { to: "lines"; start: number; end: number };

export type EditingContext = {
  adjustSelection: (opts: AdjustSelectionOpts, tick?: boolean) => Promise<void>;
  focus: (selection?: AdjustSelectionOpts) => void;
  selectedLines: [from: number, to: number];
  selectionStart: number;
  selectionEnd: number;
};
</script>

<template>
  <div
    :class="{ [$style.wrapper]: true, [$style.wrapperReadonly]: readonly }"
    @click="focus()"
  >
    <textarea
      :class="$style.textarea"
      :readonly
      :spellcheck
      :value="props.modelValue"
      @input="onInput"
      @keydown.alt.down.prevent="allowFlipLines ? onFlip('down') : undefined"
      @keydown.alt.up.prevent="allowFlipLines ? onFlip('up') : undefined"
      @keydown.enter.prevent="continueLists ? onContinueList() : undefined"
      @keydown.meta.x="cutFullLine ? onCut($event) : undefined"
      @keydown.tab.prevent="insertTabs ? onInsertTab($event) : undefined"
      @paste="mergeListsOnPaste ? onPaste($event) : undefined"
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

.wrapperReadonly {
  cursor: unset;
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
</style>
