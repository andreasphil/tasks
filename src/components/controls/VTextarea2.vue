<script setup lang="ts" generic="RowContext extends Record<string, any>">
import { computed, nextTick, ref, watch, watchEffect } from "vue";

type ContextProvider = (row: string) => RowContext;

type ContinueListRule = {
  pattern: RegExp;
  next: "same" | ((match: string) => string);
};

type ContinueListResult = {
  /** Updated input line, might have been split if a cursor was given */
  current: string;
  /** Newly created line */
  next: string;
} & (
  | {
      /** Indicates that a rule has matched */
      didContinue: true;
      /** List marker as returned by the matching rule */
      match: string;
    }
  | {
      /** Indicates that no rule has matched */
      didContinue: false;
    }
);
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
    continueLists: () => [
      { pattern: /^\t*[-*] /, next: "same" },
      { pattern: /^\t+/, next: "same" },
      {
        pattern: /^\t*\d+\. /,
        next: (match) => `${Number.parseInt(match) + 1}. `,
      },
    ],
    dock: false,
    insertTabs: true,
    scrollBeyondLastLine: true,
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

/** Splits a string in two at the specified index. */
function splitAt(text: string, index: number): [string, string] {
  return [text.slice(0, index), text.slice(index)];
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
  value: string | string[],
  from: number,
  to = from
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
  value: string | string[],
  from: number,
  to = from
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

/**
 * Given a line and a list of rules, checks if the line is a list as defined by
 * one of the rules. If so, it continues the list on the next line, otherwise
 * an empty next line is returned. If a cursor is given, the line is split at
 * the cursor and the continuation text is inserted between the two parts.
 *
 * @param line The line to check
 * @param rules The rules to check against
 * @param cursor The cursor position to split the line at, defaults to end of line
 */
function continueList(
  line: string,
  rules: ContinueListRule[],
  cursor = line.length
): ContinueListResult {
  let continueWith: ContinueListRule["next"] | undefined = undefined;
  let match: RegExpMatchArray | null = null;

  // Find the first matching rule
  for (let i = 0; i < rules.length && !continueWith; i++) {
    match = line.match(rules[i].pattern);
    if (match) continueWith = rules[i].next;
  }

  // Generate the new lines by: 1) splitting the first line where the cursor is
  // (or at the end if no cursor is given), 2) adding a new line with the
  // continuation text, and 3) adding the rest of the line.
  let [current, next] = splitAt(line, cursor);

  if (match && continueWith) {
    if (continueWith === "same") next = match[0] + next;
    else next = continueWith(match[0]) + next;
  }

  return {
    current,
    next,
    didContinue: !!match && !!continueWith,
    match: match?.[0] ?? "",
  };
}

/**
 * For a cursor (e.g. selectionStart in a textarea) in a value, returns the
 * position of the cursor relative to the line it is on.
 *
 * @param value The value containing the cursor
 * @param cursor The position of the cursor
 */
function getCursorInLine(value: string, cursor: number): number {
  const beforeCursor = value.slice(0, cursor);
  const lineStart = beforeCursor.lastIndexOf("\n") + 1;
  return cursor - lineStart;
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

  const newRows = [...rows.value];
  const { selectionStart, selectionEnd } = textareaEl.value;
  const [from, to] = getSelectedLines(newRows, selectionStart, selectionEnd);
  const mode: "indent" | "outdent" = event.shiftKey ? "outdent" : "indent";

  // TODO: Refactor to have this in utilities
  if (mode === "indent") {
    // Insert tab at the beginning of each selected line (unless it's empty)
    for (let i = from; i <= to; i++) newRows[i] = `\t${newRows[i]}`;
  } else {
    // Remove tab from the beginning of each selected line
    for (let i = from; i <= to; i++) {
      if (newRows[i].startsWith("\t")) {
        newRows[i] = newRows[i].slice(1);
      }
    }
  }

  setLocalModelValue(newRows.join("\n"));

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

  setLocalModelValue(newRows.join("\n"));

  await nextTick();

  let start = selectionStart + 1;
  if (continued.didContinue) start += continued.match.length;
  textareaEl.value?.setSelectionRange(start, start);
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
      @keydown.enter="continueLists ? onContinueList($event) : undefined"
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

.row {
  min-height: 1lh;
}

.dock {
  height: 100%;
  width: 100%;
}
</style>
