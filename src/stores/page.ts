import { mutate } from "@/lib/item";
import { getTitle, type Page } from "@/lib/page";
import { parse } from "@/lib/parser";
import { usePages } from "@/stores/pages";
import { joinLines, splitLines } from "@andreasphil/vue-textarea2/text";
import { computed, readonly, toValue, type MaybeRefOrGetter } from "vue";

export function usePage(id: MaybeRefOrGetter<string>) {
  const { pages, updatePage } = usePages();

  const page = computed<Page | undefined>(() => {
    const idVal = toValue(id);
    return pages[idVal];
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

  function updateItem(
    index: number,
    factory: Parameters<typeof mutate>[1]
  ): void {
    const lines = splitLines(text.value ?? "");
    if (index >= lines.length) return;

    const item = parse(lines[index]);
    mutate(item, factory);
    lines[index] = item.raw;

    text.value = joinLines(lines);
  }

  return {
    exists,
    page: readonly(page),
    text,
    title,
    updateItem,
  };
}
