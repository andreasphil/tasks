import { WritableItem, asWritable } from "@/lib/items";
import { Page, getTitle } from "@/lib/page";
import { Item, parse, stringify } from "@/lib/parser";
import { splitLines } from "@/lib/text";
import { usePages } from "@/stores/pages";
import { MaybeRefOrGetter, computed, readonly, toValue } from "vue";

export function usePage(id: MaybeRefOrGetter<string>) {
  const { pages, updatePage } = usePages();

  const page = computed<Page | undefined>(() => {
    const idVal = toValue(id);
    return pages.find((i) => i.id === idVal);
  });

  /* -------------------------------------------------- *
   * Metadata                                           *
   * -------------------------------------------------- */

  const exists = computed<boolean>(() => !!page.value);

  const title = computed<string | undefined>(() =>
    page.value ? getTitle(page.value) : undefined
  );

  /* -------------------------------------------------- *
   * Raw content                                        *
   * -------------------------------------------------- */

  const text = computed<string | undefined>({
    get: () => page.value?.text,
    set: (value) => {
      updatePage(toValue(id), { text: value });
    },
  });

  /* -------------------------------------------------- *
   * Parsed content                                     *
   * -------------------------------------------------- */

  const items = computed(() =>
    splitLines(text.value || "").map((i) => parse(i))
  );

  function updateItem(
    index: number,
    factory: (original: WritableItem) => Item
  ) {
    const newItems = [...items.value];
    newItems[index] = factory(asWritable(newItems[index]));
    text.value = newItems.map((i) => stringify(i)).join("\n");
  }

  return {
    exists,
    items,
    page: readonly(page),
    text,
    title,
    updateItem,
  };
}
