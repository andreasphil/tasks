import {
  computed,
  defineComponent,
  nextTick,
  onUnmounted,
  ref,
  useTemplateRef,
  watch,
} from "vue";
import BaseDialog from "../components/dialog.ts";
import { html } from "../lib/html.ts";
import { Download } from "../lib/icons.ts";
import { usePage } from "../stores/page.ts";

export default defineComponent({
  name: "DownloadDialog",

  components: { BaseDialog },

  props: {
    pageId: { type: String, required: true },
    modelValue: { type: Boolean, default: false },
  },

  emits: ["update:modelValue"],

  setup(props, { emit }) {
    // Visbility ----------------------------------------------

    const visible = computed({
      get() {
        return props.modelValue;
      },
      set(val) {
        emit("update:modelValue", val);
      },
    });

    const confirmButtonEl = useTemplateRef<HTMLButtonElement | null>(
      "confirmButtonEl",
    );

    watch(
      () => props.modelValue,
      async (is, was) => {
        if (!is || is === was) return;
        await nextTick();
        confirmButtonEl.value?.focus();
      },
    );

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
      () => props.modelValue,
      (is, was) => {
        if (is && !was) createDownloadUrl(pageText.value);
        else if (!is && downloadUrl.value)
          URL.revokeObjectURL(downloadUrl.value);
      },
      { immediate: true },
    );

    onUnmounted(() => {
      // Object URLs need to be cleaned up when no longer needed
      if (downloadUrl.value) URL.revokeObjectURL(downloadUrl.value);
    });

    return {
      Download,
      confirmButtonEl,
      downloadUrl,
      pageTitle,
      visible,
    };
  },

  template: html`
    <BaseDialog title="Download page" v-model="visible">
      <p>
        Press the download button below to save a copy of "{{ pageTitle }}" to
        your disk.
      </p>

      <template #footer>
        <button @click="visible = false" variant="secondary">Close</button>
        <a
          :download="\`\${pageTitle}.txt\`"
          :href="downloadUrl"
          ref="confirmButtonEl"
          role="button"
        >
          <span v-html="Download" />Download
        </a>
      </template>
    </BaseDialog>
  `,
});
