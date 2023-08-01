<script setup lang="ts">
import VDialog from "@/components/VDialog.vue";
import { usePages } from "@/stores/pages";
import dayjs from "dayjs";
import { Check, DownloadCloud, UploadCloud } from "lucide-vue-next";
import { computed } from "vue";

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

/* -------------------------------------------------- *
 * Visibility & focus                                 *
 * -------------------------------------------------- */

const localOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

/* -------------------------------------------------- *
 * Page download                                      *
 * -------------------------------------------------- */

const { exportPages, importPages } = usePages();

const canAccessFiles = "showOpenFilePicker" in window;

async function saveToFile() {
  if (!("showSaveFilePicker" in window)) return;

  try {
    const handle = await window.showSaveFilePicker({
      types: [{ accept: { "application/json": [".json"] } }],
      suggestedName: `textflow-${dayjs().format("YYYY-MM-DD")}.json`,
    });

    const writable = await handle.createWritable();
    await writable.write(exportPages());
    await writable.close();

    alert("Backup saved!");
    localOpen.value = false;
  } catch {
    alert("Failed to save backup.");
  }
}

async function openFromFile() {
  if (!("showOpenFilePicker" in window)) return;

  return window
    .showOpenFilePicker({
      multiple: false,
      types: [{ accept: { "application/json": [".json"] } }],
    })
    .then(([handle]) => handle.getFile())
    .then((file) => file.text())
    .then((text) => {
      importPages(text);
      localOpen.value = false;
    })
    .catch(() => alert("Failed to load backup."));
}
</script>

<template>
  <VDialog title="Backup" v-model="localOpen">
    <p>
      Use the buttons below to download or restore a backup of all your pages.
      If you restore a backup, pages that already exist will be overwritten.
      Pages you added since the backup was created will not be affected.
    </p>

    <p :class="$style.error" v-if="!canAccessFiles">
      Your browser does not support this feature.
    </p>

    <div v-else :class="$style.actions">
      <button @click="saveToFile" data-variant="muted">
        <DownloadCloud />Download backup
      </button>
      <button @click="openFromFile" data-variant="muted">
        <UploadCloud />Restore backup
      </button>
    </div>

    <template #footer>
      <button @click="localOpen = false"><Check />Done</button>
    </template>
  </VDialog>
</template>

<style module>
.actions {
  display: flex;
  gap: 0.25rem;
}

.error {
  background: var(--red-50);
  border-radius: var(--border-radius);
  font-weight: var(--font-weight-medium);
  color: var(--red-500);
  padding: 0.5rem 0.75rem;
}
</style>
