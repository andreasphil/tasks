<script setup lang="ts">
import Dialog from "@/components/Dialog.vue";
import { usePages } from "@/stores/pages";
import { fileOpen, fileSave } from "browser-fs-access";
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

async function saveToFile() {
  try {
    await fileSave(new Blob([exportPages()], { type: "application/json" }), {
      mimeTypes: ["application/json"],
      extensions: [".json"],
      fileName: `tasks-${dayjs().format("YYYY-MM-DD")}.json`,
    });

    alert("Backup saved!");
    localOpen.value = false;
  } catch {
    alert("Failed to save backup.");
  }
}

async function openFromFile() {
  try {
    const text = await fileOpen({
      multiple: false,
      mimeTypes: ["application/json"],
      extensions: [".json"],
    }).then((blob) => blob.text());

    importPages(text);
    localOpen.value = false;
  } catch {
    alert("Failed to load backup.");
  }
}
</script>

<template>
  <Dialog title="Backup" v-model="localOpen">
    <p>
      Use the buttons below to download or restore a backup of all your pages.
      If you restore a backup, pages that already exist will be overwritten.
      Pages you added since the backup was created will not be affected.
    </p>

    <div :class="$style.actions">
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
  </Dialog>
</template>

<style module>
.actions {
  display: flex;
  gap: 0.25rem;
}
</style>
