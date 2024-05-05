import { getTitle } from "@/lib/structuredPage";
import { usePages } from "@/stores/structuredPages";
import { joinLines } from "@andreasphil/vue-textarea2/text";
import { computed, readonly, toValue, type MaybeRefOrGetter } from "vue";

export function usePage(id: MaybeRefOrGetter<string>) {
  const { pages } = usePages();

  const page = computed(() => {
    const idVal = toValue(id);
    return pages[idVal];
  });

  /* -------------------------------------------------- *
   * Metadata                                           *
   * -------------------------------------------------- */

  const exists = computed<boolean>(() => Boolean(page.value));

  const title = computed<string | undefined>(() =>
    page.value ? getTitle(page.value) : undefined
  );

  /* -------------------------------------------------- *
   * Text content                                       *
   * -------------------------------------------------- */

  const text = computed<string | undefined>({
    get() {
      const rawItems = page.value?.items.map((item) => item.raw);
      return rawItems ? joinLines(rawItems) : undefined;
    },
    set() {
      // TODO: Update page based on text changes
    },
  });

  /* -------------------------------------------------- *
   * Parsed content                                     *
   * -------------------------------------------------- */

  // TODO: Update page based on individual item changes

  return {
    page: readonly(page),
    pageExists: readonly(exists),
    pageText: readonly(text),
    pageTitle: readonly(title),
  };
}
