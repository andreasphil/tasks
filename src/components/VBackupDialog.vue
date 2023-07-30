<script setup lang="ts">
import VDialog from "@/components/VDialog.vue";
import { usePages } from "@/stores/pages";
import { DownloadCloud, UploadCloud } from "lucide-vue-next";
import { computed, onUnmounted, ref, watch } from "vue";

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

const { exportPages } = usePages();

const downloadUrl = ref<string | undefined>(undefined);

function createDownloadUrl(source: string | undefined) {
  if (downloadUrl.value) URL.revokeObjectURL(downloadUrl.value);

  if (!source) downloadUrl.value = undefined;
  else {
    const blob = new Blob([source], { type: "application/json" });
    downloadUrl.value = URL.createObjectURL(blob);
  }
}

watch(
  () => props.modelValue,
  (is, was) => {
    if (is && !was) createDownloadUrl(exportPages());
    else if (!is && downloadUrl.value) URL.revokeObjectURL(downloadUrl.value);
  },
  { immediate: true }
);

onUnmounted(() => {
  // Object URLs need to be cleaned up when no longer needed
  if (downloadUrl.value) URL.revokeObjectURL(downloadUrl.value);
});
</script>

<template>
  <VDialog title="Backup" v-model="localOpen">
    <p>
      Use the buttons below to download or restore a backup of all your pages.
      If you restore a backup, pages that already exist will be overwritten.
      Pages you added since the backup was created will not be affected.
    </p>

    <div :class="$style.actions">
      <a
        :href="downloadUrl"
        data-variant="muted"
        download="textflow.json"
        role="button"
      >
        <DownloadCloud />Download backup
      </a>

      <button data-variant="muted" disabled>
        <UploadCloud />Restore backup
      </button>
    </div>

    <template #footer>
      <button @click="localOpen = false">Done</button>
    </template>
  </VDialog>
</template>

<style module>
.actions {
  display: flex;
  gap: 0.5rem;
}

.actions * {
  flex: 1;
}
</style>
