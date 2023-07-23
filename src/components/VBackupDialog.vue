<script setup lang="ts">
import VDialog from "@/components/VDialog.vue";
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

const { title, text } = usePage(props.pageId);

const downloadableBlob = ref<string | undefined>(undefined);

function createDownloadableBlob(source: string | undefined) {
  if (downloadableBlob.value) URL.revokeObjectURL(downloadableBlob.value);

  if (!source) {
    downloadableBlob.value = undefined;
  } else {
    const blob = new Blob([source], { type: "text/plain" });
    downloadableBlob.value = URL.createObjectURL(blob);
  }
}

watch(text, (is) => createDownloadableBlob(is), { immediate: true });

onUnmounted(() => {
  // Object URLs need to be cleaned up when no longer needed
  if (downloadableBlob.value) URL.revokeObjectURL(downloadableBlob.value);
});
</script>

<template>
  <VDialog title="Download page" v-model="localOpen">
    <p>
      Press the download button below to save a copy of "{{ title }}" to your
      disk.
    </p>

    <template #footer>
      <button @click="localOpen = false" data-variant="ghost">Close</button>
      <a
        :download="`${title}.txt`"
        :href="downloadableBlob"
        @click="localOpen = false"
        ref="confirmButtonEl"
        role="button"
      >
        <Download />Download
      </a>
    </template>
  </VDialog>
</template>
