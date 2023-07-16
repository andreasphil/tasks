import { mutate } from "@/lib/items";
import { Page, getTitle } from "@/lib/page";
import { parse } from "@/lib/parser";
import { joinLines, splitLines } from "@/lib/text";
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
