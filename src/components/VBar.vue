<script setup lang="ts">
import { Frown } from "lucide-vue-next";
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  watch,
  type Component,
} from "vue";

const props = withDefaults(
  defineProps<{
    hotkey?: KeyboardShortcut;
    limitResults?: number;
  }>(),
  {
    hotkey: () => ({ key: "k", metaKey: true }),
    limitResults: 10,
  }
);

/* -------------------------------------------------- *
 * Visibility                                         *
 * -------------------------------------------------- */

const dialogEl = ref<HTMLDialogElement | null>(null);

const searchEl = ref<HTMLInputElement | null>(null);

const isOpen = ref(false);

watch(isOpen, (is, was) => {
  if (is === was) return;
  else if (is) dialogEl.value?.showModal();
  else dialogEl.value?.close();
});

async function toggle(open = !isOpen.value) {
  isOpen.value = open;

  if (!open) {
    query.value = "";
    focusedResult.value = 0;
  } else {
    await nextTick();
    searchEl.value?.focus();
  }
}

function onEscape() {
  if (query.value) {
    query.value = "";
    focusedResult.value = 0;
  } else toggle(false);
}

function onToggleShortcut(e: KeyboardEvent) {
  let match = Object.entries(props.hotkey).reduce((match, [key, value]) => {
    return match && e[key as keyof KeyboardEvent] === value;
  }, true);

  if (!match) return;

  toggle();
  e.preventDefault();
  e.stopPropagation();
}

onMounted(() => {
  addEventListener("keydown", onToggleShortcut);
});

onBeforeUnmount(() => {
  removeEventListener("keydown", onToggleShortcut);
});

/* -------------------------------------------------- *
 * Command registration                               *
 * -------------------------------------------------- */

const commands = ref<VBarCommand[]>([]);

const chords = computed<Map<string, VBarCommand>>(() =>
  commands.value
    .filter((c) => Boolean(c.chord))
    .reduce(
      (all, current) => all.set(current.chord!, current),
      new Map<string, VBarCommand>()
    )
);

function registerCommand(...toRegister: VBarCommand[]): () => void {
  const ids = toRegister.map((c) => c.id);
  removeCommand(...ids);
  commands.value = [...commands.value, ...toRegister];

  return () => removeCommand(...ids);
}

function removeCommand(...toRemove: string[]): void {
  commands.value = commands.value.filter((c) => !toRemove.includes(c.id));

  if (mostRecent.value && toRemove.includes(mostRecent.value.id)) {
    mostRecent.value = null;
  }
}

function runCommand(command: VBarCommand) {
  command.action();
  mostRecent.value = command;
  toggle(false);
}

/* -------------------------------------------------- *
 * Repeatable commands                                *
 * -------------------------------------------------- */

const mostRecent = ref<VBarCommand | null>(null);

function runMostRecent() {
  if (mostRecent.value) runCommand(mostRecent.value);
}

function onRunMostRecent(e: KeyboardEvent) {
  if (!(e.metaKey && e.key === ".")) return;

  e.preventDefault();
  e.stopPropagation();
  runMostRecent();
}

onMounted(() => {
  addEventListener("keydown", onRunMostRecent);
});

onBeforeUnmount(() => {
  removeEventListener("keydown", onRunMostRecent);
});

/* -------------------------------------------------- *
 * Searching and running                              *
 * -------------------------------------------------- */

const query = ref("");

const focusedResult = ref(0);

const filteredCommands = computed(() => {
  if (!query.value) return [];

  const queryTokens = query.value.toLowerCase().split(" ");

  const result: Array<VBarCommand & { chordMatch?: true }> = commands.value
    .filter((i) => {
      const commandStr = [i.name, ...(i.alias ?? []), i.groupName ?? ""]
        .join(" ")
        .toLowerCase();

      return queryTokens.every((token) => commandStr.includes(token));
    })
    .slice(0, props.limitResults);

  const matchingChord = chords.value.get(query.value);
  if (matchingChord) result.unshift({ ...matchingChord, chordMatch: true });

  return result;
});

function moveFocusDown() {
  const next = focusedResult.value + 1;
  focusedResult.value = Math.min(filteredCommands.value.length - 1, next);
}

function moveFocusUp() {
  focusedResult.value = Math.max(focusedResult.value - 1, 0);
}

function runFocusedCommand() {
  const command = filteredCommands.value[focusedResult.value];
  if (command) runCommand(command);
}

/* -------------------------------------------------- *
 * Public interface                                   *
 * -------------------------------------------------- */

provide(VBarContext, {
  registerCommand,
  removeCommand,
  open: () => toggle(true),
});
</script>

<script lang="ts">
import { InjectionKey } from "vue";

export type KeyboardShortcut = Partial<
  Pick<KeyboardEvent, "key" | "metaKey" | "altKey" | "ctrlKey" | "shiftKey">
>;

export type VBarCommand = {
  id: string;
  name: string;
  alias?: string[];
  chord?: string;
  groupName?: string;
  icon?: Component;
  action: () => void;
};

export const VBarContext: InjectionKey<{
  registerCommand: (...toRegister: VBarCommand[]) => () => void;
  removeCommand: (...toRemove: string[]) => void;
  open: () => void;
}> = Symbol();
</script>

<template>
  <slot />

  <dialog
    :class="$style.vbar"
    @close="isOpen = false"
    @keydown.down.stop.prevent="moveFocusDown()"
    @keydown.enter.stop.prevent="runFocusedCommand()"
    @keydown.escape.stop.prevent="onEscape()"
    @keydown.up.stop.prevent="moveFocusUp()"
    ref="dialogEl"
  >
    <!-- Search field -->
    <header :class="$style.header">
      <label>
        <span data-hidden>Search pages and actions</span>
        <input
          placeholder="Search pages and actions"
          ref="searchEl"
          type="search"
          v-model="query"
        />
      </label>
    </header>

    <div :class="$style.body" data-with-fallback>
      <!-- Commands list -->
      <ul :class="$style.resultsList">
        <li v-for="(c, i) in filteredCommands" :key="c.id">
          <button
            :class="{
              [$style.result]: true,
              [$style.focused]: i === focusedResult,
              [$style.chordMatch]: c.chordMatch,
            }"
            @click="runCommand(c)"
          >
            <component v-if="c.icon" :is="c.icon" />
            <template v-if="c.groupName">
              <span :class="$style.groupName">{{ c.groupName }}</span>
              <span :class="$style.groupName">&rsaquo;</span>
            </template>
            <span data-clamp :title="c.name">{{ c.name }}</span>
            <span v-if="c.chord" :class="$style.chord">{{ c.chord }}</span>
          </button>
        </li>
      </ul>

      <div v-if="query" data-when="empty">
        <Frown />
        <p>Sorry, couldn't find anything.</p>
      </div>
    </div>
  </dialog>
</template>

<style module>
.vbar {
  max-width: 30rem;
  width: 100%;
}

.body {
  max-height: calc(80dvh - 12rem);
  overflow: auto;
}

.body > * {
  margin-top: 0.625rem;
}

.resultsList {
  list-style-type: none;
  margin: 0.625rem 0 0 0;
  padding: 0;
}

.result {
  --\$button-bg: transparent;
  --\$button-fg: var(--c-fg);
  --\$button-hover-bg: var(--c-surface-variant-bg);
  --\$button-outline-offset: var(--outline-inset);

  justify-content: start;
  padding: 0.375rem 0.5rem;
  text-align: left;
  width: 100%;
}

.result.focused {
  --\$button-bg: var(--c-surface-variant-bg);
}

.result.chordMatch {
  --\$button-bg: var(--indigo-50);
  --\$button-fg: var(--indigo-500);
  --\$button-hover-bg: var(--indigo-100);
}

.result.chordMatch .groupName {
  color: var(--indigo-400);
}

.result.chordMatch .chord {
  border-color: var(--indigo-200);
  color: var(--indigo-400);
}

.groupName {
  color: var(--c-fg-variant);
  display: inline-block;
  flex: none;
  font-weight: var(--font-weight-normal);
}

.chord {
  background: var(--c-surface-bg);
  border-radius: var(--border-radius-small);
  border: var(--border-width) solid var(--c-border);
  color: var(--c-fg-variant);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-mono);
  margin-left: auto;
  padding: 0 0.25rem;
}
</style>
