<script setup lang="ts">
import VEmpty from "@/components/VEmpty.vue";
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
  }>(),
  {
    hotkey: () => ({ key: "k", metaKey: true }),
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

const commands = ref<Command[]>([]);

function registerCommand(...toRegister: Command[]): () => void {
  const ids = toRegister.map((c) => c.id);
  removeCommand(...ids);
  commands.value = [...commands.value, ...toRegister];

  return () => removeCommand(...ids);
}

function removeCommand(...toRemove: string[]): void {
  commands.value = commands.value.filter((c) => !toRemove.includes(c.id));
}

function runCommand(command: Command) {
  command.action();
  toggle(false);
}

/* -------------------------------------------------- *
 * Searching and running                              *
 * -------------------------------------------------- */

const query = ref("");

const focusedResult = ref(0);

const filteredCommands = computed(() => {
  if (!query.value) return [];

  return commands.value.filter((command) => {
    return [command.name, ...(command.alias ?? []), command.groupName ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(query.value.toLowerCase());
  });
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

export type Command = {
  id: string;
  name: string;
  alias?: string[];
  groupName?: string;
  icon?: Component;
  action: () => void;
};

export const VBarContext: InjectionKey<{
  registerCommand: (...toRegister: Command[]) => () => void;
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

    <div :class="$style.body">
      <!-- Commands list -->
      <ul v-if="filteredCommands?.length" :class="$style.resultsList">
        <li v-for="(c, i) in filteredCommands" :key="c.id">
          <button
            :class="[$style.result, { [$style.focused]: i === focusedResult }]"
            @click="runCommand(c)"
          >
            <component v-if="c.icon" :is="c.icon" />
            <template v-if="c.groupName">
              <span :class="$style.groupName">{{ c.groupName }}</span>
              <span :class="$style.groupName">&rsaquo;</span>
            </template>
            <span data-clamp :title="c.name">{{ c.name }}</span>
          </button>
        </li>
      </ul>

      <!-- Empty state -->
      <VEmpty v-else-if="query" :icon="Frown" />
    </div>
  </dialog>
</template>

<style module>
.vbar {
  max-width: 30rem;
  width: 100%;
}

.body:not(:empty) {
  margin-top: 0.625rem;
  max-height: calc(80dvh - 12rem);
  overflow: auto;
}

.resultsList {
  list-style-type: none;
  margin: 0;
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

.groupName {
  color: var(--c-fg-variant);
  display: inline-block;
  flex: none;
  font-weight: var(--font-weight-normal);
}
</style>
