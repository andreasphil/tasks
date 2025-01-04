import { mutate } from "@/lib/item";
import { getTitle } from "@/lib/page";
import { parse } from "@/stores/appParser";
import { usePages } from "@/stores/pages";
import { computed, readonly, toValue, type MaybeRefOrGetter } from "vue";

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
      return rawItems ? rawItems.join("\n") : undefined;
    },
    set(value) {
      if (!page.value) return;

      const items = (value ?? "")
        .split("\n")
        .map((line) => parse.withMemo(line));

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
