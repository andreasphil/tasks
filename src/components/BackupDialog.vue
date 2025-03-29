<script setup lang="ts">
import Dialog from "@/components/Dialog.vue";
import { usePages } from "@/stores/pages";
import { fileOpen, fileSave } from "browser-fs-access";
import dayjs from "dayjs";
import { Check, DownloadCloud, UploadCloud } from "lucide-static";

// Visibility ---------------------------------------------

const visible = defineModel({ default: false });

// Backups ------------------------------------------------

const { importBackup, exportBackup } = usePages();

async function saveToFile() {
  try {
    await fileSave(new Blob([exportBackup()], { type: "application/json" }), {
      mimeTypes: ["application/json"],
      extensions: [".json"],
      fileName: `tasks-${dayjs().format("YYYY-MM-DD")}.json`,
    });

    alert("Backup saved!");
    visible.value = false;
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

    importBackup(text);
    visible.value = false;
  } catch {
    alert("Failed to load backup.");
  }
}
</script>

<template>
  <Dialog title="Backup" v-model="visible">
    <p>
      Use the buttons below to download or restore a backup of all your pages.
      If you restore a backup, pages that already exist will be overwritten.
      Pages you added since the backup was created will not be affected.
    </p>

    <div :class="$style.actions">
      <button @click="saveToFile" data-variant="muted">
        <span v-html="DownloadCloud" />Download backup
      </button>
      <button @click="openFromFile" data-variant="muted">
        <span v-html="UploadCloud" />Restore backup
      </button>
    </div>

    <template #footer>
      <button @click="visible = false"><span v-html="Check" />Done</button>
    </template>
  </Dialog>
</template>

<style module>
.actions {
  display: flex;
  gap: 0.25rem;
}
</style>
