<script setup lang="ts">
import Dialog from "@/components/Dialog.vue";
import { usePage } from "@/stores/page";
import { Download } from "lucide-vue-next";
import { computed, nextTick, onUnmounted, ref, watch } from "vue";

const props = defineProps<{
  modelValue: boolean;
  pageId: string;
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

const confirmButtonEl = ref<HTMLButtonElement | null>(null);

watch(localOpen, async (is, was) => {
  if (!is || is === was) return;
  await nextTick();
  confirmButtonEl.value?.focus();
});

/* -------------------------------------------------- *
 * Page download                                      *
 * -------------------------------------------------- */

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
  () => props.modelValue,
  (is, was) => {
    if (is && !was) createDownloadUrl(pageText.value);
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
  <Dialog title="Download page" v-model="localOpen">
    <p>
      Press the download button below to save a copy of "{{ pageTitle }}" to your
      disk.
    </p>

    <template #footer>
      <button @click="localOpen = false" data-variant="ghost">Close</button>
      <a
        :download="`${pageTitle}.txt`"
        :href="downloadUrl"
        ref="confirmButtonEl"
        role="button"
      >
        <Download />Download
      </a>
    </template>
  </Dialog>
</template>
