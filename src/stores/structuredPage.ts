import { mutate } from "@/lib/item";
import { parseWithMemo } from "@/lib/parser";
import { getTitle } from "@/lib/structuredPage";
import { usePages } from "@/stores/structuredPages";
import { joinLines, splitLines } from "@andreasphil/vue-textarea2/text";
import { computed, readonly, toValue, unref, type MaybeRefOrGetter } from "vue";

export function usePage(id: MaybeRefOrGetter<string>) {
  const { pages, updatePage } = usePages();

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
    set(value) {
      if (!page.value) return;
      const items = splitLines(value ?? "").map((line) => parseWithMemo(line));
      updatePage(toValue(id), { items });
    },
  });

  /* -------------------------------------------------- *
   * Parsed content                                     *
   * -------------------------------------------------- */

  function updateItem(
    index: number,
    factory: Parameters<typeof mutate>[1]
  ): void {
    if (!page.value) return;
    const newItems = [...page.value.items];
    newItems[index] = mutate(newItems[index], factory);
    updatePage(toValue(id), { items: newItems });
  }

  return {
    page: readonly(page),
    pageExists: readonly(exists),
    pageText: text,
    pageTitle: readonly(title),
    updateOnPage: updateItem,
  };
}
