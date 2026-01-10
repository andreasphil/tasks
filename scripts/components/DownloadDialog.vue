<script setup lang="ts">
import { nextTick, onUnmounted, ref, useTemplateRef, watch } from "vue";
import BaseDialog from "../components/BaseDialog.vue";
import { Download } from "../lib/icons.ts";
import { usePage } from "../stores/page.ts";

const props = defineProps<{
  pageId: string;
}>();

const visible = defineModel<boolean>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

// Visbility ----------------------------------------------

const confirmButtonEl = useTemplateRef<HTMLButtonElement | null>(
  "confirmButtonEl",
);

watch(visible, async (is, was) => {
  if (!is || is === was) return;
  await nextTick();
  confirmButtonEl.value?.focus();
});

// Page download ------------------------------------------

const { pageTitle, pageText } = usePage(() => props.pageId);

const downloadUrl = ref<string | undefined>(undefined);

function createDownloadUrl(source: string | undefined) {
  if (downloadUrl.value) URL.revokeObjectURL(downloadUrl.value);

  if (!source) downloadUrl.value = undefined;
  else {
    const blob = new Blob([source], { type: "text/plain" });
    downloadUrl.value = URL.createObjectURL(blob);
  }
}

watch(
  visible,
  (is, was) => {
    if (is && !was) createDownloadUrl(pageText.value);
    else if (!is && downloadUrl.value) URL.revokeObjectURL(downloadUrl.value);
  },
  { immediate: true },
);

onUnmounted(() => {
  // Object URLs need to be cleaned up when no longer needed
  if (downloadUrl.value) URL.revokeObjectURL(downloadUrl.value);
});
</script>

<template>
  <BaseDialog title="Download page" v-model="visible" small>
    <p>
      Press the download button below to save a copy of "{{ pageTitle }}" to
      your disk.
    </p>

    <template #footer>
      <button @click="visible = false" variant="secondary">Close</button>
      <a
        :download="`${pageTitle}.txt`"
        :href="downloadUrl"
        ref="confirmButtonEl"
        role="button"
      >
        <span v-html="Download" />Download
      </a>
    </template>
  </BaseDialog>
</template>
